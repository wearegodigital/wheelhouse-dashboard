# Wheelhouse Dashboard

Web dashboard for Wheelhouse - agent orchestration for automated code implementation.

## Quick Reference

- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Data**: Supabase (Postgres + Realtime + Auth)
- **State**: React Query + Supabase subscriptions
- **Backend**: Modal (Wheelhouse agents) - separate repo
- **Deploy**: Vercel

## Project Overview

This dashboard provides real-time visibility into Wheelhouse agent orchestration:

- **Projects**: Multi-sprint initiatives with decomposition
- **Sprints**: Focused work periods within projects
- **Tasks**: Atomic units of work executed by agents
- **Planning Chat**: Interactive conversation with Orchestrator before execution
- **Execution Controls**: Run/pause/cancel at any level

## Architecture

```
Dashboard (Vercel)
    │
    ├── Supabase (Data Layer)
    │   ├── Postgres (queryable state)
    │   ├── Realtime (live updates)
    │   └── Auth (magic links)
    │
    └── Modal API (Execution)
        ├── Planning SSE endpoint
        └── Execute endpoints
```

## Key Directories

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages |
| `src/components/` | React components by domain |
| `src/lib/supabase/` | Supabase client setup |
| `src/hooks/` | Custom React hooks |
| `src/types/` | TypeScript type definitions |

## Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Redirect to /projects |
| `/auth/login` | Magic link login |
| `/auth/callback` | Auth callback handler |
| `/projects` | Project list (main dashboard) |
| `/projects/new` | Create project with planning chat |
| `/projects/[id]` | Project detail with sprints |
| `/projects/[id]/plan` | Planning conversation |
| `/sprints/[id]` | Sprint detail with tasks |
| `/tasks` | All tasks (flat view) |
| `/tasks/[id]` | Task detail with agent timeline |
| `/settings` | API keys, team info |

## Component Domains

| Domain | Components |
|--------|------------|
| `layout/` | Header, Sidebar, PageContainer |
| `projects/` | ProjectList, ProjectCard, ProjectDetail |
| `sprints/` | SprintList, SprintCard, SprintDetail |
| `tasks/` | TaskList, TaskCard, TaskDetail, TaskFilters |
| `planning/` | PlanningChat, ChatMessage, ChatInput, DecompositionPreview |
| `execution/` | ExecutionControls, ExecutionStatus, ExecutionProgress |
| `agents/` | AgentTimeline, AgentCard, AgentStepIndicator |
| `events/` | EventLog, EventItem, EventPayload |
| `auth/` | LoginForm, UserMenu, AuthProvider |
| `ui/` | shadcn/ui primitives |

## Data Flow

### Planning Chat
```
User types message
    → POST /api/planning (with SSE)
    → Modal Orchestrator analyzes
    → Stream response chunks via SSE
    → Display in chat interface
    → User approves → Create Project/Sprints/Tasks
```

### Execution
```
User clicks Run
    → POST /api/execute { level, id }
    → Modal spawns Orchestrator
    → Events flow to JSONL → Sync Worker → Supabase
    → Realtime subscription updates UI
```

### Real-time Updates
```
Supabase Realtime
    → Subscribe to projects/sprints/tasks/agents/events tables
    → React Query cache updates
    → Components re-render
```

## Commands

```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript compiler

# Supabase
pnpm supabase:gen # Generate types from schema
```

## Environment Variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Modal API (required for execution)
MODAL_API_URL=https://xxx.modal.run

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `projects` | Multi-sprint initiatives |
| `sprints` | Work periods within projects |
| `tasks` | Atomic work units |
| `agents` | Agent execution tracking |
| `events` | Full event audit trail |
| `planning_conversations` | Chat history |
| `planning_messages` | Individual messages |
| `users` | User profiles |
| `teams` | Team organization |
| `api_keys` | CLI/API authentication |

## Views (Supabase)

| View | Purpose |
|------|---------|
| `project_summary` | Projects with sprint/task counts |
| `sprint_summary` | Sprints with task counts |
| `task_summary` | Tasks with agent/event counts |
| `agent_activity` | Recent agent status |
| `recent_events` | Latest events |

## Development Guidelines

### Adding New Pages
1. Create route in `src/app/`
2. Add server component for data fetching
3. Use client components for interactivity
4. Add to navigation if needed

### Adding New Components
1. Create in appropriate domain folder
2. Export from domain index
3. Use shadcn/ui primitives where possible
4. Add TypeScript types

### Real-time Subscriptions
1. Use `useTaskSubscription` / `useProjectSubscription` hooks
2. Update React Query cache on events
3. Handle connection errors gracefully

### SSE Streaming (Planning Chat)
1. Use `usePlanningChat` hook
2. Handle streaming message updates
3. Parse recommendations from responses

## Related Repositories

- **wheelhouse**: Main backend (Modal agents, JSONL state)
- Schema and sync worker defined in `wheelhouse/.omc/plans/storage-architecture.md`
- Web UI spec in `wheelhouse/.omc/plans/web-ui-dashboard.md`

## Status

MVP in development. Current focus:
- [ ] Auth flow (magic links)
- [ ] Project/Sprint/Task CRUD views
- [ ] Planning chat interface
- [ ] Execution controls
- [ ] Real-time subscriptions
