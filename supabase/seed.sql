-- Seed data for testing the Wheelhouse Dashboard
-- Run with: npx supabase db reset (which runs migrations + seed)
-- Or manually: psql -f supabase/seed.sql

-- Note: This seed assumes a user already exists (created via auth).
-- We'll use a DO block to get the first user and create sample data for them.

DO $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
  v_project1_id UUID;
  v_project2_id UUID;
  v_sprint1_id UUID;
  v_sprint2_id UUID;
  v_sprint3_id UUID;
  v_task1_id UUID;
  v_task2_id UUID;
  v_task3_id UUID;
  v_task4_id UUID;
  v_task5_id UUID;
  v_agent1_id UUID;
  v_agent2_id UUID;
  v_agent3_id UUID;
BEGIN
  -- Get the first user (you should be logged in already)
  SELECT id INTO v_user_id FROM public.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please sign in first, then run the seed again.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data for user: %', v_user_id;

  -- Create a team if user doesn't have one
  SELECT team_id INTO v_team_id FROM public.users WHERE id = v_user_id;

  IF v_team_id IS NULL THEN
    INSERT INTO public.teams (name, slug)
    VALUES ('Demo Team', 'demo-team')
    RETURNING id INTO v_team_id;

    UPDATE public.users SET team_id = v_team_id, role = 'owner' WHERE id = v_user_id;
    RAISE NOTICE 'Created team: %', v_team_id;
  END IF;

  -- ============================================================================
  -- Project 1: Auth System Overhaul (Running)
  -- ============================================================================
  INSERT INTO public.projects (team_id, created_by, name, description, repo_url, status)
  VALUES (
    v_team_id,
    v_user_id,
    'Auth System Overhaul',
    'Complete authentication system rewrite with OAuth2, MFA, and improved session management',
    'https://github.com/wearegodigital/aioradar-app',
    'running'
  )
  RETURNING id INTO v_project1_id;

  -- Sprint 1: Core Auth (Completed)
  INSERT INTO public.sprints (project_id, name, description, order_index, status, completed_at)
  VALUES (
    v_project1_id,
    'Core Authentication',
    'Basic auth infrastructure: database schema, password hashing, session management',
    1,
    'completed',
    NOW() - INTERVAL '2 days'
  )
  RETURNING id INTO v_sprint1_id;

  -- Sprint 2: OAuth Integration (Running)
  INSERT INTO public.sprints (project_id, name, description, order_index, status)
  VALUES (
    v_project1_id,
    'OAuth Integration',
    'Add Google and GitHub OAuth providers with account linking',
    2,
    'running'
  )
  RETURNING id INTO v_sprint2_id;

  -- Sprint 3: MFA (Pending)
  INSERT INTO public.sprints (project_id, name, description, order_index, status)
  VALUES (
    v_project1_id,
    'Multi-Factor Authentication',
    'TOTP-based MFA with backup codes and recovery options',
    3,
    'pending'
  )
  RETURNING id INTO v_sprint3_id;

  -- Tasks for Sprint 1 (all completed)
  INSERT INTO public.tasks (team_id, project_id, sprint_id, created_by, description, order_index, repo_url, branch, mode, status, progress, pr_url, completed_at)
  VALUES
    (v_team_id, v_project1_id, v_sprint1_id, v_user_id, 'Set up authentication database schema with users, sessions, and tokens tables', 1, 'https://github.com/wearegodigital/aioradar-app', 'feat/auth-schema', 'sequential', 'completed', 100, 'https://github.com/wearegodigital/aioradar-app/pull/101', NOW() - INTERVAL '3 days'),
    (v_team_id, v_project1_id, v_sprint1_id, v_user_id, 'Implement secure password hashing with Argon2', 2, 'https://github.com/wearegodigital/aioradar-app', 'feat/password-hash', 'sequential', 'completed', 100, 'https://github.com/wearegodigital/aioradar-app/pull/102', NOW() - INTERVAL '2 days' - INTERVAL '12 hours'),
    (v_team_id, v_project1_id, v_sprint1_id, v_user_id, 'Create login and logout API endpoints', 3, 'https://github.com/wearegodigital/aioradar-app', 'feat/auth-endpoints', 'sequential', 'completed', 100, 'https://github.com/wearegodigital/aioradar-app/pull/103', NOW() - INTERVAL '2 days');

  -- Tasks for Sprint 2 (mixed status)
  INSERT INTO public.tasks (team_id, project_id, sprint_id, created_by, description, order_index, repo_url, branch, mode, status, progress, pr_url, completed_at)
  VALUES (v_team_id, v_project1_id, v_sprint2_id, v_user_id, 'Add Google OAuth provider configuration', 1, 'https://github.com/wearegodigital/aioradar-app', 'feat/google-oauth', 'sequential', 'completed', 100, 'https://github.com/wearegodigital/aioradar-app/pull/104', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_task1_id;

  INSERT INTO public.tasks (team_id, project_id, sprint_id, created_by, description, order_index, repo_url, branch, mode, status, progress)
  VALUES (v_team_id, v_project1_id, v_sprint2_id, v_user_id, 'Add GitHub OAuth provider configuration', 2, 'https://github.com/wearegodigital/aioradar-app', 'feat/github-oauth', 'parallel', 'running', 65)
  RETURNING id INTO v_task2_id;

  INSERT INTO public.tasks (team_id, project_id, sprint_id, created_by, description, order_index, repo_url, branch, mode, status, progress)
  VALUES (v_team_id, v_project1_id, v_sprint2_id, v_user_id, 'Implement OAuth callback handler and token exchange', 3, 'https://github.com/wearegodigital/aioradar-app', 'feat/oauth-callback', 'sequential', 'pending', 0)
  RETURNING id INTO v_task3_id;

  INSERT INTO public.tasks (team_id, project_id, sprint_id, created_by, description, order_index, repo_url, branch, mode, status, progress)
  VALUES (v_team_id, v_project1_id, v_sprint2_id, v_user_id, 'Link OAuth accounts to existing user profiles', 4, 'https://github.com/wearegodigital/aioradar-app', 'feat/account-linking', 'sequential', 'pending', 0)
  RETURNING id INTO v_task4_id;

  -- ============================================================================
  -- Project 2: API v2 Migration (Ready)
  -- ============================================================================
  INSERT INTO public.projects (team_id, created_by, name, description, repo_url, status)
  VALUES (
    v_team_id,
    v_user_id,
    'API v2 Migration',
    'Migrate REST API to v2 with improved response formats, pagination, and rate limiting',
    'https://github.com/wearegodigital/api-service',
    'ready'
  )
  RETURNING id INTO v_project2_id;

  -- A failed task for variety
  INSERT INTO public.tasks (team_id, project_id, created_by, description, order_index, repo_url, branch, mode, status, progress)
  VALUES (v_team_id, v_project2_id, v_user_id, 'Refactor user endpoints to v2 format', 1, 'https://github.com/wearegodigital/api-service', 'feat/user-api-v2', 'parallel', 'failed', 45)
  RETURNING id INTO v_task5_id;

  -- ============================================================================
  -- Agents for running task
  -- ============================================================================
  INSERT INTO public.agents (task_id, type, status, current_step, steps_completed, started_at, completed_at)
  VALUES (v_task2_id, 'orchestrator', 'completed', NULL, 3, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes')
  RETURNING id INTO v_agent1_id;

  INSERT INTO public.agents (task_id, type, status, current_step, steps_completed, started_at)
  VALUES (v_task2_id, 'maker', 'running', 'Writing GitHub OAuth configuration...', 4, NOW() - INTERVAL '25 minutes')
  RETURNING id INTO v_agent2_id;

  INSERT INTO public.agents (task_id, type, status, steps_completed)
  VALUES (v_task2_id, 'checker', 'spawned', 0)
  RETURNING id INTO v_agent3_id;

  -- Agents for failed task
  INSERT INTO public.agents (task_id, type, status, error, started_at, completed_at)
  VALUES (v_task5_id, 'orchestrator', 'completed', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour' - INTERVAL '55 minutes');

  INSERT INTO public.agents (task_id, type, status, error, started_at, completed_at)
  VALUES (v_task5_id, 'maker', 'failed', 'Failed to parse response schema: unexpected token at line 42', NOW() - INTERVAL '1 hour' - INTERVAL '50 minutes', NOW() - INTERVAL '1 hour');

  -- ============================================================================
  -- Events for running task
  -- ============================================================================
  INSERT INTO public.events (task_id, agent_id, type, payload, created_at)
  VALUES
    (v_task2_id, NULL, 'task.started', '{"initiated_by": "user"}', NOW() - INTERVAL '30 minutes'),
    (v_task2_id, v_agent1_id, 'agent.spawned', '{"agent_type": "orchestrator"}', NOW() - INTERVAL '30 minutes'),
    (v_task2_id, v_agent1_id, 'agent.progress', '{"step": "Analyzing repository structure", "progress": 10}', NOW() - INTERVAL '29 minutes'),
    (v_task2_id, v_agent1_id, 'agent.progress', '{"step": "Planning implementation approach", "progress": 20}', NOW() - INTERVAL '29 minutes'),
    (v_task2_id, v_agent1_id, 'agent.progress', '{"step": "Creating task breakdown", "progress": 30}', NOW() - INTERVAL '28 minutes'),
    (v_task2_id, v_agent1_id, 'agent.completed', '{"result": "success", "plan_steps": 5}', NOW() - INTERVAL '28 minutes'),
    (v_task2_id, v_agent2_id, 'agent.spawned', '{"agent_type": "maker"}', NOW() - INTERVAL '25 minutes'),
    (v_task2_id, v_agent2_id, 'agent.progress', '{"step": "Setting up OAuth credentials file", "progress": 40}', NOW() - INTERVAL '20 minutes'),
    (v_task2_id, v_agent2_id, 'agent.progress', '{"step": "Configuring GitHub OAuth client", "progress": 50}', NOW() - INTERVAL '15 minutes'),
    (v_task2_id, v_agent2_id, 'agent.progress', '{"step": "Implementing callback URL handler", "progress": 60}', NOW() - INTERVAL '10 minutes'),
    (v_task2_id, v_agent2_id, 'agent.progress', '{"step": "Writing GitHub OAuth configuration...", "progress": 65}', NOW() - INTERVAL '5 minutes'),
    (v_task2_id, v_agent3_id, 'agent.spawned', '{"agent_type": "checker"}', NOW() - INTERVAL '2 minutes');

  -- Events for failed task
  INSERT INTO public.events (task_id, type, payload, created_at)
  VALUES
    (v_task5_id, NULL, 'task.started', '{"initiated_by": "user"}', NOW() - INTERVAL '2 hours'),
    (v_task5_id, NULL, 'task.failed', '{"error": "Maker agent encountered parsing error", "retry_count": 2}', NOW() - INTERVAL '1 hour');

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Created 2 projects, 3 sprints, 8 tasks, 5 agents, 14 events';
END;
$$;
