'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { Check, AlertCircle } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        const isDestructive = variant === 'destructive'

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex min-w-0 max-w-full items-center gap-2">
              {isDestructive ? (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                  <AlertCircle className="h-3 w-3 stroke-[2.5]" />
                </div>
              ) : (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}
              <div className="flex min-w-0 items-center gap-1.5 text-xs">
                {title && (
                  <ToastTitle className="truncate font-medium text-white">
                    {title}
                  </ToastTitle>
                )}
                {description && !title && (
                  <ToastDescription className="truncate text-slate-200">
                    {description}
                  </ToastDescription>
                )}
                {title && description && (
                  <ToastDescription className="hidden truncate text-slate-300 sm:inline">
                    · {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
