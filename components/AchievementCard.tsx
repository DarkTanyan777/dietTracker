interface AchievementCardProps {
  title: string
  description: string
  icon: string
  unlocked: boolean
}

export default function AchievementCard({
  title,
  description,
  icon,
  unlocked,
}: AchievementCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
        unlocked
          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md'
          : 'border-gray-200 bg-white/70 shadow-sm opacity-70'
      }`}
    >
      {unlocked && (
        <div className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
          Открыто
        </div>
      )}

      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
          unlocked ? 'bg-yellow-100' : 'bg-gray-100 grayscale'
        }`}
      >
        {icon}
      </div>

      <h3
        className={`text-base font-bold ${
          unlocked ? 'text-yellow-900' : 'text-gray-700'
        }`}
      >
        {title}
      </h3>

      <p className="mt-2 text-sm leading-5 text-gray-500">{description}</p>
    </div>
  )
}