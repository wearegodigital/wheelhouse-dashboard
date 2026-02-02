import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { fetchUserMap, type UserInfo } from "@/lib/supabase/users"
import type { TaskComment } from "@/lib/supabase/types"

export interface CommentWithUser extends TaskComment {
  user?: UserInfo
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const supabase = createClient()

      const { data: comments, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })

      if (error) throw error

      const typedComments = (comments || []) as TaskComment[]
      const userMap = await fetchUserMap(
        supabase,
        typedComments.map((c) => c.user_id)
      )

      return typedComments.map((comment) => ({
        ...comment,
        user: userMap.get(comment.user_id),
      })) as CommentWithUser[]
    },
    enabled: !!taskId,
  })
}

export function useAddTaskComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      content,
      parentId,
    }: {
      taskId: string
      content: string
      parentId?: string
    }) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] })
    },
  })
}

export function useUpdateTaskComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; taskId: string; content: string }) => {
      const supabase = createClient()

      const { error } = await supabase
        .from("task_comments")
        .update({ content } as never)
        .eq("id", commentId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", variables.taskId] })
    },
  })
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string; taskId: string }) => {
      const supabase = createClient()

      const { error } = await supabase.from("task_comments").delete().eq("id", commentId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] })
    },
  })
}
