# Product Requirements Document (PRD): Embed-first Public Roadmap Platform

## 1. Problem Statement
SaaS, devtools, game studios, and marketplace platforms need a way to share their product direction with users to build trust and gather feedback. Existing solutions are often:
- **Overwhelming**: They dump hundreds of features on a board, confusing users.
- **Disconnected**: They look like a separate 3rd-party tool (e.g., Canny, Trello) rather than a native part of the product.
- **Stale**: They are hard to keep updated and lack "trust signals" that manage user expectations about certainty and timing.

## 2. Target Audience
- **Primary**: Early-stage SaaS, DevTools, Game Studios, and Marketplaces.
- **Users**:
    - **Publishers**: Product Managers, Founders who curate the roadmap.
    - **Viewers**: End-users, customers, community members who browse and vote.

## 3. Goals
- **Embed-First**: The hero experience is the embedded component, not the destination portal. It must look brand-native.
- **Anti-Overwhelm**: Use "Progressive Disclosure" (Snapshot -> Standard -> Deep views) to show only what's necessary.
- **High Trust**: Explicitly communicate confidence levels (Tentative vs. Likely vs. Confident) and stage of development.
- **Feedback Loop**: Allow users to follow notification changes without forcing them to create heavy accounts (email-first or lightweight auth).

## 4. Non-Goals
- **Project Management**: This is NOT a Jira/Linear replacement. It is a communication layer *on top* of those tools.
- **Complex Weighted Scoring**: We are not building RICE scoring or complex prioritization frameworks for internal use in the MVP.
- **Rich Text Editor**: For MVP, item descriptions are succinct. No Notion-like doc editing.

## 5. MVP Feature Set

### Core UX: Zoom Levels
| Level | Description | Key Features |
| :--- | :--- | :--- |
| **Snapshot** | High-level marketing view | 10-20 curated items, minimal UI, "Featured" row. |
| **Standard** | Balanced view | Column/Kanban board, basic search, up to 3 primary filters. |
| **Deep** | Power user view | Full taxonomy, advanced filtering, archive access, export. |

### Views
1.  **Board View**: Columns (Now/Next/Later or By Domain).
2.  **Timeline View**: Quarter-based or Version-based high-level timeline.
3.  **Changelog View**: Reverse chronological list of shipped items.

### Trust & Metadata
-   **Confidence**: Tentative (Low), Likely (Medium), Confident (High).
-   **Stage**: Exploring, Building, Testing, Shipping.
-   **Disclaimer**: "Subject to change" built-in component.
-   **Last Updated**: Visible timestamps on items.

### Feedback Loop
-   **Vote/Like**: Simple upvote signal.
-   **Follow**: "Notify me when this changes" (Critical feature).
-   **Notifications**: Email alerts for Status Change, Shipped, Comment (optional).

### Embed System
-   **Web Component**: `<roadmap-portal>` that works in React, Vue, Svelte, plain HTML.
-   **Theming**: CSS Variables for colors, fonts, radii, spacing.
-   **Style Packs**: Pre-configured themes (Minimal SaaS, Neon Night, Glass, etc.).

## 6. V2 Concepts (Future)
-   **Audience Segmentation**: Buyer vs. Seller views, Enterprise vs. SMB.
-   **Single-Sign On (SSO)**: Enterprise auth integration.
-   **Bi-directional Sync**: Sync status back to Linear/Jira.

## 7. Assumptions
-   Publishers are comfortable using a minimal Admin UI to manage items.
-   Viewers are willing to provide an email address to "Follow" an item.
-   The "Snapshot" view will be the most used embed type for marketing pages.
