"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Check, X, AlertTriangle, Info, Bell } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string | null) => {
    switch (variant) {
      case "success":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-600 shadow-sm">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )
      case "destructive":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 dark:bg-red-600 shadow-sm">
            <X className="h-3.5 w-3.5 text-white" />
          </div>
        )
      case "warning":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-600 shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5 text-white" />
          </div>
        )
      case "info":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-600 shadow-sm">
            <Info className="h-3.5 w-3.5 text-white" />
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 dark:bg-slate-600 shadow-sm">
            <Bell className="h-3.5 w-3.5 text-white" />
          </div>
        )
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant ?? undefined} {...props}>
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">
                {getIcon(variant)}
              </div>
              <div className="flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action && (
                <div className="flex-shrink-0">
                  {action}
                </div>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
