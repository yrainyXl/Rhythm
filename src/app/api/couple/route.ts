import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'
import { createPgPool } from '@/lib/cloudbase/server'

export const runtime = 'nodejs'

/**
 * GET /api/couple - 拉取当前用户的 couple 状态。
 * 返回: { couple, partner, myInvite }。
 * partner 通过查 couple_members 关联 profiles 取对方面 昵称。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    // 1. 查我的 couple 成员记录
    const memberRes = await db.query<{ couple_id: string }>(
      `SELECT couple_id FROM public.couple_members WHERE user_id = $1`,
      [userId],
    )

    if (memberRes.rows.length === 0) {
      // 无 couple:查我发出的 pending 邀请
      const inviteRes = await db.query(
        `SELECT * FROM public.couple_invites
         WHERE inviter_id = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      )
      return NextResponse.json({ couple: null, partner: null, myInvite: inviteRes.rows[0] ?? null })
    }

    const coupleId = memberRes.rows[0].couple_id

    // 2. couple 详情
    const coupleRes = await db.query(`SELECT * FROM public.couples WHERE id = $1`, [coupleId])

    // 3. partner:同 couple 的另一成员 + profiles.nickname
    const partnerRes = await db.query<{ user_id: string; nickname: string | null }>(
      `SELECT cm.user_id, p.nickname
       FROM public.couple_members cm
       JOIN public.profiles p ON p.id = cm.user_id
       WHERE cm.couple_id = $1 AND cm.user_id <> $2`,
      [coupleId, userId],
    )
    const partnerMember = partnerRes.rows[0]
    const partner = partnerMember
      ? { id: partnerMember.user_id, nickname: partnerMember.nickname ?? null }
      : null

    return NextResponse.json({
      couple: coupleRes.rows[0] ?? null,
      partner,
      myInvite: null,
    })
  })
}

interface CoupleBody {
  action: string
  // invite
  invite_code?: string
  // permission
  data_type?: string
  share_level?: string
  is_enabled?: boolean
  // encouragement
  message_type?: string
  content?: string
  // suggestion
  receiver_id?: string
  title?: string
  description?: string
  suggestion_id?: string
  status?: string
}

/**
 * POST /api/couple - action 分发:
 *  create_invite / accept_invite / cancel_invite / disband
 *  load_permissions / update_permission
 *  send_encouragement / load_encouragement
 *  send_suggestion / respond_suggestion
 *
 * 跨用户操作(accept_invite 等)在服务端校验合法性,不信任客户端传的 couple_id。
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CoupleBody | null
  if (!body || !body.action) {
    return NextResponse.json({ error: 'action 必填' }, { status: 400 })
  }

  // accept_invite 需要单独事务(建 couple + 两个成员 + 更新邀请),不走 withUser
  if (body.action === 'accept_invite') {
    return acceptInvite(request, body)
  }

  return withUser(request, async (userId, db) => {
    switch (body.action) {
      case 'create_invite':
        return createInvite(userId, db)
      case 'cancel_invite':
        return cancelInvite(userId, db)
      case 'disband':
        return disbandCouple(userId, db)
      case 'load_permissions':
        return loadPermissions(userId, db)
      case 'update_permission':
        return updatePermission(userId, db, body)
      case 'send_encouragement':
        return sendEncouragement(userId, db, body)
      case 'load_encouragement':
        return loadEncouragement(userId, db)
      case 'load_suggestions':
        return loadSuggestions(userId, db)
      case 'send_suggestion':
        return sendSuggestion(userId, db, body)
      case 'respond_suggestion':
        return respondSuggestion(userId, db, body)
      default:
        return NextResponse.json({ error: `unknown action: ${body.action}` }, { status: 400 })
    }
  })
}

/** 生成 6 位大写邀请码 */
function genInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createInvite(userId: string, db: { query: Function }) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)
  const res = await db.query(
    `INSERT INTO public.couple_invites (inviter_id, invite_code, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, genInviteCode(), expiresAt.toISOString()],
  )
  return NextResponse.json({ invite: res.rows[0] }, { status: 201 })
}

/** accept_invite:校验邀请有效性 -> 事务建 couple + 两成员 + 更新邀请。 */
async function acceptInvite(request: NextRequest, body: CoupleBody): Promise<Response> {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 用 withUser 的鉴权拿 userId(复用 token 解析),再单独开事务
  const { getUserIdFromCloudbase } = await import('@/lib/cloudbase/server')
  const userId = await getUserIdFromCloudbase({ request })
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = (body.invite_code ?? '').toUpperCase()
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    try {
      // 1. 查邀请(锁行防并发)
      const inviteRes = await client.query(
        `SELECT * FROM public.couple_invites
         WHERE invite_code = $1 AND status = 'pending'
         FOR UPDATE`,
        [code],
      )
      if (inviteRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: '邀请码无效或已过期' }, { status: 400 })
      }
      const invite = inviteRes.rows[0]
      if (new Date(invite.expires_at) < new Date()) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: '邀请码已过期' }, { status: 400 })
      }
      // 不能接受自己的邀请
      if (invite.inviter_id === userId) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: '不能接受自己的邀请' }, { status: 400 })
      }

      // 2. 建 couple
      const coupleRes = await client.query(
        `INSERT INTO public.couples DEFAULT VALUES RETURNING *`,
      )
      const coupleId = coupleRes.rows[0].id

      // 3. 加两成员(unique(user_id) 约束防重复加入)
      await client.query(
        `INSERT INTO public.couple_members (couple_id, user_id) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [coupleId, invite.inviter_id],
      )
      await client.query(
        `INSERT INTO public.couple_members (couple_id, user_id) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [coupleId, userId],
      )

      // 4. 更新邀请状态
      await client.query(
        `UPDATE public.couple_invites SET status = 'accepted' WHERE id = $1`,
        [invite.id],
      )

      await client.query('COMMIT')
      return NextResponse.json({ couple: coupleRes.rows[0] })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  } finally {
    client.release()
    await pool.end()
  }
}

/** 校验当前用户在 couple 中,返回 couple_id,否则 null。 */
async function getMyCoupleId(userId: string, db: { query: Function }): Promise<string | null> {
  const res = await db.query(
    `SELECT couple_id FROM public.couple_members WHERE user_id = $1`,
    [userId],
  )
  return (res.rows[0]?.couple_id as string) ?? null
}

async function cancelInvite(userId: string, db: { query: Function }) {
  // 把我发出的 pending 邀请置 cancelled
  await db.query(
    `UPDATE public.couple_invites
     SET status = 'cancelled'
     WHERE inviter_id = $1 AND status = 'pending'`,
    [userId],
  )
  return NextResponse.json({ success: true })
}

async function disbandCouple(userId: string, db: { query: Function }) {
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ error: '未加入任何 couple' }, { status: 400 })
  }
  await db.query(`UPDATE public.couples SET status = 'disbanded' WHERE id = $1`, [coupleId])
  return NextResponse.json({ success: true })
}

async function loadPermissions(userId: string, db: { query: Function }) {
  const res = await db.query(
    `SELECT * FROM public.shared_permissions WHERE user_id = $1`,
    [userId],
  )
  return NextResponse.json({ permissions: res.rows })
}

async function updatePermission(userId: string, db: { query: Function }, body: CoupleBody) {
  await db.query(
    `INSERT INTO public.shared_permissions (user_id, data_type, share_level, is_enabled)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, data_type)
     DO UPDATE SET share_level = EXCLUDED.share_level, is_enabled = EXCLUDED.is_enabled`,
    [userId, body.data_type, body.share_level, body.is_enabled ?? false],
  )
  return NextResponse.json({ success: true })
}

async function sendEncouragement(userId: string, db: { query: Function }, body: CoupleBody) {
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ error: '未加入任何 couple' }, { status: 400 })
  }
  await db.query(
    `INSERT INTO public.encouragement_messages (couple_id, sender_id, content, message_type)
     VALUES ($1, $2, $3, $4)`,
    [coupleId, userId, body.content ?? '', body.message_type ?? 'custom'],
  )
  return NextResponse.json({ success: true }, { status: 201 })
}

async function loadEncouragement(userId: string, db: { query: Function }) {
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ encouragement: [] })
  }
  const res = await db.query(
    `SELECT * FROM public.encouragement_messages
     WHERE couple_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [coupleId],
  )
  return NextResponse.json({ encouragement: res.rows })
}

