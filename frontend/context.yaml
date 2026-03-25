app:
  name: Timeline Frontend
  description: >
    Next.js 14 App Router SaaS frontend. Provides kanban boards, task
    tables, timeline views, analytics, admin panel, workspace management,
    OAuth + biometric auth UI, and real-time online-status via WebSocket.
  framework: "Next.js 14 (App Router, TypeScript)"
  styling: "Tailwind CSS + shadcn/ui"
  state: "React Query (server state) + Zustand (client UI state)"
  font: "DM Sans (Google Fonts)"

structure:
  src_folders:
    - "app/: Next.js App Router pages & layouts"
    - "components/: all React components organized by feature"
    - "hooks/: custom React hooks (api + UI)"
    - "context/: React Context providers"
    - "stores/: Zustand stores"
    - "lib/: API client functions, logger, utils"
    - "types/: shared TypeScript types"
    - "constant/: enums and constant values"
    - "services/: thin service wrappers"
    - "workers/: Web Workers"
    - "styles/: extra CSS"
    - "hoc/: higher-order components"
    - "page/: legacy page-level components"

pages:
  - name: Root Landing
    route: /
    file: src/app/page.tsx
    components_used: [Navbar, LandingHero, CardsCarousel, Features]
    api_calls: []

  - name: Sign In
    route: /sign-in
    file: "src/app/(auth)/sign-in/page.tsx"
    components_used: [SignInForm, BiometricLoginButton]
    api_calls: [POST /api/auth/login, POST /api/auth/biometric/login]

  - name: Sign Up
    route: /sign-up
    file: "src/app/(auth)/sign-up/page.tsx"
    components_used: [SignUpForm, AuthSetup]
    api_calls: [POST /api/auth/register]

  - name: Verify Email
    route: /verify-email
    file: src/app/verify-email/page.tsx
    components_used: [ResendVerificationButton]
    api_calls: [POST /api/auth/resend-verification]

  - name: OAuth Callback
    route: /oauth-callback
    file: src/app/oauth-callback/page.tsx
    components_used: []
    api_calls: ["Handled server-side by backend google/github callback routes"]

  - name: Workspace Root
    route: /workspace
    file: src/app/workspace/page.tsx
    components_used: [WorkspaceLayoutContent, WorkspaceProviders, CentralLoader]
    api_calls: [GET /api/workspace, GET /api/auth/me]

  - name: Workspace Dashboard
    route: "/workspace/[workspaceId]"
    file: "src/app/workspace/[workspaceId]/page.tsx"
    components_used: [DashboardPage, WorkspaceAnalytics, RecentTasks]
    api_calls: [GET /api/workspace/:id/analytics, GET /api/workspace/:id/tasks]

  - name: Project Tasks (Table)
    route: "/workspace/[workspaceId]/projects/[projectId]"
    file: "src/app/workspace/[workspaceId]/projects/[projectId]/page.tsx"
    components_used: [TaskTable, TaskFilter, CreateTaskDialog]
    api_calls: [GET /api/workspace/:id/projects/:pid/tasks]

  - name: Kanban Board
    route: "/workspace/[workspaceId]/projects/[projectId]/kanban"
    file: "src/app/workspace/[workspaceId]/projects/[projectId]/kanban/page.tsx"
    components_used: [KanbanBoard, KanbanColumn, TaskCard]
    api_calls: [GET /api/workspace/:id/projects/:pid/tasks, PATCH .../tasks/:tid]

  - name: Timeline View
    route: "/workspace/[workspaceId]/projects/[projectId]/timeline"
    file: "src/app/workspace/[workspaceId]/projects/[projectId]/timeline/page.tsx"
    components_used: [TimelineView, GanttBar]
    api_calls: [GET /api/workspace/:id/projects/:pid/tasks]

  - name: Settings
    route: "/workspace/[workspaceId]/settings"
    file: "src/app/workspace/[workspaceId]/settings/page.tsx"
    components_used: [WorkspaceSettings, MemberTable, InviteLink]
    api_calls: [GET /api/workspace/:id/members, PUT /api/workspace/:id]

  - name: Analytics
    route: "/workspace/[workspaceId]/analytics"
    file: "src/app/workspace/[workspaceId]/analytics/page.tsx"
    components_used: [AnalyticsStats, ProjectsTab, TeamTab, ProductivityTab, InsightsTab]
    api_calls: [GET /api/workspace/:id/analytics, GET /api/workspace/:id/members]

  - name: Admin Dashboard
    route: /admin/dashboard
    file: src/app/admin/dashboard/page.tsx
    components_used: [AdminDashboardEmbed, UserManagementPanel]
    api_calls: [GET /api/admin/metrics, GET /api/admin/users]

  - name: Admin Users
    route: /admin/users
    file: src/app/admin/users/page.tsx
    components_used: [UserManagementPanel]
    api_calls: [GET /api/admin/users]

