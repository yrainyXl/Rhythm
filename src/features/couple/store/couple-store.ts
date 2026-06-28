'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Couple = Database['public']['Tables']['couples']['Row']
type CoupleMember = Database['public']['Tables']['couple_members']['Row']
type CoupleInvite = Database['public']['Tables']['couple_invites']['Row']
type SharedPermission = Database['public']['Tables']['shared_permissions']['Row']
type EncouragementMessage = Database['public']['Tables']['encouragement_messages']['Row']
type SharedPlanSuggestion = Database['public']['Tables']['shared_plan_suggestions']['Row']

interface CoupleState {
  couple: Couple | null
  partner: { id: string; nickname: string | null } | null
  myInvite: CoupleInvite | null
  permissions: SharedPermission[]
  encouragement: EncouragementMessage[]
  suggestions: SharedPlanSuggestion[]
  isSaving: boolean
  errorMessage: string | null

  loadCouple: () => Promise<void>
  createInvite: () => Promise<string | null>
  acceptInvite: (code: string) => Promise<{ error: string | null }>
  cancelInvite: () => Promise<void>
  disbandCouple: () => Promise<void>
  loadPermissions: () => Promise<void>
  updatePermission: (dataType: string, shareLevel: string, isEnabled: boolean) => Promise<void>
  sendEncouragement: (type: string, content: string) => Promise<void>
  loadEncouragement: () => Promise<void>
  sendSuggestion: (receiverId: string, title: string, description: string) => Promise<void>
  respondToSuggestion: (suggestionId: string, status: string) => Promise<void>
}

export const useCoupleStore = create<CoupleState>((set) => ({
  couple: null,
  partner: null,
  myInvite: null,
  permissions: [],
  encouragement: [],
  suggestions: [],
  isSaving: false,
  errorMessage: null,

  loadCouple: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    // Find my couple membership
    const { data: myMembership } = await supabase
      .from('couple_members')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!myMembership) {
      // Check my invites
      const { data: invites } = await supabase
        .from('couple_invites')
        .select('*')
        .eq('inviter_id', user.id)
        .eq('status', 'pending')
        .limit(1)

      set({ myInvite: invites?.[0] ?? null, couple: null, partner: null })
      return
    }

    // Get couple
    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('id', myMembership.couple_id)
      .single()

    // Get partner
    const { data: members } = await supabase
      .from('couple_members')
      .select('*, profiles!inner(nickname)')
      .eq('couple_id', myMembership.couple_id)

    const partnerMember = members?.find((m: any) => m.user_id !== user.id)
    const partner = partnerMember
      ? { id: partnerMember.user_id, nickname: (partnerMember as any).profiles?.nickname ?? null }
      : null

    set({ couple: couple ?? null, partner, myInvite: null })
  },

  createInvite: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    set({ isSaving: true, errorMessage: null })

    // Generate 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    const { data, error } = await supabase
      .from('couple_invites')
      .insert({
        inviter_id: user.id,
        invite_code: code,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    set({ isSaving: false })
    if (error) {
      set({ errorMessage: error.message })
      return null
    }

    set({ myInvite: data })
    return data?.invite_code ?? null
  },

  acceptInvite: async (code) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true, errorMessage: null })

    // Find invite
    const { data: invite } = await supabase
      .from('couple_invites')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single()

    if (!invite) {
      set({ isSaving: false })
      return { error: '邀请码无效或已过期' }
    }

    if (new Date(invite.expires_at) < new Date()) {
      set({ isSaving: false })
      return { error: '邀请码已过期' }
    }

    // Create couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({})
      .select()
      .single()

    if (coupleError) {
      set({ isSaving: false })
      return { error: coupleError.message }
    }

    // Add both members
    const { error: memberError1 } = await supabase
      .from('couple_members')
      .insert({ couple_id: couple.id, user_id: invite.inviter_id })

    const { error: memberError2 } = await supabase
      .from('couple_members')
      .insert({ couple_id: couple.id, user_id: user.id })

    if (memberError1 || memberError2) {
      set({ isSaving: false })
      return { error: '添加成员失败' }
    }

    // Mark invite as accepted
    await supabase
      .from('couple_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    set({ isSaving: false })
    await useCoupleStore.getState().loadCouple()
    return { error: null }
  },

  cancelInvite: async () => {
    const { myInvite } = useCoupleStore.getState()
    if (!myInvite) return

    const supabase = createBrowserClient()
    await supabase
      .from('couple_invites')
      .update({ status: 'cancelled' })
      .eq('id', myInvite.id)

    set({ myInvite: null })
  },

  disbandCouple: async () => {
    const { couple } = useCoupleStore.getState()
    if (!couple) return

    const supabase = createBrowserClient()
    await supabase.from('couples').update({ status: 'disbanded' }).eq('id', couple.id)
    set({ couple: null, partner: null })
  },

  loadPermissions: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('shared_permissions')
      .select('*')
      .eq('user_id', user.id)

    set({ permissions: data ?? [] })
  },

  updatePermission: async (dataType, shareLevel, isEnabled) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    await supabase.from('shared_permissions').upsert({
      user_id: user.id,
      data_type: dataType,
      share_level: shareLevel,
      is_enabled: isEnabled,
    })

    await useCoupleStore.getState().loadPermissions()
  },

  sendEncouragement: async (type, content) => {
    const { couple } = useCoupleStore.getState()
    if (!couple) return

    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    set({ isSaving: true })
    await supabase.from('encouragement_messages').insert({
      couple_id: couple.id,
      sender_id: user.id,
      content,
      message_type: type as any,
    })
    set({ isSaving: false })
  },

  loadEncouragement: async () => {
    const { couple } = useCoupleStore.getState()
    if (!couple) return

    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('encouragement_messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(20)

    set({ encouragement: data ?? [] })
  },

  sendSuggestion: async (receiverId, title, description) => {
    const { couple } = useCoupleStore.getState()
    if (!couple) return

    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    set({ isSaving: true })
    await supabase.from('shared_plan_suggestions').insert({
      couple_id: couple.id,
      sender_id: user.id,
      receiver_id: receiverId,
      title,
      description,
    })
    set({ isSaving: false })
  },

  respondToSuggestion: async (suggestionId, status) => {
    const supabase = createBrowserClient()

    await supabase
      .from('shared_plan_suggestions')
      .update({ status })
      .eq('id', suggestionId)

    // Reload suggestions
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { couple } = useCoupleStore.getState()
    if (!couple) return

    const { data } = await supabase
      .from('shared_plan_suggestions')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(10)

    set({ suggestions: data ?? [] })
  },
}))
