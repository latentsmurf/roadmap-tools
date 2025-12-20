# Information Architecture

## 1. Hierarchy & Navigation

### Public Portal Structure
```
/r/[workspaceSlug]/[roadmapSlug]
├── Header (Logo, Search, View Switcher, Subscribe)
├── Main Content App (Zoom Level Controller)
│   ├── Snapshot View (Default for minimal embeds)
│   │   ├── Featured Row (Carousel or Grid)
│   │   └── Highlights List
│   ├── Standard View (Default for board embeds)
│   │   ├── Filter Bar (Collapsed by default)
│   │   └── Board / Timeline Canvas
│   └── Deep View (Full portal mode)
│       ├── Sidebar facets / Advanced Filters
│       └── Dense Data Grid / Detailed Board
├── Item Detail Drawer (Overlay)
│   ├── Title, Status, Confidence badge
│   ├── Succinct Description
│   ├── History / Activity Log
│   └── "Follow Updates" Call to Action
└── Footer (Powered by Roadmapper, Privacy, Terms)
```

## 2. The Zoom Level Pattern (Anti-Overwhelm)
This is the core distinguishing UX pattern. The application state is aware of the `ZoomLevel`.

### Level 1: Snapshot (Marketing/Public Page Embed)
*   **Goal**: Show momentum and top priorities without exposing the messy backlog.
*   **Visible Items**: Max 20 items.
*   **Columns**: Hidden or simplified (e.g., "Coming Soon").
*   **Interactions**: Read-only mainly, click to open drawer = encourages "Follow".
*   **Filters**: None visible.

### Level 2: Standard (Product Tab Embed)
*   **Goal**: Users looking for specific features or checking general status.
*   **Visible Items**: 50-100 items.
*   **Columns**: Standard Statuses (Now, Next, Later).
*   **Interactions**: Vote, Simple Filter (Domain/Tag).
*   **Layout**: Comfortable spacing.

### Level 3: Deep (Power User / Stakeholder)
*   **Goal**: Auditing, deep search, finding that one specific request.
*   **Visible Items**: All open items.
*   **Layout**: Density High key.
*   **Controls**: Full faceted search, sorting, archived items.

## 3. Interaction Models

### The "Drawer" vs "Page"
*   **Items always open in a Drawer (Slide-over) or Modal.**
*   **Why**: Maintains context of the board. Users don't navigate *away* to see an item.
*   **Permalink**: /r/.../items/[itemId] opens the board with the drawer active.

### Feedback Loop
1.  User sees item.
2.  User clicks "Follow" or "Upvote".
3.  **Authentication**:
    *   If anon: Prompt for Email (Magic Link or OTP).
    *   If auth'd: Toggle state immediately.
4.  User manages subscriptions in a centralized "My Updates" view (modal).

## 4. Admin Information Architecture
```
/admin
├── Dashboard (Overview of roadmaps, recent activity)
├── Roadmaps
│   ├── [Roadmap Editor]
│   │   ├── Items (Unassigned, Backlog, Board)
│   │   ├── Appearance (Theme Studio)
│   │   ├── Embed (Snippet Generator)
│   │   └── Settings (View Config, Domains)
├── Global Items Database (All items across roadmaps)
└── Audience / Subscribers (List of users who followed)
```
