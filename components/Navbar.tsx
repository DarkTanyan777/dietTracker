'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-950">
            Diet Tracker
          </h1>
          <p className="text-xs text-gray-500">
            Простой дневник питания
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Выйти
        </button>
      </div>
    </header>
  )
}