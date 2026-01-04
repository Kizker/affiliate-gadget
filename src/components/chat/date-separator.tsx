import { formatDateSeparator } from '@/utils/chat-helpers'

interface DateSeparatorProps {
  date: Date | string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-gray-300" />
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
        {formatDateSeparator(dateObj)}
      </span>
      <div className="flex-1 border-t border-gray-300" />
    </div>
  )
}
