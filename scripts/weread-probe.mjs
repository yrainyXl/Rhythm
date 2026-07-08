#!/usr/bin/env node
/**
 * 微信读书「官方 Agent 网关」可行性验证脚本 (一次性探测，不写库)
 *
 * 背景：纯 Cookie 方案已因签名校验失效（errcode -2012），本脚本改用腾讯
 *   官方 Skill 暴露的 Agent API Gateway，凭 API Key 鉴权，长期有效。
 *
 * 统一入口： POST https://i.weread.qq.com/api/agent/gateway
 *   Header:  Authorization: Bearer <WEREAD_API_KEY>   (格式 wrk-xxxxxxxx)
 *   Body:    {"api_name":"/xxx", ...业务参数平铺, "skill_version":"1.0.4"}
 *
 * 目的：确认能否稳定拿到——
 *   1) 笔记本 user/notebooks     -> 有划线/想法的书列表（词条入口）
 *   2) 划线 book/bookmarklist    -> 划线原文 markText（词条核心数据源）
 *   3) 个人想法 review/list/mine -> content + abstract（词条补充）
 *   4) 阅读统计 readdata/detail   -> totalReadTime 秒 / readDays / readLongest
 *
 * 用法（API Key 绝不硬编码，任选一种，文件方式对 Windows 更友好）：
 *
 *   方式 A · Key 文件（推荐，任何终端都能跑）：
 *     1. 前往 https://weread.qq.com/r/weread-skills 获取 API Key
 *     2. 在项目根目录建文件 .weread-key，把 wrk-xxxx 粘进去保存
 *        （该文件已在 .gitignore 中，不会被提交）
 *     3. 运行：  node scripts/weread-probe.mjs
 *
 *   方式 B · 环境变量（bash / Git Bash）：
 *        WEREAD_API_KEY='wrk-xxxx' node scripts/weread-probe.mjs
 *
 *   深度探测某本书（默认取笔记本第一本；也可指定）：
 *        WEREAD_BOOK_ID='书籍id' node scripts/weread-probe.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY_FILE = join(__dirname, '..', '.weread-key')
const SKILL_VERSION = '1.0.4'
const GATEWAY = 'https://i.weread.qq.com/api/agent/gateway'

function loadKey() {
  if (process.env.WEREAD_API_KEY && process.env.WEREAD_API_KEY.trim()) {
    return process.env.WEREAD_API_KEY.trim()
  }
  if (existsSync(KEY_FILE)) {
    const raw = readFileSync(KEY_FILE, 'utf8').trim()
    if (raw) return raw
  }
  return null
}

const API_KEY = loadKey()
let BOOK_ID = process.env.WEREAD_BOOK_ID || null

if (!API_KEY) {
  console.error('\x1b[31m✗ 没找到 API Key。\x1b[0m')
  console.error('  方式 A(推荐): 在项目根目录建文件 .weread-key，粘入 wrk-xxxx，然后运行:')
  console.error('      node scripts/weread-probe.mjs')
  console.error("  方式 B(bash): WEREAD_API_KEY='wrk-xxxx' node scripts/weread-probe.mjs")
  console.error('  获取地址: https://weread.qq.com/r/weread-skills')
  process.exit(1)
}

const ok = (s) => `\x1b[32m${s}\x1b[0m`
const bad = (s) => `\x1b[31m${s}\x1b[0m`
const warn = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[90m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

async function call(apiName, params = {}) {
  const body = { api_name: apiName, ...params, skill_version: SKILL_VERSION }
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, httpOk: res.ok, json, text }
}

async function probe(name, apiName, params, previewFn) {
  process.stdout.write(`\n${bold('▶ ' + name)}\n  ${dim(apiName + ' ' + JSON.stringify(params))}\n`)
  try {
    const { status, httpOk, json, text } = await call(apiName, params)
    if (!json) {
      console.log(`  ${bad('✗ 非 JSON 响应')} (HTTP ${status})`)
      console.log(`  ${dim('前 120 字符: ' + text.slice(0, 120).replace(/\s+/g, ' '))}`)
      return { name, ok: false, reason: 'non-json' }
    }
    const errCode = json.errcode ?? json.errCode ?? 0
    if (errCode !== 0) {
      console.log(`  ${bad('✗ errcode=' + errCode)} (HTTP ${status}) ${json.errmsg || json.errMsg || ''}`)
      return { name, ok: false, errCode }
    }
    if (json.upgrade_info) {
      console.log(`  ${warn('△ 服务端提示升级: ' + (json.upgrade_info.message || ''))}`)
    }
    console.log(`  ${ok('✓ 成功')} (HTTP ${status})`)
    if (previewFn) previewFn(json)
    return { name, ok: true, json }
  } catch (e) {
    console.log(`  ${bad('✗ 请求异常')}: ${e.message}`)
    return { name, ok: false, reason: e.message }
  }
}

function fmtSecs(s) {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}
function fmtTs(ts) {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function main() {
  console.log(bold('\n=== 微信读书官方网关可行性验证 ===\n'))
  console.log(dim(`Key: ${API_KEY.slice(0, 8)}…（${API_KEY.length} 字符，不落盘打印）`))
  console.log(dim(`网关: ${GATEWAY}`))

  const results = []

  // 1) 笔记本概览
  const notebooks = await probe('笔记本 user/notebooks', '/user/notebooks', { count: 5 }, (j) => {
    console.log(dim(`  有笔记的书: ${j.totalBookCount} 本，笔记总数: ${j.totalNoteCount} 条`))
    for (const b of (j.books || []).slice(0, 5)) {
      console.log(
        dim(
          `    · [${b.bookId}] ${b.book?.title} — 划线${b.noteCount}/想法${b.reviewCount}/书签${b.bookmarkCount}`
        )
      )
    }
    if (!BOOK_ID && j.books?.[0]) BOOK_ID = j.books[0].bookId
  })
  results.push(notebooks)

  // 2) 划线内容（词条核心）
  if (BOOK_ID) {
    results.push(
      await probe(`划线 book/bookmarklist (bookId=${BOOK_ID})`, '/book/bookmarklist', { bookId: BOOK_ID }, (j) => {
        const arr = j.updated || []
        console.log(dim(`  划线 ${arr.length} 条`))
        const chapMap = new Map((j.chapters || []).map((c) => [c.chapterUid, c.title]))
        for (const m of arr.slice(0, 3)) {
          console.log(dim(`    · [${chapMap.get(m.chapterUid) || m.chapterUid}] ${fmtTs(m.createTime)}`))
          console.log(`      「${m.markText}」`)
        }
      })
    )

    // 3) 个人想法
    results.push(
      await probe(`个人想法 review/list/mine (bookid=${BOOK_ID})`, '/review/list/mine', { bookid: BOOK_ID, count: 5 }, (j) => {
        const arr = j.reviews || []
        console.log(dim(`  想法/点评 ${arr.length} 条`))
        for (const r of arr.slice(0, 3)) {
          const rv = r.review || {}
          if (rv.abstract) console.log(dim(`      原文:「${rv.abstract}」`))
          console.log(`      想法:「${rv.content}」`)
        }
      })
    )
  }

  // 4) 阅读统计
  results.push(
    await probe('阅读统计 readdata/detail (monthly)', '/readdata/detail', { mode: 'monthly' }, (j) => {
      console.log(dim(`  本月总时长: ${fmtSecs(j.totalReadTime || 0)}，阅读天数: ${j.readDays}`))
      for (const r of (j.readLongest || []).slice(0, 3)) {
        console.log(dim(`    · ${r.book?.title} — ${fmtSecs(r.readTime)}`))
      }
    })
  )

  console.log(bold('\n\n=== 汇总 ===\n'))
  for (const r of results) {
    const mark = r.ok ? ok('✓') : bad('✗')
    const detail = r.ok ? '' : dim(`  (${r.reason || 'errcode=' + r.errCode})`)
    console.log(`  ${mark} ${r.name}${detail}`)
  }
  const okCount = results.filter((r) => r.ok).length
  console.log(
    `\n  ${okCount}/${results.length} 接口可用。` +
      (okCount === results.length
        ? ok(' 官方网关方案完全可行，可进入词条集成设计。')
        : okCount === 0
          ? bad(' 全部失败，检查 API Key 是否有效。')
          : warn(' 部分可用，需针对失败接口调整。'))
  )
  console.log()
}

main()
