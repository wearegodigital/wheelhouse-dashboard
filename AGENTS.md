# Wheelhouse Dashboard - Agent Guide

This document helps AI agents understand and work with this codebase effectively.

## Codebase Overview

This is a **Next.js 14** dashboard for the Wheelhouse agent orchestration system. It provides:
- Real-time visibility into agent execution
- Interactive planning with AI Orchestrator
- Execution controls at project/sprint/task levels

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI component library |
| Supabase | 2.x | Database, Auth, Realtime |
| React Query | 5.x | Server state management |
| Lucide | latest | Icons |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── projects/          # Project management
│   ├── sprints/           # Sprint views
│   ├── tasks/             # Task views
│   ├── settings/          # User settings
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # App layout components
│   ├── projects/         # Project-specific
│   ├── sprints/          # Sprint-specific
│   ├── tasks/            # Task-specific
│   ├── planning/         # Planning chat
│   ├── execution/        # Run controls
│   ├── agents/           # Agent status
│   └── events/           # Event timeline
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
│   └── supabase/         # Supabase clients
└── types/                 # TypeScript types
```

## Key Patterns

### Server vs Client Components
- **Server Components**: Data fetching, initial render (default)
- **Client Components**: Interactivity, subscriptions (`"use client"`)

### Data Fetching
```typescript
// Server Component (page.tsx)
export default async function ProjectsPage() {
  const supabase = createServerClient()
  const { data: projects } = await supabase.from('project_summary').select('*')
  return <ProjectList initialData={projects} />
}

// Client Component with React Query + Realtime
export function ProjectList({ initialData }) {
  const { data } = useProjects({ initialData })
  useProjectSubscription((project) => {
    // Update cache on realtime event
  })
  return <div>...</div>
}
```

### Supabase Clients
```typescript
// Browser (client components)
import { createClient } from '@/lib/supabase/client'

// Server (server components, API routes)
import { createClient } from '@/lib/supabase/server'
```

### SSE Streaming (Planning Chat)
```typescript
// API Route
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of orchestratorResponse) {
        controller.enqueue(`data: ${JSON.stringify({ chunk })}\n\n`)
      }
      controller.close()
    }
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/types.ts` | Generated database types |
| `src/hooks/useTasks.ts` | Task data + subscriptions |
| `src/hooks/usePlanningChat.ts` | Planning chat state |
| `src/components/ui/` | shadcn/ui components |

## Common Tasks

### Add a new page
1. Create folder in `src/app/` matching route
2. Add `page.tsx` (server component)
3. Import data, pass to client components

### Add a new component
1. Create in appropriate `src/components/` subfolder
2. Use TypeScript interfaces for props
3. Use shadcn/ui primitives where applicable

### Add real-time subscription
1. Use existing hook pattern from `src/hooks/`
2. Subscribe in useEffect
3. Update React Query cache on events

### Add API route
1. Create in `src/app/api/[route]/route.ts`
2. Export named functions: GET, POST, etc.
3. Use server Supabase client

## Type Definitions

Key types are in `src/types/`:

```typescript
// Project hierarchy
type ProjectStatus = 'draft' | 'planning' | 'ready' | 'running' | 'completed' | 'cancelled'
type SprintStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'cancelled'
type TaskStatus = 'pending' | 'queued' | 'running' | 'validating' | 'completed' | 'failed' | 'cancelled'

// Agents
type AgentType = 'orchestrator' | 'maker' | 'checker' | 'joiner' | 'documenter'
type AgentStatus = 'spawned' | 'running' | 'completed' | 'failed'

// Execution
type ExecutionMode = 'sequential' | 'parallel' | 'swarm' | 'competitive'
```

## Testing

```bash
pnpm test        # Run tests
pnpm test:watch  # Watch mode
```

## Common Gotchas

1. **Server vs Client**: Don't import browser-only code in server components
2. **Supabase RLS**: All queries filtered by team via Row Level Security
3. **Realtime**: Subscribe after initial data load to avoid race conditions
4. **SSE**: Close connections properly on component unmount

## Related Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
