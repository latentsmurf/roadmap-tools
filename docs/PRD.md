# Product Requirements Document (PRD): Roadmap.tools

## 1. Vision
**Roadmap.tools** is an embed-first public roadmap platform designed for SaaS, DevTools, and Game Studios. It prioritizes "anti-overwhelm" UI and trust-building through explicit confidence signaling.

## 2. Target Audience
- **Product Managers**: Curating the public roadmap.
- **End Users**: Viewing direction and following specific features.

## 3. Core Features
### Embed-First Display
- A Web Component (`<roadmap-portal>`) that can be dropped into any site.
- Supports multiple zoom levels: Snapshot, Standard, Deep.

### Views
- **List View**: Standard grid of cards.
- **Board View**: Kanban-style grouping by status.
- **Timeline View**: "Now", "Next", "Later" time-based grouping.
- **Changelog**: Reverse chronological list of shipped items.

### Engagement Layer
- **Voting**: Simple upvote system.
- **Subscribing**: Email-based follows for item updates.

### Admin Tools
- Roadmap management at `/admin`.
- Secure authentication via Auth.js (Google Provider).
- Firestore-backed data storage.

## 4. Technical Stack
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS + shadcn/ui.
- **Database/Auth**: Firebase Firestore + Auth.js.
- **URL**: www.roadmap.tools

## 5. Success Metrics
- Integration ease (minutes to embed).
- User engagement (votes/follows).
- Reduced internal support burden (fewer "when is X shipping?" questions).