async function loadSuggestions(userId: string, db: { query: Function }) {
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ suggestions: [] })
  }
  const res = await db.query(
    `SELECT * FROM public.shared_plan_suggestions
     WHERE couple_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [coupleId],
  )
  return NextResponse.json({ suggestions: res.rows })
}

async function sendSuggestion(userId: string, db: { query: Function }, body: CoupleBody) {
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ error: '未加入任何 couple' }, { status: 400 })
  }
  // 校验 receiver 同 couple
  const receiverInCouple = await db.query(
    `SELECT 1 FROM public.couple_members WHERE couple_id = $1 AND user_id = $2`,
    [coupleId, body.receiver_id],
  )
  if (receiverInCouple.rows.length === 0) {
    return NextResponse.json({ error: '接收方不在同一 couple' }, { status: 400 })
  }
  await db.query(
    `INSERT INTO public.shared_plan_suggestions
       (couple_id, sender_id, receiver_id, title, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [coupleId, userId, body.receiver_id, body.title ?? '', body.description ?? null],
  )
  return NextResponse.json({ success: true }, { status: 201 })
}

async function respondSuggestion(userId: string, db: { query: Function }, body: CoupleBody) {
  // 校验:该 suggestion 属于我所在的 couple,且我是 receiver
  const coupleId = await getMyCoupleId(userId, db)
  if (!coupleId) {
    return NextResponse.json({ error: '未加入任何 couple' }, { status: 400 })
  }
  const res = await db.query(
    `UPDATE public.shared_plan_suggestions
     SET status = $1
     WHERE id = $2 AND couple_id = $3 AND receiver_id = $4
     RETURNING *`,
    [body.status, body.suggestion_id, coupleId, userId],
  )
  if (res.rows.length === 0) {
    return NextResponse.json({ error: '无权操作该建议' }, { status: 403 })
  }
  // 返回更新后的 suggestions 列表
  const listRes = await db.query(
    `SELECT * FROM public.shared_plan_suggestions
     WHERE couple_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [coupleId],
  )
  return NextResponse.json({ suggestions: listRes.rows })
}
