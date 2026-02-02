"use client"

import { useTaskNotifications } from "@/hooks/useTaskNotifications"

/**
 * Client component that listens for task notifications.
 * Must be placed inside ToastProvider in the component tree.
 */
export function TaskNotificationListener() {
  useTaskNotifications()
  return null
}
