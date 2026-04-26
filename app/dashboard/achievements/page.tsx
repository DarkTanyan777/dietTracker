'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AchievementCard from '@/components/AchievementCard'
import { useRouter } from 'next/navigation'

const ACHIEVEMENTS = [
  { key: 'first_log', title: 'Первый шаг', description: 'Добавьте первую запись', icon: '🎯' },
  { key: 'week_streak', title: 'Неделя', description: '7 дней подряд', icon: '🔥' },
  { key: 'month_streak', title: 'Месяц', description: '30 дней подряд', icon: '💪' },
  { key: 'healthy_eater', title: 'ЗОЖник', description: '10 полезных приёмов пищи', icon: '🥗' },
]

export default function AchievementsPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('achievements')
      .select('achievement_key')
      .eq('user_id', user.id)

    if (data) {
      setUnlockedAchievements(data.map((a: any) => a.achievement_key))
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🏆 Достижения</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map(({ key, ...rest }) => (
        <AchievementCard
            key={key}
            {...rest}
            unlocked={unlockedAchievements.includes(key)}
        />
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-center text-blue-800">
          Разблокировано: {unlockedAchievements.length} из {ACHIEVEMENTS.length}
        </p>
      </div>
    </div>
  )
}