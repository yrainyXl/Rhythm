import type { Database } from '@/lib/supabase/database.types'

type Occurrence = Database['public']['Tables']['habit_occurrences']['Row']

export function splitOccurrences(occurrences: Occurrence[]) {
  const pending = occurrences.filter((o) => o.status === 'pending')
  const done = occurrences.filter((o) => o.status === 'done' || o.status === 'skipped')
  return { pending, done }
}
