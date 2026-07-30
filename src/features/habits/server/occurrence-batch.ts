export interface OccurrenceSeed {
  habitId: string
  title: string
  targetType: string
  targetValue: number | null
  targetUnit: string | null
}

export interface ParameterizedQuery {
  text: string
  params: unknown[]
}

export function buildOccurrenceBatchInsert(
  userId: string,
  localDate: string,
  habits: OccurrenceSeed[],
): ParameterizedQuery | null {
  if (habits.length === 0) return null

  const params: unknown[] = []
  const values = habits.map((habit) => {
    const offset = params.length
    params.push(
      userId,
      habit.habitId,
      localDate,
      habit.title,
      habit.targetType,
      habit.targetValue,
      habit.targetUnit,
    )
    return `(${Array.from({ length: 7 }, (_, index) => `$${offset + index + 1}`).join(',')})`
  })

  return {
    text: `INSERT INTO habit_occurrences
      (user_id, habit_id, local_date, title_snapshot,
       target_type_snapshot, target_value_snapshot, target_unit_snapshot)
      VALUES ${values.join(',')}
      ON CONFLICT (user_id, habit_id, local_date) DO NOTHING`,
    params,
  }
}