components:
  navbar:
    - name: NavbarMain
      path: src/components/Navbar/NavbarMain.tsx
      props: []
      child_components: [ClientNavbar, MobileNav, UserAccountNav, ThemeSwitch, CommandSearchMenu]
      used_in: [WorkspaceLayoutContent]

    - name: CommandSearchMenu
      path: src/components/Navbar/CommandSearchMenu.tsx
      purpose: "Global cmd+k search for tasks and projects"
      hooks_used: [useQuery]

    - name: UserAccountNav
      path: src/components/Navbar/UserAccountNav.tsx
      purpose: "Avatar dropdown with logout, profile, workspace links"
      hooks_used: [useAuth, useAuthContext]

    - name: MyWorkspaces
      path: src/components/Navbar/MyWorkspaces.tsx
      purpose: "Lists all workspaces user belongs to"
      hooks_used: [useGetWorkspace]

    - name: ThemeSwitch
      path: src/components/Navbar/ThemeSwitch.tsx
      purpose: "Light/dark/system theme toggle"
      hooks_used: [useTheme]

  sidebar:
    - name: Asidebar
      path: src/components/asidebar/asidebar.tsx
      purpose: "Left navigation with project list and workspace links"
      child_components: [NavMain, NavProjects, WorkspaceSwitcher, SidebarLogo]

    - name: WorkspaceSwitcher
      path: src/components/asidebar/workspace-switcher.tsx
      purpose: "Dropdown to switch active workspace"
      hooks_used: [useGetWorkspace, useAuthContext]

    - name: NavProjects
      path: src/components/asidebar/nav-projects.tsx
      purpose: "Renders list of projects in current workspace"
      hooks_used: [useGetProjects]

  analytics:
    - name: AnalyticsStats
      path: src/components/analytics/AnalyticsStats.tsx
      child_components: [AnalyticsStatCard, AnalyticsHeader]
      hooks_used: [useQuery]

    - name: ProjectsTab
      path: src/components/analytics/ProjectsTab.tsx
      purpose: "Per-project task breakdown chart"

    - name: TeamTab
      path: src/components/analytics/TeamTab.tsx
      purpose: "Member task distribution chart"

    - name: ProductivityTab
      path: src/components/analytics/ProductivityTab.tsx
      purpose: "Completion rate over time chart"

    - name: InsightsTab
      path: src/components/analytics/InsightsTab.tsx
      purpose: "AI-generated insights notes per workspace"

  kanban:
    - name: KanbanBoard
      path: src/components/kanban/KanbanBoard.tsx
      purpose: "Main drag-and-drop board"
      child_components: [KanbanColumn, TaskCard, AddTaskDialog]
      hooks_used: [useKanbanStore, useQuery, useMutation]

    - name: KanbanColumn
      path: src/components/kanban/KanbanColumn.tsx
      purpose: "Single status column with task cards"
      props: [column, tasks]

    - name: TaskCard
      path: src/components/kanban/TaskCard.tsx
      purpose: "Draggable task card with priority/assignee badge"
      props: [task]

  task_table:
    - name: TaskTable
      path: src/components/task/TaskTable.tsx
      purpose: "Sortable, filterable table view of tasks"
      child_components: [TaskFilter, TaskRow, CreateTaskDialog, EditTaskDialog]
      hooks_used: [useQuery, useTaskTableFilter]

    - name: TaskFilter
      path: src/components/task/TaskFilter.tsx
      purpose: "Status / priority / assignee filter bar"
      hooks_used: [useTaskTableFilter]

    - name: CreateTaskDialog
      path: src/components/task/CreateTaskDialog.tsx
      purpose: "Modal form for new task creation"
      hooks_used: [useMutation, useGetWorkspaceMembers]

    - name: EditTaskDialog
      path: src/components/task/EditTaskDialog.tsx
      purpose: "Modal form for editing existing task"
      hooks_used: [useMutation]

  auth:
    - name: AuthSetup
      path: src/components/auth/AuthSetup.tsx
      purpose: "Post-login workspace redirect logic"

    - name: BiometricLoginButton
      path: src/components/auth/BiometricLoginButton.tsx
      purpose: "Triggers WebAuthn biometric login flow"
      hooks_used: [useBiometricContext]

    - name: ResendVerificationButton
      path: src/components/auth/ResendVerificationButton.tsx
      purpose: "Resends email verification link"
      hooks_used: [useMutation]

  onboarding:
    - name: WorkspaceTourWrapper
      path: src/components/onboarding/WorkspaceTourWrapper.tsx
      purpose: "Guided tour overlay for new workspaces"
      hooks_used: [useOnboarding]

  misc:
    - name: Header
      path: src/components/header.tsx
      purpose: "Page-level header with notification history"
      child_components: [notification-history]

    - name: CentralLoader
      path: src/components/loading.tsx
      purpose: "Full-screen loading gate; waits for auth + workspace"
      hooks_used: [useAuthContext]

