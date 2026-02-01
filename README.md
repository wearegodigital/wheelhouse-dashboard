# Wheelhouse Dashboard

A modern web interface for the Wheelhouse agent orchestration system. Built with Next.js, shadcn/ui, and Supabase for real-time task management and execution coordination.

## Overview

Wheelhouse Dashboard provides a visual interface for managing distributed agent tasks, planning work interactively with the Orchestrator agent, and monitoring execution in real-time. It's the front-end complement to the [Wheelhouse](https://github.com/yourusername/wheelhouse) backend system.

**Features:**
- Interactive project, sprint, and task management
- Planning chat with Orchestrator agent before execution
- Real-time status updates via Supabase Realtime
- Execution controls (run, pause, cancel) at any level
- API key management for CLI access
- Full audit trail of all events

## Prerequisites

- **Node.js 20+** and pnpm (or npm)
- **Supabase** account with database and Realtime enabled
- **Modal** account for agent backend access
- **Git** for version control

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Modal Backend Configuration
MODAL_API_URL=https://your-modal-app.modal.run
MODAL_TOKEN=your-modal-token-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your production URL
NODE_ENV=development  # Set to 'production' for production builds
```

### Getting Environment Values

**Supabase:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Settings → API
3. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Modal:**
1. Deploy the Wheelhouse backend to Modal
2. Get your Modal API URL from the deployment
3. Generate a Modal token from your account settings

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/wheelhouse-dashboard
cd wheelhouse-dashboard
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and Modal credentials
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. (Optional) Seed Test Data

```bash
pnpm seed
```

This populates your Supabase database with sample projects, sprints, and tasks for development.

## Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Lint code with ESLint
pnpm lint

# Format code with Prettier
pnpm format

# Type checking with TypeScript
pnpm type-check

# Run tests (if configured)
pnpm test

# Seed development database
pnpm seed

# Generate Supabase types
pnpm gen:types

# Clean build artifacts
pnpm clean
```

## Project Structure

```
wheelhouse-dashboard/
├── app/
│   ├── projects/           # Project list and detail pages
│   ├── sprints/            # Sprint detail pages
│   ├── tasks/              # Task list and detail pages
│   ├── api/                # API routes (planning, execution, webhooks)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── planning/           # Planning chat UI
│   ├── execution/          # Execution controls (run, pause, cancel)
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Reusable components
├── lib/
│   ├── supabase/           # Supabase client and queries
│   ├── api/                # API client helpers
│   └── utils.ts            # Utility functions
├── hooks/
│   ├── useProjects.ts      # Projects data and subscriptions
│   ├── useSprints.ts       # Sprints data and subscriptions
│   ├── useTasks.ts         # Tasks data and subscriptions
│   └── useExecution.ts     # Execution control hooks
├── styles/
│   └── globals.css         # Global Tailwind styles
├── public/                 # Static assets
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Features

### 1. Project Management

Navigate to `/projects` to view all projects. Click a project to see its sprints and run controls.

**Features:**
- Create new projects
- View project status and progress
- Initiate project-wide execution
- View all associated sprints and tasks

### 2. Planning Chat

Click "Plan This Project" to start an interactive planning session with the Orchestrator.

**Workflow:**
1. Describe your work goal
2. Orchestrator proposes decomposition into sprints and tasks
3. Review proposal and provide feedback
4. Iterate until satisfied
5. Confirm to create project/sprints/tasks
6. Execute from the main project page

### 3. Execution Controls

Run tasks at any level (project, sprint, or task):
- **Run**: Execute immediately
- **Pause**: Pause running execution
- **Cancel**: Cancel and rollback

Status updates are real-time via Supabase Realtime subscriptions.

### 4. Real-time Updates

All data automatically updates when changes occur in Modal:
- Task status changes
- Agent progress updates
- Execution completion/failure
- Planning conversation messages

### 5. API Key Management

Generate API keys from the settings page to use with the CLI:

```bash
wheelhouse config set api-key <your-key>
wheelhouse run --task "description"
```

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

**In Vercel Dashboard:**
1. Link your GitHub repository
2. Set environment variables (Supabase URL/Key, Modal API URL)
3. Deploy automatically on push to main

### Deploy to Other Platforms

The app is a standard Next.js 14 application and works on any Node.js hosting:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted with `npm start`

## Architecture

### Frontend (Next.js + React)
- Server components for data fetching (minimal client bundle)
- Client components for interactivity (planning chat, execution controls)
- Real-time subscriptions via Supabase Realtime

### Backend (Modal)
- Orchestrator and agent functions
- Planning chat SSE streaming
- Execution endpoints
- State persistence to JSONL

### Database (Supabase)
- Postgres for structured data (projects, sprints, tasks)
- Realtime subscriptions for live updates
- Auth for secure access

### Data Flow

```
User Action (Web UI)
    ↓
Next.js API Route
    ↓
Modal Backend Function
    ↓
JSONL Event Store (durable)
    ↓
Supabase Sync Worker
    ↓
Supabase Postgres
    ↓
Real-time Subscription
    ↓
Web UI Updates
```

## Testing

### Manual Testing Checklist

- [ ] Create a new project
- [ ] Start planning chat and decompose work
- [ ] Approve decomposition and create project
- [ ] Run individual task from task detail page
- [ ] Run entire sprint
- [ ] Cancel running execution
- [ ] Check real-time updates
- [ ] Verify API keys work with CLI

### Automated Tests

```bash
pnpm test
```

(Test setup instructions coming in future versions)

## Troubleshooting

### Supabase Connection Issues

**Error:** `Could not connect to Supabase`

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Realtime is enabled in Supabase dashboard
4. Check browser console for CORS errors

### Modal API Timeout

**Error:** `Modal API request timed out`

**Solution:**
1. Verify `MODAL_API_URL` is correct and accessible
2. Check Modal deployment status in Modal dashboard
3. Ensure `MODAL_TOKEN` is valid
4. Check network connectivity

### Planning Chat Not Streaming

**Error:** Messages don't appear in real-time

**Solution:**
1. Check browser console for SSE errors
2. Verify Modal endpoint is responding
3. Clear browser cache and hard refresh
4. Check network tab for streaming connection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Related Projects

- [Wheelhouse](https://github.com/yourusername/wheelhouse) - Backend agent orchestration system
- [oh-my-claudecode](https://github.com/yourusername/oh-my-claudecode) - Multi-agent orchestration framework

## Support

For issues and questions:
- Open an issue on GitHub
- Check [Wheelhouse documentation](../CLAUDE.md)
- Review [Architecture docs](./.omc/plans/web-ui-dashboard.md)

## Roadmap

- [ ] Real-time execution progress visualization
- [ ] Agent-level execution controls
- [ ] Custom metrics and dashboards
- [ ] Slack/Notion integration UI
- [ ] Advanced filtering and search
- [ ] Execution history and replay
- [ ] Team collaboration features
