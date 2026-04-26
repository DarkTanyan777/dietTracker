'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface FoodLogFormData {
  food_name: string
  meal_type: MealType
}

interface FoodLogModalProps {
  date: Date
  onClose: () => void
}

export default function FoodLogModal({ date, onClose }: FoodLogModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FoodLogFormData>({
    defaultValues: {
      food_name: '',
      meal_type: 'snack',
    },
  })

  const onSubmit = async (data: FoodLogFormData) => {
    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Пользователь не найден:', userError?.message)
        return
      }

      const dateStr = date.toISOString().split('T')[0]

      const payload = {
        user_id: user.id,
        log_date: dateStr,
        food_name: data.food_name.trim(),
        meal_type: data.meal_type,

        // Оставляем, потому что эти поля есть в таблице
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }

      console.log('Добавляем запись:', payload)

      const { error } = await supabase.from('food_logs').insert(payload)

      if (error) {
        console.error('Ошибка при добавлении еды:', error.message)
        console.error('Details:', error.details)
        console.error('Hint:', error.hint)
        console.error('Code:', error.code)
        return
      }

      reset()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">
              Добавить еду
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Что ел?
            </label>

            <input
              type="text"
              {...register('food_name', {
                required: 'Введите название продукта или блюда',
                validate: (value) =>
                  value.trim().length > 0 || 'Введите название продукта или блюда',
              })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              placeholder="Например: гречка с курицей"
            />

            {errors.food_name && (
              <p className="mt-2 text-sm text-red-500">
                {errors.food_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Приём пищи
            </label>

            <select
              {...register('meal_type')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
            >
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="dinner">Ужин</option>
              <option value="snack">Перекус</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gray-950 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? 'Добавляем...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}