hooks:
  api_hooks:
    - name: useAuth
      path: src/hooks/api/use-auth.tsx
      purpose: "Fetches current user via GET /api/auth/me"
      query_key: [authUser]
      stale_time: "5 min"
      used_in: [AuthProvider, auth-provider.tsx]

    - name: useGetWorkspace
      path: src/hooks/api/use-get-workspace.tsx
      purpose: "Fetches workspace by ID via GET /api/workspace/:id"
      query_key: [workspace, workspaceId]
      used_in: [AuthProvider, WorkspaceSwitcher]

    - name: useGetProjects
      path: src/hooks/api/use-get-projects.tsx
      purpose: "Fetches all projects in workspace"
      query_key: [projects, workspaceId]
      used_in: [NavProjects, Asidebar]

    - name: useGetWorkspaceMembers
      path: src/hooks/api/use-get-workspace-members.ts
      purpose: "Fetches member list for workspace"
      query_key: [members, workspaceId]
      used_in: [CreateTaskDialog, Settings]

    - name: useCachedQuery
      path: src/hooks/api/use-cached-query.ts
      purpose: "React Query wrapper with aggressive staleTime caching"
      used_in: "Various data-fetching hooks"

  ui_hooks:
    - name: useTimeline
      path: src/hooks/use-timeline.ts
      purpose: "Fetches and creates timeline entries via /api/timeline"
      exports: [useTimeline, useTimelineByDate, useCreateTimelineEntry]
      used_in: [TimelineView]

    - name: useWorkspaceId
      path: src/hooks/use-workspace-id.ts
      purpose: "Extracts workspaceId from URL params"
      used_in: [AuthProvider, almost all workspace pages]

    - name: usePermissions
      path: src/hooks/use-permissions.ts
      purpose: "Derives permission list from user role in workspace"
      used_in: [AuthProvider (hasPermission())]

    - name: useOnlineStatus
      path: src/hooks/use-online-status.ts
      purpose: "Polls /api/workspace/online-status for member presence"
      used_in: [MemberTable, NavProjects]

    - name: useWebSocketOnlineStatus
      path: src/hooks/use-websocket-online-status.ts
      purpose: "WebSocket connection (/ws) for real-time member presence"
      used_in: [WorkspaceProviders]

    - name: useSSEEvents
      path: src/hooks/use-sse-events.ts
      purpose: "Server-Sent Events listener for workspace events"
      used_in: [WorkspaceLayoutContent]

    - name: useTaskTableFilter
      path: src/hooks/use-task-table-filter.ts
      purpose: "Manages filter state (status, priority, assignee, keyword)"
      used_in: [TaskTable, TaskFilter]

    - name: useTheme
      path: src/hooks/use-theme.ts
      purpose: "Reads/writes theme (light/dark/system) from localStorage"
      used_in: [ThemeSwitch, ThemeProvider]

    - name: useOnboarding
      path: src/hooks/use-onboarding.ts
      purpose: "Tracks onboarding tour step state"
      used_in: [WorkspaceTourWrapper]

    - name: useViewMode
      path: src/hooks/use-view-mode.ts
      purpose: "Switches between Table/Kanban/Timeline view modes"
      used_in: [Project pages]

    - name: useConfirmDialog
      path: src/hooks/use-confirm-dialog.tsx
      purpose: "Reusable confirm/cancel modal hook"
      used_in: [DeleteWorkspace, DeleteProject, DeleteTask]

    - name: useCreateProjectDialog
      path: src/hooks/use-create-project-dialog.tsx
      purpose: "Controls create-project modal visibility"
      used_in: [NavProjects, CreateOptions]

    - name: useCreateWorkspaceDialog
      path: src/hooks/use-create-workspace-dialog.tsx
      purpose: "Controls create-workspace modal visibility"
      used_in: [WorkspaceSwitcher, MyWorkspaces]

    - name: useAnalyticsWorker
      path: src/hooks/use-analytics-worker.ts
      purpose: "Offloads analytics computation to Web Worker"
      used_in: [AnalyticsStats]

    - name: usePerformanceOptimization
      path: src/hooks/use-performance-optimization.ts
      purpose: "Debounce + virtualization helpers"
      used_in: [TaskTable]

    - name: useProfilePictures
      path: src/hooks/use-profile-pictures.ts
      purpose: "Batch-fetches profile picture URLs for member list"
      used_in: [MemberTable, TaskCard]

    - name: useOnlineNotifications
      path: src/hooks/use-online-notifications.ts
      purpose: "Triggers toast when member comes online/offline"
      used_in: [WorkspaceProviders]

    - name: useMediaQuery
      path: src/hooks/use-media-query.ts
      purpose: "CSS media query reactive hook"
      used_in: [MobileNav, various]

    - name: useMobile
      path: src/hooks/use-mobile.tsx
      purpose: "Returns boolean isMobile (breakpoint check)"
      used_in: [Navbar, WorkspaceLayoutContent]

    - name: useToast
      path: src/hooks/use-toast.ts
      purpose: "Shadcn/ui toast trigger"
      used_in: [useMutation onError/onSuccess callbacks]

  auth_hooks:
    - name: useAuthHook
      path: src/hooks/auth/use-auth.ts
      purpose: "Lower-level auth hook (wraps token verification)"

