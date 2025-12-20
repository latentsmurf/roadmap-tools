# Data Model & Schema

## Overview
The data model uses **Postgres** with **Prisma ORM**.
It is designed to support multi-tenant workspaces (SaaS style).

## Core Entities

### Workspace
Top-level container.
- `id` (cuid)
- `name`
- `slug` (unique)
- `stripeCustomerId` (for billing)

### Roadmap
A specific board/portal within a workspace.
- `id`
- `workspaceId`
- `title`
- `publicTitle`
- `slug`
- `viewConfig` (JSON: zoom levels, default view)
- `themeConfig` (JSON: styles, colors)

### Item (Feature/Idea)
The atom of the roadmap.
- `id`
- `roadmapId`
- `title`
- `description` (Markdown, succinct)
- `status` (Enum: EXPLORING, BUILDING, TESTING, SHIPPING, SHIPPED)
- `confidence` (Enum: TENTATIVE, LIKELY, CONFIDENT)
- `visibility` (Enum: PUBLIC, PRIVATE, INTERNAL)
- `featured` (Boolean)
- `lastStatusChangeAt` (DateTime)

### Engagement
- `Vote`: User <-> Item (Upvote)
- `Follow`: User <-> Item (Subscription for updates)
- `Subscriber`: A viewer profile (Email + ClerkID optional)

### Activity/History
- `ItemActivity`: Log of changes (Status changed, merged, etc.)
- `ChangelogEntry`: Generated when items are "Shipped".

## Prisma Schema Draft

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Workspace {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  createdAt DateTime @default(now())
  
  roadmaps  Roadmap[]
  members   WorkspaceMember[] // Admin users
}

model Roadmap {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  
  slug          String 
  title         String
  description   String?
  
  // Public facing strings
  publicTitle   String?
  
  // Config
  viewConfig    Json?     // Stores defaults for zoom, sort
  themeConfig   Json?     // Stores color tokens, style pack
  
  items         Item[]
  groups        Group[]   // Kanban columns setup
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([workspaceId, slug])
}

model Group {
  id        String @id @default(cuid())
  roadmapId String
  roadmap   Roadmap @relation(fields: [roadmapId], references: [id])
  name      String  // e.g. "Now", "Next", "Later"
  order     Int     @default(0)
  items     Item[]
}

model Item {
  id          String   @id @default(cuid())
  roadmapId   String
  roadmap     Roadmap  @relation(fields: [roadmapId], references: [id])
  groupId     String?
  group       Group?   @relation(fields: [groupId], references: [id])
  
  title       String
  description String?  @db.Text
  
  // Trust Signals
  status      ItemStatus @default(EXPLORING)
  confidence  ConfidenceLevel @default(TENTATIVE)
  
  // Workflow
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastStatusChangeAt DateTime @default(now())
  
  // Engagement
  votes     Vote[]
  follows   Follow[]
  
  // History
  history   ItemHistory[]
}

enum ItemStatus {
  EXPLORING
  BUILDING
  TESTING
  SHIPPED
  CANCELLED
}

enum ConfidenceLevel {
  TENTATIVE // Low
  LIKELY    // Medium
  CONFIDENT // High
}

model Subscriber {
  id        String   @id @default(cuid())
  email     String   // Viewers engage via email
  clerkId   String?  // Optional if we force login
  
  votes     Vote[]
  follows   Follow[]
  
  @@unique([email])
}

model Vote {
  id           String     @id @default(cuid())
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id])
  subscriberId String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  
  createdAt    DateTime   @default(now())
  
  @@unique([itemId, subscriberId])
}

model Follow {
  id           String     @id @default(cuid())
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id])
  subscriberId String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  
  createdAt    DateTime   @default(now())
  
  @@unique([itemId, subscriberId])
}

model ItemHistory {
  id        String   @id @default(cuid())
  itemId    String
  item      Item     @relation(fields: [itemId], references: [id])
  
  type      String   // "STATUS_CHANGE", "EDIT", "MERGE"
  fromVal   String?
  toVal     String?
  actorId   String?  // Admin who made changes
  
  createdAt DateTime @default(now())
}

// Admin Users (Using Clerk, so this might just be mapping roles)
model WorkspaceMember {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String    // Clerk User ID or Auth.js ID
  role        String    // "ADMIN", "EDITOR"
}
```
