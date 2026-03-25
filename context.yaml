app:
  name: Timeline
  description: >
    Production-grade SaaS project management platform. Kanban boards,
    timeline tracking, team collaboration, workspace management, AI task
    queries, real-time online status (WebSocket), OAuth + biometric auth,
    analytics dashboards. Two Next.js apps (frontend + backend) talking
    over HTTP; a Go binary handles WebSocket connections.

architecture:
  layers:
    - frontend: "Next.js 14 App Router (TypeScript, Tailwind, shadcn/ui) at /frontend"
    - backend: "Next.js 14 App Router (TypeScript, Mongoose) at /backend"
    - websocket_server: "Go binary (/backend/websocket-server) on port 8001"
    - database: "MongoDB via Mongoose ODM"
    - cache: "In-process LRU cache (src/utils/lru-cache.ts)"
    - storage: "Cloudinary (profile pictures)"
    - email: "SMTP via src/services/email.service.ts"
  data_flow:
    - "Browser → Frontend Next.js → Backend API Routes → Service → Mongoose → MongoDB"
    - "WS: Browser /ws → backend server.ts http-proxy → Go :8001"
  request_lifecycle:
    - "1. Request hits Next.js middleware (middleware.ts) – JWT cookie check"
    - "2. Route handler calls ensureDb() – connects MongoDB if not connected"
    - "3. getDbUserFromRequest() verifies JWT from cookie or Bearer header"
    - "4. Handler calls service function"
    - "5. Service runs Mongoose query, returns plain object"
    - "6. Handler returns JSON Response"

devops:
  ci_cd_pipeline:
    - "Google Cloud Build: /backend/cloudbuild.yaml"
    - "Heroku Docker: deploy-heroku-docker.sh + heroku.yml"
    - "Vercel: /frontend/vercel.json (rewrites /api/* to backend)"
  environments:
    development: "npm run dev — Next.js dev server + Go binary"
    production: "Docker (Dockerfile.optimized) PORT=8000, WS_PORT=8001"
  infra:
    - "MongoDB Atlas"
    - "Cloudinary CDN"
    - "Go compiled binary: /backend/websocket-server"

security:
  auth_flow:
    - "Email/password: POST /api/auth/register, POST /api/auth/login"
    - "JWT HS256 signed, stored as HttpOnly cookie (auth_token) + JS cookie (auth_active)"
    - "OAuth Google: /api/auth/oauth/google/init → callback → loginOrCreateAccountService"
    - "OAuth GitHub: /api/auth/oauth/github/init → callback"
    - "Biometric: credential per device in user.biometricSessions[]"
    - "Remember Me: long-lived token in user.rememberMeSessions[]"
    - "All protected routes: getDbUserFromRequest() verifies JWT"
  permissions:
    roles: [OWNER, ADMIN, MEMBER]
    checked_by: "getMemberRoleInWorkspace() in src/services/member.service.ts"
    frontend: "usePermissions() hook + hasPermission() from AuthContext"
  vulnerabilities_prevented:
    - "bcrypt password hashing (pre-save hook in user.model.ts)"
    - "CORS via withCORS() wrapper on every route"
    - "Rate limiting: api-lib/rate-limit.ts, api-lib/ai-rate-limit.ts"
    - "Email verification gate before first login"
    - "Expired unverified accounts auto-deleted on login"

database:
  engine: MongoDB
  odm: Mongoose
  collections:
    - name: users
      file: backend/src/models/user.model.ts
      collection: users
      fields:
        name: String
        email: "String (unique, lowercase)"
        password: "String (bcrypt, select:true)"
        profilePicture: "String|null"
        currentWorkspace: "ObjectId → Workspace"
        isAdmin: "Boolean (default false)"
        superAdmin: "Boolean (default false)"
        emailVerified: "Date|null"
        emailVerificationToken: "String|null"
        emailVerificationTokenExpires: "Date|null"
        isActive: "Boolean (default true)"
        lastLogin: "Date|null"
        lastSeen: "Date|null"
        biometricSessions: "BiometricSession[] embedded"
        rememberMeSessions: "RememberMeSession[] embedded"
      indexes:
        - "email (unique)"
        - "currentWorkspace"
        - "isActive, isAdmin"
        - "emailVerificationToken (sparse)"
        - "biometricSessions.deviceId"
        - "rememberMeSessions.tokenId (unique sparse)"
      methods:
        omitPassword: "strips password field from returned object"
        comparePassword: "bcrypt.compare(value, this.password)"
      hooks:
        pre_save: "hashes password if modified via hashValue()"

    - name: workspaces
      file: backend/src/models/workspace.model.ts
      collection: workspaces
      fields:
        name: "String (required)"
        description: String
        owner: "ObjectId → User"
        inviteCode: "String (unique, auto via generateInviteCode())"
        dismissedUsers: "DismissedUser[] embedded"
      indexes:
        - "owner"
        - "createdAt desc"
        - "dismissedUsers.userId"
      methods:
        resetInviteCode: "generates new UUID invite code"

    - name: projects
      file: backend/src/models/project.model.ts
      collection: projects
      fields:
        name: "String (required)"
        emoji: "String (default: 📊)"
        description: "String|null"
        workspace: "ObjectId → Workspace"
        createdBy: "ObjectId → User"
      indexes:
        - "workspace"
        - "createdBy"
        - "workspace+createdAt desc"
        - "workspace+name"
        - "name+description (text)"

    - name: tasks
      file: backend/src/models/task.model.ts
      collection: tasks
      fields:
        taskCode: "String (unique, auto via generateTaskCode())"
        title: "String (required)"
        description: "String|null"
        project: "ObjectId → Project"
        workspace: "ObjectId → Workspace"
        status: "BACKLOG|TODO|IN_PROGRESS|IN_REVIEW|DONE"
        priority: "LOW|MEDIUM|HIGH"
        assignedTo: "ObjectId → User|null"
        createdBy: "ObjectId → User"
        dueDate: "Date|null"
      indexes:
        - "workspace+project+createdAt desc"
        - "workspace+status+createdAt desc"
        - "workspace+assignedTo+status"
        - "workspace+dueDate+status"
        - "project+status+createdAt desc"
        - "title+description (text)"

    - name: members
      file: backend/src/models/member.model.ts
      collection: members
      fields:
        userId: "ObjectId → User"
        workspaceId: "ObjectId → Workspace"
        role: "ObjectId → Role"
        joinedAt: "Date (default now)"
      indexes:
        - "userId"
        - "workspaceId"
        - "userId+workspaceId (unique composite)"
        - "workspaceId+joinedAt desc"

    - name: roles
      file: backend/src/models/roles-permission.model.ts
      collection: roles
      fields:
        name: "OWNER|ADMIN|MEMBER"
        permissions: "String[]"

    - name: accounts
      file: backend/src/models/account.model.ts
      collection: accounts
      fields:
        userId: "ObjectId → User"
        provider: "EMAIL|GOOGLE|GITHUB"
        providerId: "String (email address for EMAIL, OAuth ID for others)"

    - name: insights_notes
      file: backend/src/models/insights-note.model.ts
      collection: insightsnotes
      fields:
        workspace: "ObjectId → Workspace"
        content: String
        createdBy: "ObjectId → User"
        createdAt: Date
        updatedAt: Date
