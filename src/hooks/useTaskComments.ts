import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { TaskComment, User } from "@/lib/supabase/types"

export interface CommentWithUser extends TaskComment {
  user?: Pick<User, "id" | "email" | "display_name" | "avatar_url">
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const supabase = createClient()

      // Fetch comments for this task
      const { data: comments, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })

      if (error) throw error

      // Fetch user info for each comment
      const typedComments = (comments || []) as TaskComment[]
      const userIds = [...new Set(typedComments.map((c) => c.user_id))]
      const { data: users } = await supabase
        .from("users")
        .select("id, email, display_name, avatar_url")
        .in("id", userIds)

      type UserInfo = Pick<User, "id" | "email" | "display_name" | "avatar_url">
      const userMap = new Map(((users || []) as UserInfo[]).map((u) => [u.id, u]))

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

      const commentData = {
        task_id: taskId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      }

      const { data, error } = await supabase
        .from("task_comments")
        .insert(commentData as never)
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
    mutationFn: async (variables: { commentId: string; taskId: string; content: string }) => {
      const supabase = createClient()

      const { error } = await supabase
        .from("task_comments")
        .update({ content: variables.content } as never)
        .eq("id", variables.commentId)

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
    mutationFn: async (variables: { commentId: string; taskId: string }) => {
      const supabase = createClient()

      const { error } = await supabase.from("task_comments").delete().eq("id", variables.commentId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] })
    },
  })
}
