/**
 * Seed script for Wheelhouse Dashboard
 * Run with: npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// New Supabase key naming: secret key (bypasses RLS) or publishable key (respects RLS)
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

// Use secret key if available (bypasses RLS), otherwise use anon/publishable key
const supabaseKey = supabaseSecretKey || supabaseAnonKey;
if (!supabaseKey) {
  console.error("Missing SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

if (!supabaseSecretKey) {
  console.warn("⚠️  No SUPABASE_SECRET_KEY found - using anon key (RLS applies)");
  console.warn("   Add SUPABASE_SECRET_KEY to .env.local to bypass RLS for seeding\n");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌱 Starting seed...\n");

  // Get the first user
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, team_id")
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error("❌ No user found. Please sign in to the dashboard first, then run the seed again.");
    console.error("Error:", userError?.message);
    process.exit(1);
  }

  const userId = users[0].id;
  let teamId = users[0].team_id;
  console.log(`✓ Found user: ${userId}`);

  // Create team if user doesn't have one
  if (!teamId) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({ name: "Demo Team", slug: "demo-team" })
      .select()
      .single();

    if (teamError) {
      console.error("❌ Failed to create team:", teamError.message);
      process.exit(1);
    }

    teamId = team.id;

    // Update user with team
    await supabase
      .from("users")
      .update({ team_id: teamId, role: "owner" })
      .eq("id", userId);

    console.log(`✓ Created team: ${teamId}`);
  } else {
    console.log(`✓ Using existing team: ${teamId}`);
  }

  // ============================================================================
  // Project 1: Auth System Overhaul (Running)
  // ============================================================================
  const { data: project1, error: p1Error } = await supabase
    .from("projects")
    .insert({
      team_id: teamId,
      created_by: userId,
      name: "Auth System Overhaul",
      description: "Complete authentication system rewrite with OAuth2, MFA, and improved session management",
      repo_url: "https://github.com/wearegodigital/aioradar-app",
      status: "running",
    })
    .select()
    .single();

  if (p1Error) {
    console.error("❌ Failed to create project 1:", p1Error.message);
    process.exit(1);
  }
  console.log(`✓ Created project: ${project1.name}`);

  // Sprint 1: Core Auth (Completed)
  const { data: sprint1 } = await supabase
    .from("sprints")
    .insert({
      project_id: project1.id,
      name: "Core Authentication",
      description: "Basic auth infrastructure: database schema, password hashing, session management",
      order_index: 1,
      status: "completed",
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  // Sprint 2: OAuth Integration (Running)
  const { data: sprint2 } = await supabase
    .from("sprints")
    .insert({
      project_id: project1.id,
      name: "OAuth Integration",
      description: "Add Google and GitHub OAuth providers with account linking",
      order_index: 2,
      status: "running",
    })
    .select()
    .single();

  // Sprint 3: MFA (Pending)
  await supabase
    .from("sprints")
    .insert({
      project_id: project1.id,
      name: "Multi-Factor Authentication",
      description: "TOTP-based MFA with backup codes and recovery options",
      order_index: 3,
      status: "pending",
    })
    .select()
    .single();

  console.log(`✓ Created 3 sprints for ${project1.name}`);

  // Tasks for Sprint 1 (all completed)
  await supabase.from("tasks").insert([
    {
      team_id: teamId,
      project_id: project1.id,
      sprint_id: sprint1?.id,
      created_by: userId,
      description: "Set up authentication database schema with users, sessions, and tokens tables",
      order_index: 1,
      repo_url: "https://github.com/wearegodigital/aioradar-app",
      branch: "feat/auth-schema",
      mode: "sequential",
      status: "completed",
      progress: 100,
      pr_url: "https://github.com/wearegodigital/aioradar-app/pull/101",
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      team_id: teamId,
      project_id: project1.id,
      sprint_id: sprint1?.id,
      created_by: userId,
      description: "Implement secure password hashing with Argon2",
      order_index: 2,
      repo_url: "https://github.com/wearegodigital/aioradar-app",
      branch: "feat/password-hash",
      mode: "sequential",
      status: "completed",
      progress: 100,
      pr_url: "https://github.com/wearegodigital/aioradar-app/pull/102",
      completed_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      team_id: teamId,
      project_id: project1.id,
      sprint_id: sprint1?.id,
      created_by: userId,
      description: "Create login and logout API endpoints",
      order_index: 3,
      repo_url: "https://github.com/wearegodigital/aioradar-app",
      branch: "feat/auth-endpoints",
      mode: "sequential",
      status: "completed",
      progress: 100,
      pr_url: "https://github.com/wearegodigital/aioradar-app/pull/103",
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  // Tasks for Sprint 2 (mixed status)
  const { data: sprint2Tasks } = await supabase
    .from("tasks")
    .insert([
      {
        team_id: teamId,
        project_id: project1.id,
        sprint_id: sprint2?.id,
        created_by: userId,
        description: "Add Google OAuth provider configuration",
        order_index: 1,
        repo_url: "https://github.com/wearegodigital/aioradar-app",
        branch: "feat/google-oauth",
        mode: "sequential",
        status: "completed",
        progress: 100,
        pr_url: "https://github.com/wearegodigital/aioradar-app/pull/104",
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        team_id: teamId,
        project_id: project1.id,
        sprint_id: sprint2?.id,
        created_by: userId,
        description: "Add GitHub OAuth provider configuration",
        order_index: 2,
        repo_url: "https://github.com/wearegodigital/aioradar-app",
        branch: "feat/github-oauth",
        mode: "parallel",
        status: "running",
        progress: 65,
      },
      {
        team_id: teamId,
        project_id: project1.id,
        sprint_id: sprint2?.id,
        created_by: userId,
        description: "Implement OAuth callback handler and token exchange",
        order_index: 3,
        repo_url: "https://github.com/wearegodigital/aioradar-app",
        branch: "feat/oauth-callback",
        mode: "sequential",
        status: "pending",
        progress: 0,
      },
      {
        team_id: teamId,
        project_id: project1.id,
        sprint_id: sprint2?.id,
        created_by: userId,
        description: "Link OAuth accounts to existing user profiles",
        order_index: 4,
        repo_url: "https://github.com/wearegodigital/aioradar-app",
        branch: "feat/account-linking",
        mode: "sequential",
        status: "pending",
        progress: 0,
      },
    ])
    .select();

  console.log(`✓ Created 7 tasks for ${project1.name}`);

  // Get the running task for agents/events
  const runningTask = sprint2Tasks?.find((t) => t.status === "running");

  // ============================================================================
  // Project 2: API v2 Migration (Ready)
  // ============================================================================
  const { data: project2 } = await supabase
    .from("projects")
    .insert({
      team_id: teamId,
      created_by: userId,
      name: "API v2 Migration",
      description: "Migrate REST API to v2 with improved response formats, pagination, and rate limiting",
      repo_url: "https://github.com/wearegodigital/api-service",
      status: "ready",
    })
    .select()
    .single();

  console.log(`✓ Created project: ${project2?.name}`);

  // A failed task for variety
  const { data: failedTask } = await supabase
    .from("tasks")
    .insert({
      team_id: teamId,
      project_id: project2?.id,
      created_by: userId,
      description: "Refactor user endpoints to v2 format",
      order_index: 1,
      repo_url: "https://github.com/wearegodigital/api-service",
      branch: "feat/user-api-v2",
      mode: "parallel",
      status: "failed",
      progress: 45,
    })
    .select()
    .single();

  console.log(`✓ Created 1 task for ${project2?.name}`);

  // ============================================================================
  // Agents for running task
  // ============================================================================
  if (runningTask) {
    const { data: agents } = await supabase
      .from("agents")
      .insert([
        {
          task_id: runningTask.id,
          type: "orchestrator",
          status: "completed",
          current_step: null,
          steps_completed: 3,
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        },
        {
          task_id: runningTask.id,
          type: "maker",
          status: "running",
          current_step: "Writing GitHub OAuth configuration...",
          steps_completed: 4,
          started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
          task_id: runningTask.id,
          type: "checker",
          status: "spawned",
          steps_completed: 0,
        },
      ])
      .select();

    console.log(`✓ Created 3 agents for running task`);

    // Events for running task
    if (agents && agents.length >= 2) {
      await supabase.from("events").insert([
        { task_id: runningTask.id, type: "task.started", payload: { initiated_by: "user" }, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[0].id, type: "agent.spawned", payload: { agent_type: "orchestrator" }, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[0].id, type: "agent.progress", payload: { step: "Analyzing repository structure", progress: 10 }, created_at: new Date(Date.now() - 29 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[0].id, type: "agent.progress", payload: { step: "Planning implementation approach", progress: 20 }, created_at: new Date(Date.now() - 29 * 60 * 1000 + 30000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[0].id, type: "agent.progress", payload: { step: "Creating task breakdown", progress: 30 }, created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[0].id, type: "agent.completed", payload: { result: "success", plan_steps: 5 }, created_at: new Date(Date.now() - 28 * 60 * 1000 + 30000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[1].id, type: "agent.spawned", payload: { agent_type: "maker" }, created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[1].id, type: "agent.progress", payload: { step: "Setting up OAuth credentials file", progress: 40 }, created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[1].id, type: "agent.progress", payload: { step: "Configuring GitHub OAuth client", progress: 50 }, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[1].id, type: "agent.progress", payload: { step: "Implementing callback URL handler", progress: 60 }, created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[1].id, type: "agent.progress", payload: { step: "Writing GitHub OAuth configuration...", progress: 65 }, created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { task_id: runningTask.id, agent_id: agents[2].id, type: "agent.spawned", payload: { agent_type: "checker" }, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
      ]);

      console.log(`✓ Created 12 events for running task`);
    }
  }

  // Agents and events for failed task
  if (failedTask) {
    await supabase
      .from("agents")
      .insert([
        {
          task_id: failedTask.id,
          type: "orchestrator",
          status: "completed",
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
        },
        {
          task_id: failedTask.id,
          type: "maker",
          status: "failed",
          error: "Failed to parse response schema: unexpected token at line 42",
          started_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ])
      .select();

    await supabase.from("events").insert([
      { task_id: failedTask.id, type: "task.started", payload: { initiated_by: "user" }, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { task_id: failedTask.id, type: "task.failed", payload: { error: "Maker agent encountered parsing error", retry_count: 2 }, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    ]);

    console.log(`✓ Created 2 agents and 2 events for failed task`);
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("   - 2 projects");
  console.log("   - 3 sprints");
  console.log("   - 8 tasks");
  console.log("   - 5 agents");
  console.log("   - 14 events");
}

seed().catch(console.error);
