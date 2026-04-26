import { createClient } from './supabase/server'

export async function checkAndUnlockAchievements(
  userId: string,
  logDate: string
) {
  const supabase = await createClient()

  // 1. Первая запись
  const { data, error } = await supabase
    .from('food_logs')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    console.error('Ошибка проверки первой записи:', error)
    return
  }

  if (data && data.length === 1) {
    await unlockAchievement(userId, 'first_log')
  }

  // 2. Проверка серий
  await checkStreak(userId, logDate)
}

async function unlockAchievement(userId: string, key: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('achievements')
    .insert({
      user_id: userId,
      achievement_key: key,
    })

  if (error) {
    console.error(`Ошибка разблокировки достижения ${key}:`, error)
  }
}

async function checkStreak(userId: string, currentDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('food_logs')
    .select('log_date')
    .eq('user_id', userId)
    .lte('log_date', currentDate)
    .order('log_date', { ascending: false })

  if (error) {
    console.error('Ошибка проверки серии:', error)
    return
  }

  if (!data || data.length === 0) return

  const uniqueDates = Array.from(
    new Set(data.map((item) => item.log_date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let streak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1])
    const currDate = new Date(uniqueDates[i])

    const diffDays = Math.floor(
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  if (streak >= 7) {
    await unlockAchievement(userId, 'week_streak')
  }

  if (streak >= 30) {
    await unlockAchievement(userId, 'month_streak')
  }
}