"use client"

import { useState } from "react"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClients, useCreateClient } from "@/hooks/useClients"
import { useRepos } from "@/hooks/useRepos"
import { Plus, Building2, Search, FolderGit2 } from "lucide-react"
import type { Client } from "@/lib/supabase/types"

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Active</Badge>
  if (status === "on_hold") return <Badge variant="warning">On Hold</Badge>
  if (status === "archived") return <Badge variant="outline">Archived</Badge>
  return <Badge variant="outline">{status}</Badge>
}

// ─── Client type badge ─────────────────────────────────────────────────────────

function ClientTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="capitalize">
      {type.replace(/_/g, " ")}
    </Badge>
  )
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function ClientCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 bg-muted rounded w-2/3 mb-2" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="h-5 bg-muted rounded-full w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Client card ───────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const { data: repos } = useRepos({ client_id: client.id })

  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group-hover:border-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
              {client.name}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusBadge status={client.status} />
            <ClientTypeBadge type={client.client_type} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5 shrink-0" />
              {repos == null ? "—" : `${repos.length} repo${repos.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Status filter pills ───────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "archived", label: "Archived" },
]

// ─── New client dialog ─────────────────────────────────────────────────────────

function NewClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState("active")
  const [clientType, setClientType] = useState("agency")
  const { mutate: createClient, isPending } = useCreateClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createClient(
      { name: name.trim(), status, client_type: clientType },
      {
        onSuccess: () => {
          setName("")
          setStatus("active")
          setClientType("agency")
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="client-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-type">Type</Label>
            <Select value={clientType} onValueChange={setClientType}>
              <SelectTrigger id="client-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: clients, isLoading } = useClients({
    search: search || undefined,
    status: statusFilter || undefined,
  })

  return (
    <PageContainer
      title="Clients"
      action={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      ) : !clients || clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            {search || statusFilter ? "No clients match your filters" : "No clients yet"}
          </p>
          {!search && !statusFilter && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  )
}
