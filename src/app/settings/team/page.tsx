"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useTeam,
  useTeamMembers,
  useTeamInvites,
  useCurrentUserRole,
  useInviteTeamMember,
  useRevokeInvite,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useTeam"
import type { UserRole } from "@/lib/supabase/types"
import { useAuth } from "@/components/auth/AuthProvider"
import {
  ArrowLeft,
  Users,
  Mail,
  Shield,
  ShieldCheck,
  User,
  Eye,
  Crown,
  Loader2,
  UserPlus,
  X,
  MoreVertical,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"

const ROLE_OPTIONS: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: "admin", label: "Admin", icon: <ShieldCheck className="h-4 w-4" /> },
  { value: "member", label: "Member", icon: <User className="h-4 w-4" /> },
  { value: "viewer", label: "Viewer", icon: <Eye className="h-4 w-4" /> },
]

function getRoleIcon(role: UserRole) {
  switch (role) {
    case "owner":
      return <Crown className="h-4 w-4 text-amber-500" />
    case "admin":
      return <ShieldCheck className="h-4 w-4 text-blue-500" />
    case "member":
      return <User className="h-4 w-4 text-gray-500" />
    case "viewer":
      return <Eye className="h-4 w-4 text-gray-400" />
    default:
      return <User className="h-4 w-4" />
  }
}

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "owner":
      return "default"
    case "admin":
      return "secondary"
    default:
      return "outline"
  }
}

export default function TeamSettingsPage() {
  const { user } = useAuth()
  const { data: team, isLoading: teamLoading } = useTeam()
  const { data: members = [], isLoading: membersLoading } = useTeamMembers()
  const { data: invites = [], isLoading: invitesLoading } = useTeamInvites()
  const { data: currentUserRole } = useCurrentUserRole()
  const { addToast } = useToast()

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("member")

  const inviteMutation = useInviteTeamMember()
  const revokeMutation = useRevokeInvite()
  const updateRoleMutation = useUpdateMemberRole()
  const removeMemberMutation = useRemoveMember()

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin"

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole })
      addToast(`Invitation sent to ${inviteEmail}`, "success")
      setInviteEmail("")
      setInviteRole("member")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to send invite", "error")
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeMutation.mutateAsync(inviteId)
      addToast("Invitation has been revoked", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to revoke invite", "error")
    }
  }

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role })
      addToast("Member role has been updated", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to update role", "error")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberMutation.mutateAsync(userId)
      addToast("Member has been removed from the team", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to remove member", "error")
    }
  }

  if (teamLoading) {
    return (
      <PageContainer title="Team Settings" description="Manage your team">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Team Settings"
      description="Manage team members and invitations"
      action={
        <Link href="/settings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {team?.name || "Your Team"}
            </CardTitle>
            <CardDescription>
              {team ? `Team slug: ${team.slug}` : "Create or join a team to collaborate"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Invite Members */}
        {canManageTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Team Members
              </CardTitle>
              <CardDescription>
                Send invitations to add new members to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                {invites.length} pending invitation{invites.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{invite.role}</Badge>
                        {canManageTeam && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeInvite(invite.id)}
                            disabled={revokeMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""} in this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {membersLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members yet
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.display_name || member.email}
                          {member.id === user?.id && (
                            <span className="text-muted-foreground ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                      {canManageTeam && member.role !== "owner" && member.id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "viewer")}>
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions Info */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>What each role can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Owner</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full access, billing, delete team
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manage members, projects, settings
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Member</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create and run projects, tasks
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Viewer</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  View only, no modifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
