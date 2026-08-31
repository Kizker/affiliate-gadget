import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
  variant?: 'dark' | 'light'
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor = 'from-blue-600 to-blue-700',
  variant = 'dark',
}: StatCardProps) {
  if (variant === 'light') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-blue-400 hover:shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-blue-700">
              {value}
            </p>
            {trend && (
              <p
                className={`mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={`bg-gradient-to-r p-3 ${iconColor} rounded-xl shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
  }

  // Dark variant (original)
  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm text-gray-400">{label}</p>
          <p className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-2 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`bg-gradient-to-r p-3 ${iconColor} rounded-xl`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}
