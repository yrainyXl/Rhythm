'use client'

import { create } from 'zustand'
import { apiFetch, ApiError } from '@/lib/cloudbase/api-client'

interface Couple {
  id: string
  status: string
  created_at: string
  updated_at: string
}

interface CoupleInvite {
  id: string
  inviter_id: string
  invite_code: string
  status: string
  expires_at: string
  created_at: string
  updated_at: string
}

interface SharedPermission {
  id: string
  user_id: string
  data_type: string
  share_level: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

interface EncouragementMessage {
  id: string
  couple_id: string
  sender_id: string
  content: string
  message_type: string
  created_at: string
}

interface SharedPlanSuggestion {
  id: string
  couple_id: string
  sender_id: string
  receiver_id: string
  title: string
  description: string | null
  suggested_date: string | null
  suggested_time: string | null
  suggestion_type: string
  status: string
  receiver_note: string | null
  created_at: string
  updated_at: string
}

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
  loadSuggestions: () => Promise<void>
  sendSuggestion: (receiverId: string, title: string, description: string) => Promise<void>
  respondToSuggestion: (suggestionId: string, status: string) => Promise<void>
}

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error) return e.message
  return '操作失败'
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
    try {
      const data = await apiFetch<{ couple: Couple | null; partner: { id: string; nickname: string | null } | null; myInvite: CoupleInvite | null }>(
        '/api/couple',
      )
      set({ couple: data.couple ?? null, partner: data.partner ?? null, myInvite: data.myInvite ?? null })
    } catch {
      // 保持空
    }
  },

  createInvite: async () => {
    set({ isSaving: true, errorMessage: null })
    try {
      const { invite } = await apiFetch<{ invite: CoupleInvite }>('/api/couple', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_invite' }),
      })
      set({ isSaving: false, myInvite: invite ?? null })
      return invite?.invite_code ?? null
    } catch (e) {
      set({ isSaving: false, errorMessage: errMsg(e) })
      return null
    }
  },

  acceptInvite: async (code) => {
    set({ isSaving: true, errorMessage: null })
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({ action: 'accept_invite', invite_code: code }),
      })
      set({ isSaving: false })
      await useCoupleStore.getState().loadCouple()
      return { error: null }
    } catch (e) {
      set({ isSaving: false })
      return { error: errMsg(e) }
    }
  },

  cancelInvite: async () => {
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel_invite' }),
      })
      set({ myInvite: null })
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
  },

  disbandCouple: async () => {
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({ action: 'disband' }),
      })
      set({ couple: null, partner: null })
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
  },

  loadPermissions: async () => {
    try {
      const { permissions } = await apiFetch<{ permissions: SharedPermission[] }>(
        '/api/couple',
        { method: 'POST', body: JSON.stringify({ action: 'load_permissions' }) },
      )
      set({ permissions: permissions ?? [] })
    } catch {
      // 保持空
    }
  },

  updatePermission: async (dataType, shareLevel, isEnabled) => {
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_permission',
          data_type: dataType,
          share_level: shareLevel,
          is_enabled: isEnabled,
        }),
      })
      await useCoupleStore.getState().loadPermissions()
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
  },

  sendEncouragement: async (type, content) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({ action: 'send_encouragement', message_type: type, content }),
      })
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
    set({ isSaving: false })
  },

  loadEncouragement: async () => {
    try {
      const { encouragement } = await apiFetch<{ encouragement: EncouragementMessage[] }>(
        '/api/couple',
        { method: 'POST', body: JSON.stringify({ action: 'load_encouragement' }) },
      )
      set({ encouragement: encouragement ?? [] })
    } catch {
      // 保持空
    }
  },

  loadSuggestions: async () => {
    try {
      const { suggestions } = await apiFetch<{ suggestions: SharedPlanSuggestion[] }>(
        '/api/couple',
        { method: 'POST', body: JSON.stringify({ action: 'load_suggestions' }) },
      )
      set({ suggestions: suggestions ?? [] })
    } catch {
      // 保持空
    }
  },

  sendSuggestion: async (receiverId, title, description) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/couple', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_suggestion',
          receiver_id: receiverId,
          title,
          description,
        }),
      })
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
    set({ isSaving: false })
  },

  respondToSuggestion: async (suggestionId, status) => {
    try {
      const { suggestions } = await apiFetch<{ suggestions: SharedPlanSuggestion[] }>(
        '/api/couple',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'respond_suggestion', suggestion_id: suggestionId, status }),
        },
      )
      set({ suggestions: suggestions ?? [] })
    } catch (e) {
      set({ errorMessage: errMsg(e) })
    }
  },
}))
