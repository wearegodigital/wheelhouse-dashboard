"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRepos } from "@/hooks/useRepos"
import { useClients } from "@/hooks/useClients"
import { useProjects } from "@/hooks/useProjects"
import { Plus, GitBranch, Search, FolderGit2, Building2, FolderOpen } from "lucide-react"
import type { Repo } from "@/lib/supabase/types"

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function RepoCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 bg-muted rounded w-2/3 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Repo card ─────────────────────────────────────────────────────────────────

function RepoCard({ repo, clientName, projectCount }: { repo: Repo; clientName?: string; projectCount: number }) {
  const githubHandle =
    repo.github_org && repo.github_repo
      ? `${repo.github_org}/${repo.github_repo}`
      : repo.github_org || repo.github_repo || null

  return (
    <Link href={`/repos/${repo.id}`} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group-hover:border-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <FolderGit2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
              {repo.name}
            </CardTitle>
          </div>
          {githubHandle && (
            <p className="text-xs text-muted-foreground font-mono pl-6 truncate">
              {githubHandle}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {clientName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {clientName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 shrink-0" />
              {repo.default_branch || "main"}
            </span>
            <span className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              {`${projectCount} project${projectCount !== 1 ? "s" : ""}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReposPage() {
  const [search, setSearch] = useState("")

  const { data: repos, isLoading } = useRepos({ search: search || undefined })
  const { data: clients } = useClients()
  const { data: allProjects } = useProjects()

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const projectCountMap = useMemo(() => {
    const map = new Map<string, number>()
    allProjects?.forEach((p) => {
      if (p.repo_id) map.set(p.repo_id, (map.get(p.repo_id) ?? 0) + 1)
    })
    return map
  }, [allProjects])

  return (
    <PageContainer
      title="Repositories"
      action={
        <Link href="/repos/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Repository
          </Button>
        </Link>
      }
    >
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search repositories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RepoCardSkeleton key={i} />
          ))}
        </div>
      ) : !repos || repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderGit2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            {search ? "No repositories match your search" : "No repositories yet"}
          </p>
          {!search && (
            <Link href="/repos/new">
              <Button variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add your first repository
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              clientName={repo.client_id ? clientMap.get(repo.client_id) : undefined}
              projectCount={projectCountMap.get(repo.id) ?? 0}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
