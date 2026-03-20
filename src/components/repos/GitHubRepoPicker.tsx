"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface GitHubRepoSelection {
  org: string
  repo: string
  branch: string
  repoUrl: string
  defaultBranch: string
}

interface GitHubRepoPickerProps {
  onSelect: (selection: GitHubRepoSelection) => void
  initialOrg?: string
  initialRepo?: string
}

interface OrgItem {
  login: string
}

interface RepoItem {
  name: string
  full_name: string
  clone_url: string
  default_branch: string
}

interface BranchItem {
  name: string
}

async function fetchGitHub<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL("/api/github", window.location.origin)
  url.searchParams.set("endpoint", endpoint)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  const resp = await fetch(url.toString())
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error || "Failed to fetch")
  }
  const data = await resp.json()
  // API returns { orgs: [...] }, { repos: [...] }, { branches: [...] }
  return data[endpoint] || data.orgs || data.repos || data.branches || []
}

export function GitHubRepoPicker({ onSelect, initialOrg, initialRepo }: GitHubRepoPickerProps) {
  const [selectedOrg, setSelectedOrg] = React.useState<string>(initialOrg || "")
  const [selectedRepo, setSelectedRepo] = React.useState<string>(initialRepo || "")
  const [selectedBranch, setSelectedBranch] = React.useState<string>("")
  const [useCustomUrl, setUseCustomUrl] = React.useState(false)
  const [customUrl, setCustomUrl] = React.useState("")

  const orgsQuery = useQuery({
    queryKey: ["github", "orgs"],
    queryFn: () => fetchGitHub<OrgItem>("orgs"),
    staleTime: 5 * 60 * 1000,
  })

  const reposQuery = useQuery({
    queryKey: ["github", "repos", selectedOrg],
    queryFn: () => fetchGitHub<RepoItem>("repos", { org: selectedOrg }),
    enabled: !!selectedOrg,
    staleTime: 5 * 60 * 1000,
  })

  const branchesQuery = useQuery({
    queryKey: ["github", "branches", selectedOrg, selectedRepo],
    queryFn: () => fetchGitHub<BranchItem>("branches", { org: selectedOrg, repo: selectedRepo }),
    enabled: !!selectedOrg && !!selectedRepo,
    staleTime: 2 * 60 * 1000,
  })

  // Ensure data is always an array (API may return non-array on auth failure)
  const orgs = Array.isArray(orgsQuery.data) ? orgsQuery.data : []
  const repos = Array.isArray(reposQuery.data) ? reposQuery.data : []
  const branches = Array.isArray(branchesQuery.data) ? branchesQuery.data : []
  const selectedRepoData = repos.find((r) => r.name === selectedRepo)

  function handleOrgChange(value: string) {
    setSelectedOrg(value)
    setSelectedRepo("")
    setSelectedBranch("")
  }

  function handleRepoChange(value: string) {
    setSelectedRepo(value)
    setSelectedBranch("")
  }

  function handleBranchChange(value: string) {
    setSelectedBranch(value)
    if (selectedRepoData) {
      onSelect({
        org: selectedOrg,
        repo: selectedRepo,
        branch: value,
        repoUrl: selectedRepoData.clone_url,
        defaultBranch: selectedRepoData.default_branch,
      })
    }
  }

  function handleCustomUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setCustomUrl(url)
    if (url.trim()) {
      onSelect({
        org: "",
        repo: "",
        branch: "",
        repoUrl: url.trim(),
        defaultBranch: "",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setUseCustomUrl((v) => !v)}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {useCustomUrl ? "Use GitHub picker" : "Use custom URL"}
        </button>
      </div>

      {useCustomUrl ? (
        <div className="space-y-2">
          <Label htmlFor="custom-repo-url">Repository URL</Label>
          <Input
            id="custom-repo-url"
            type="url"
            placeholder="https://github.com/org/repo.git"
            value={customUrl}
            onChange={handleCustomUrlChange}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={selectedOrg} onValueChange={handleOrgChange} disabled={orgsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={orgsQuery.isLoading ? "Loading..." : "Select organization"} />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.login} value={org.login}>
                    {org.login}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orgsQuery.isError && (
              <p className="text-xs text-destructive">Failed to load organizations</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Repository</Label>
            <Select
              value={selectedRepo}
              onValueChange={handleRepoChange}
              disabled={!selectedOrg || reposQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedOrg
                      ? "Select an organization first"
                      : reposQuery.isLoading
                      ? "Loading..."
                      : "Select repository"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {repos.map((repo) => (
                  <SelectItem key={repo.name} value={repo.name}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reposQuery.isError && (
              <p className="text-xs text-destructive">Failed to load repositories</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Branch</Label>
            <Select
              value={selectedBranch}
              onValueChange={handleBranchChange}
              disabled={!selectedRepo || branchesQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedRepo
                      ? "Select a repository first"
                      : branchesQuery.isLoading
                      ? "Loading..."
                      : "Select branch"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branchesQuery.isError && (
              <p className="text-xs text-destructive">Failed to load branches</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
