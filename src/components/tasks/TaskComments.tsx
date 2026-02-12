"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Send, Reply, Trash2, Edit2, X, Check, User, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CyberpunkSpinner } from "@/components/ui/cyberpunk-spinner"
import {
  useTaskComments,
  useAddTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
  type CommentWithUser,
} from "@/hooks/useTaskComments"
import { useAuth } from "@/components/auth/AuthProvider"
import { cn } from "@/lib/utils"

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuth()
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const addCommentMutation = useAddTaskComment()
  const updateCommentMutation = useUpdateTaskComment()
  const deleteCommentMutation = useDeleteTaskComment()

  // Organize comments into threads
  const rootComments = comments.filter((c) => !c.parent_id)
  const replies = comments.filter((c) => c.parent_id)
  const replyMap = new Map<string, CommentWithUser[]>()
  replies.forEach((reply) => {
    if (reply.parent_id) {
      const existing = replyMap.get(reply.parent_id) || []
      replyMap.set(reply.parent_id, [...existing, reply])
    }
  })

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      await addCommentMutation.mutateAsync({
        taskId,
        content: newComment.trim(),
      })
      setNewComment("")
    } catch {
      // Error handling - toast would be added here
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      await addCommentMutation.mutateAsync({
        taskId,
        content: replyContent.trim(),
        parentId,
      })
      setReplyContent("")
      setReplyingTo(null)
    } catch {
      // Error handling
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        taskId,
        content: editContent.trim(),
      })
      setEditingId(null)
      setEditContent("")
    } catch {
      // Error handling
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      await deleteCommentMutation.mutateAsync({ commentId, taskId })
    } catch {
      // Error handling
    }
  }

  const startEditing = (comment: CommentWithUser) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        {user && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <CyberpunkSpinner size="md" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}

        {/* Comments List */}
        {!isLoading && rootComments.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            {rootComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={replyMap.get(comment.id) || []}
                currentUserId={user?.id}
                editingId={editingId}
                editContent={editContent}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onStartEditing={startEditing}
                onCancelEditing={() => {
                  setEditingId(null)
                  setEditContent("")
                }}
                onEditContentChange={setEditContent}
                onSaveEdit={handleUpdateComment}
                onDelete={handleDeleteComment}
                onStartReply={(id) => {
                  setReplyingTo(id)
                  setReplyContent("")
                }}
                onCancelReply={() => {
                  setReplyingTo(null)
                  setReplyContent("")
                }}
                onReplyContentChange={setReplyContent}
                onSubmitReply={handleSubmitReply}
                isSubmittingReply={addCommentMutation.isPending}
                isUpdating={updateCommentMutation.isPending}
                isDeleting={deleteCommentMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CommentThreadProps {
  comment: CommentWithUser
  replies: CommentWithUser[]
  currentUserId?: string
  editingId: string | null
  editContent: string
  replyingTo: string | null
  replyContent: string
  onStartEditing: (comment: CommentWithUser) => void
  onCancelEditing: () => void
  onEditContentChange: (content: string) => void
  onSaveEdit: (commentId: string) => void
  onDelete: (commentId: string) => void
  onStartReply: (commentId: string) => void
  onCancelReply: () => void
  onReplyContentChange: (content: string) => void
  onSubmitReply: (parentId: string) => void
  isSubmittingReply: boolean
  isUpdating: boolean
  isDeleting: boolean
}

function CommentThread({
  comment,
  replies,
  currentUserId,
  editingId,
  editContent,
  replyingTo,
  replyContent,
  onStartEditing,
  onCancelEditing,
  onEditContentChange,
  onSaveEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  isSubmittingReply,
  isUpdating,
  isDeleting,
}: CommentThreadProps) {
  const isOwner = currentUserId === comment.user_id
  const isEditing = editingId === comment.id
  const isReplying = replyingTo === comment.id

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <CommentItem
        comment={comment}
        isOwner={isOwner}
        isEditing={isEditing}
        editContent={editContent}
        onStartEditing={() => onStartEditing(comment)}
        onCancelEditing={onCancelEditing}
        onEditContentChange={onEditContentChange}
        onSaveEdit={() => onSaveEdit(comment.id)}
        onDelete={() => onDelete(comment.id)}
        onStartReply={() => onStartReply(comment.id)}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-11 flex gap-3">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={onCancelReply}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyContent.trim() || isSubmittingReply}
              >
                {isSubmittingReply ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Reply"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isOwner={currentUserId === reply.user_id}
              isEditing={editingId === reply.id}
              editContent={editContent}
              onStartEditing={() => onStartEditing(reply)}
              onCancelEditing={onCancelEditing}
              onEditContentChange={onEditContentChange}
              onSaveEdit={() => onSaveEdit(reply.id)}
              onDelete={() => onDelete(reply.id)}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: CommentWithUser
  isOwner: boolean
  isEditing: boolean
  editContent: string
  onStartEditing: () => void
  onCancelEditing: () => void
  onEditContentChange: (content: string) => void
  onSaveEdit: () => void
  onDelete: () => void
  onStartReply?: () => void
  isUpdating: boolean
  isDeleting: boolean
  isReply?: boolean
}

function CommentItem({
  comment,
  isOwner,
  isEditing,
  editContent,
  onStartEditing,
  onCancelEditing,
  onEditContentChange,
  onSaveEdit,
  onDelete,
  onStartReply,
  isUpdating,
  isDeleting,
  isReply,
}: CommentItemProps) {
  const avatarSize = isReply ? "w-6 h-6" : "w-8 h-8"
  const iconSize = isReply ? "h-3 w-3" : "h-4 w-4"

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          avatarSize,
          "rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden"
        )}
      >
        {comment.user?.avatar_url ? (
          <Image
            src={comment.user.avatar_url}
            alt=""
            width={isReply ? 24 : 32}
            height={isReply ? 24 : 32}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn(iconSize, "text-muted-foreground")} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("font-medium", isReply ? "text-sm" : "text-sm")}>
            {comment.user?.display_name || comment.user?.email || "Unknown User"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancelEditing}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSaveEdit}
                disabled={!editContent.trim() || isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className={cn("mt-1 whitespace-pre-wrap", isReply ? "text-sm" : "text-sm")}>
              {comment.content}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {onStartReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={onStartReply}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={onStartEditing}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
