export interface FoodLog {
  id: string
  user_id: string
  log_date: string
  food_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  created_at: string
}

export interface DailyNote {
  id: string
  user_id: string
  note_date: string
  note: string
  mood: 'good' | 'normal' | 'bad'
  created_at: string
  updated_at: string
}