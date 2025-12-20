# MVP Build Plan

## Phase 1: Scaffold & Infrastructure
1.  **Init Next.js**: `npx create-next-app@latest roadmapper --typescript --tailwind --eslint`.
2.  **Database**: Spin up Postgres (Supabase/Neon/Local), init Prisma.
3.  **Auth**: Configure Clerk.com (simplest for MVP).
4.  **UI Lib**: Install shadcn/ui and basic components (Button, Input, Sheet, Dialog).

## Phase 2: Core Data & Admin
1.  **Schema**: Apply Prisma schema (`Workspaces`, `Roadmaps`, `Items`).
2.  **Admin UI**: Build simple CRUD pages at `/admin`.
    -   Create Roadmap.
    -   Create/Edit Items.
    -   Kanban board for internal management.

## Phase 3: The Embed Engine (Public)
1.  **Public API**: Create `/api/v1/roadmaps/[slug]` endpoint.
2.  **Frontend Views**:
    -   Implement `ZoomToggle` logic.
    -   Build `SnapshotView` (Grid).
    -   Build `StandardView` (Kanban).
3.  **Theming**: Connect CSS Variables to the rendered output.

## Phase 4: Engagement
1.  **Vote/Follow**: API endpoints.
2.  **Email**: Connect Resend.com SDK. Send "Verify Email" on first follow.

## Phase 5: Embed Artifacts
1.  **Web Component**: Build the wrapper using `lit` or vanilla JS.
2.  **Demo Page**: `/embed-demo` to test the component in isolation.