stores:
  - name: useKanbanStore
    path: src/stores/useKanbanStore.ts
    library: Zustand
    state:
      - "customColumns: Column[] — extra kanban columns beyond defaults"
      - "showAddSection: boolean"
      - "selectedTask: TaskType|null"
      - "showTaskModal: boolean"
      - "isDragging: boolean"
      - "dragOverColumn: string|null"
      - "showEditDialog: boolean"
      - "showDeleteDialog: boolean"
      - "taskToDelete: TaskType|null"
    actions:
      - setCustomColumns, addCustomColumn, removeCustomColumn
      - toggleAddSection, selectTask, toggleTaskModal
      - setDragging, setDragOverColumn
      - toggleEditDialog, toggleDeleteDialog, setTaskToDelete
      - getAvailableStatusSections, resetUIState
    used_in: [KanbanBoard, KanbanColumn, TaskCard, EditTaskDialog]

  - name: useTaskSyncStore
    path: src/stores/useTaskSyncStore.ts
    library: Zustand
    purpose: "Tracks optimistic task mutations for sync status"
    used_in: [TaskTable, KanbanBoard]

  - name: useUIStore
    path: src/stores/useUIStore.ts
    library: Zustand
    purpose: "Global UI flags (sidebar collapsed, modals)"
    used_in: [WorkspaceLayoutContent, Asidebar]

  - name: notificationHistoryStore
    path: src/stores/notification-history-store.ts
    library: Zustand
    purpose: "Stores online/offline notification history list"
    used_in: [notification-history component, useOnlineNotifications]

context_providers:
  - name: AuthProvider
    path: src/context/auth-provider.tsx
    provides: "user, workspace, hasPermission(), isLoading, isSignedIn, refetchAuth, refetchWorkspace"
    consumes: [useAuth, useGetWorkspace, useWorkspaceId, usePermissions]
    side_effects:
      - "Redirects to / on ACCESS_UNAUTHORIZED workspace error"
      - "Redirects to /workspace on WORKSPACE_NOT_FOUND"
      - "Auto-refetches auth if cookie present but no user"
    used_in: [workspace layout, all workspace pages via useAuthContext()]

  - name: ThemeProvider
    path: src/context/theme-context.tsx
    provides: "theme, setTheme"
    used_in: [root layout, ThemeSwitch]

  - name: ReactQueryProvider
    path: src/context/query/ReactQueryProvider.tsx
    provides: "QueryClient with default staleTime + retry config"
    used_in: [root layout]

  - name: WorkspaceProviders
    path: src/app/workspace/WorkspaceProviders.tsx
    wraps: [AuthProvider, online status hooks, SSE hooks]
    used_in: [workspace layout]

  - name: BiometricContext
    path: src/context/useBiometricContext.tsx
    provides: "biometric register/login state and handlers"
    used_in: [BiometricLoginButton, BiometricLoginDemo]

