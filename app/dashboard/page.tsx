'use client'

import { useState, useEffect, useMemo } from 'react'
import Calendar from 'react-calendar'
import { createClient } from '@/lib/supabase/client'
import FoodLogModal from '@/components/FoodLogModal'
import { FoodLog } from '@/types'

const mealLabels = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
}

const mealEmoji = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

const moodLabels = {
  good: 'Хорошо',
  normal: 'Нормально',
  bad: 'Плохо',
}

const moodEmoji = {
  good: '😊',
  normal: '😐',
  bad: '😔',
}

type Mood = 'good' | 'normal' | 'bad'

interface SavedDailyNote {
  id: string
  note: string
  mood: Mood
}

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [dailyNote, setDailyNote] = useState('')
  const [mood, setMood] = useState<Mood>('normal')
  const [savedDailyNote, setSavedDailyNote] = useState<SavedDailyNote | null>(
    null
  )

  const [savingNote, setSavingNote] = useState(false)
  const [deletingNote, setDeletingNote] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const selectedDateStr = selectedDate.toISOString().split('T')[0]

  const loadDayData = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Пользователь не найден:', userError?.message)
      return
    }

    const { data: logsData, error: logsError } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', selectedDateStr)
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Ошибка загрузки еды:', logsError.message)
    } else {
      setFoodLogs(logsData || [])
    }

    const { data: noteData, error: noteError } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('note_date', selectedDateStr)
      .maybeSingle()

    if (noteError) {
      console.error('Ошибка загрузки заметки:', noteError.message)
      return
    }

    if (noteData) {
      setSavedDailyNote({
        id: noteData.id,
        note: noteData.note || '',
        mood: noteData.mood || 'normal',
      })

      setDailyNote(noteData.note || '')
      setMood(noteData.mood || 'normal')
    } else {
      setSavedDailyNote(null)
      setDailyNote('')
      setMood('normal')
    }
  }

  useEffect(() => {
    loadDayData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr])

  const saveDailyNote = async () => {
    setSavingNote(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Пользователь не найден:', userError?.message)
        return
      }

      const { error } = await supabase.from('daily_notes').upsert(
        {
          user_id: user.id,
          note_date: selectedDateStr,
          note: dailyNote.trim(),
          mood,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,note_date',
        }
      )

      if (error) {
        console.error('Ошибка сохранения заметки:', error.message)
        return
      }

      await loadDayData()
    } finally {
      setSavingNote(false)
    }
  }

  const deleteFoodLog = async (logId: string) => {
    const confirmed = window.confirm('Удалить эту запись?')

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', logId)

    if (error) {
      console.error('Ошибка удаления записи:', error.message)
      return
    }

    await loadDayData()
  }

  const deleteDailyNote = async () => {
    if (!savedDailyNote) {
      return
    }

    const confirmed = window.confirm('Удалить заметку за этот день?')

    if (!confirmed) {
      return
    }

    setDeletingNote(true)

    try {
      const { error } = await supabase
        .from('daily_notes')
        .delete()
        .eq('id', savedDailyNote.id)

      if (error) {
        console.error('Ошибка удаления заметки:', error.message)
        return
      }

      setSavedDailyNote(null)
      setDailyNote('')
      setMood('normal')
    } finally {
      setDeletingNote(false)
    }
  }

  const groupedLogs = foodLogs.reduce<Record<string, FoodLog[]>>((acc, log) => {
    const type = log.meal_type || 'snack'

    if (!acc[type]) {
      acc[type] = []
    }

    acc[type].push(log)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">
          Дневник питания
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value)
                }
              }}
              value={selectedDate}
              className="custom-calendar"
              minDetail="month"
              maxDetail="month"
              prev2Label={null}
              next2Label={null}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Выбранная дата</p>
            <p className="mt-1 text-lg font-semibold text-gray-950">
              {selectedDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Записей за день</p>
            <p className="mt-1 text-3xl font-semibold text-gray-950">
              {foodLogs.length}
            </p>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Еда за день
                </h2>
                <p className="text-sm text-gray-500">
                  Добавляй продукты, блюда или напитки.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Добавить еду
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {foodLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                  <div className="text-3xl">🥗</div>
                  <p className="mt-3 font-medium text-gray-900">
                    Пока ничего не добавлено
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Добавь первый продукт или блюдо за этот день.
                  </p>
                </div>
              ) : (
                Object.entries(mealLabels).map(([type, label]) => {
                  const logs = groupedLogs[type] || []

                  if (logs.length === 0) {
                    return null
                  }

                  return (
                    <section key={type}>
                      <h3 className="mb-2 text-sm font-semibold text-gray-500">
                        {mealEmoji[type as keyof typeof mealEmoji]} {label}
                      </h3>

                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3"
                          >
                            <span className="font-medium text-gray-900">
                              {log.food_name}
                            </span>

                            <button
                              type="button"
                              onClick={() => deleteFoodLog(log.id)}
                              className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-950">
              Заметка дня
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Отметь, как прошёл день по питанию.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMood('good')}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  mood === 'good'
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Хорошо
              </button>

              <button
                type="button"
                onClick={() => setMood('normal')}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  mood === 'normal'
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Нормально
              </button>

              <button
                type="button"
                onClick={() => setMood('bad')}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  mood === 'bad'
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Плохо
              </button>
            </div>

            <textarea
              value={dailyNote}
              onChange={(event) => setDailyNote(event.target.value)}
              className="mt-4 min-h-28 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              placeholder="Например: сегодня ел без перекусов, пил достаточно воды..."
            />

            <button
              type="button"
              onClick={saveDailyNote}
              disabled={savingNote}
              className="mt-3 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {savingNote ? 'Сохраняем...' : 'Сохранить заметку'}
            </button>
          </div>

          {savedDailyNote && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Сохранённая заметка</p>

                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                    <span>{moodEmoji[savedDailyNote.mood]}</span>
                    <span>{moodLabels[savedDailyNote.mood]}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={deleteDailyNote}
                  disabled={deletingNote}
                  className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingNote ? 'Удаляем...' : 'Удалить'}
                </button>
              </div>

              {savedDailyNote.note ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {savedDailyNote.note}
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  Описание не добавлено.
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <FoodLogModal
          date={selectedDate}
          onClose={() => {
            setIsModalOpen(false)
            loadDayData()
          }}
        />
      )}
    </div>
  )
}