lib:
  - name: api.ts
    path: src/lib/api.ts
    exports:
      - "getCurrentUserQueryFn(): GET /api/auth/me"
      - "loginMutationFn(data): POST /api/auth/login"
      - "registerMutationFn(data): POST /api/auth/register"
      - "logoutMutationFn(): POST /api/auth/logout"
      - "getWorkspaceQueryFn(id): GET /api/workspace/:id"
      - "getProjectsQueryFn(wsId): GET /api/workspace/:id/projects"
      - "createProjectMutationFn(data): POST /api/workspace/:id/projects"
      - "getTasksQueryFn(wsId, pid, filters): GET .../tasks"
      - "createTaskMutationFn(data): POST .../tasks"
      - "updateTaskMutationFn(data): PUT .../tasks/:id"
      - "deleteTaskMutationFn(data): DELETE .../tasks/:id"
      - "getWorkspaceMembersQueryFn(wsId): GET /api/workspace/:id/members"

  - name: logger.ts
    path: src/lib/logger.ts
    exports: [logInfo, logError, logWarn, logDebug]
    used_in: [use-timeline, api hooks, debug components]

state_management:
  server_state:
    library: "@tanstack/react-query"
    query_keys:
      - "[authUser]: current logged-in user"
      - "[workspace, id]: workspace data + members"
      - "[projects, wsId]: project list"
      - "[tasks, wsId, pid, filters]: paginated task list"
      - "[members, wsId]: workspace member list"
      - "[timeline]: timeline entries"
    invalidation:
      - "On task create/update/delete → invalidate [tasks, ...]"
      - "On project create/delete → invalidate [projects, ...]"
      - "On workspace create/delete → invalidate [workspace, ...]"

  client_state:
    library: Zustand
    stores: [useKanbanStore, useTaskSyncStore, useUIStore, notificationHistoryStore]

  url_state:
    - "workspaceId: from URL path via useWorkspaceId()"
    - "projectId: from URL path"
    - "filters: query params for task table"

middleware:
  file: src/middleware.ts
  purpose: "Protects /workspace/* routes; redirects unauthenticated to /"
  logic:
    - "Checks auth_token or auth_active cookie"
    - "Redirects to / if not authenticated and on protected route"
    - "Redirects to /workspace if authenticated and on auth pages"

performance:
  optimizations:
    - "React Query staleTime: 5-10 min to reduce API calls"
    - "refetchOnWindowFocus: false on heavy queries"
    - "useAnalyticsWorker: offloads heavy computation to Web Worker"
    - "UltraLazyEmojiPicker: lazy-loaded only when needed"
    - "DM Sans font: display=swap, preload=true"
    - "Microsoft Clarity analytics: async, non-blocking"
    - "CentralLoader: prevents render until auth is resolved"
  bottlenecks:
    - "Task table with many tasks — use virtualization (usePerformanceOptimization)"
    - "Profile picture loading — batched via useProfilePictures"

developer_guide:
  how_to_add_a_page:
    - "1. Create file at src/app/<route>/page.tsx"
    - "2. Use useAuthContext() to get user/workspace/hasPermission"
    - "3. Use React Query hooks from src/hooks/api/ for data"
    - "4. Add route to Asidebar nav if workspace page"

  how_to_add_a_component:
    - "1. Create file at src/components/<feature>/<Name>.tsx"
    - "2. Use Tailwind + shadcn/ui primitives from components/ui/"
    - "3. Expose typed props interface"
    - "4. Import in parent component"

  how_to_add_an_api_call:
    - "1. Add fetcher/mutator function to src/lib/api.ts"
    - "2. Create hook in src/hooks/api/use-<name>.tsx using useQuery/useMutation"
    - "3. Use hook in component"

  how_to_add_global_state:
    - "1. Add slice to relevant Zustand store in src/stores/"
    - "2. Or add to React Context if tied to auth/workspace lifecycle"

  how_to_debug:
    - "Enable AdvancedLogViewer in layout.tsx (currently commented out)"
    - "Use debug/LogViewer + CacheDebugger components"
    - "React Query DevTools available in development"
    - "Check useWebSocketOnlineStatus for WS connection issues"
