# API Specification

## Strategy
- **Framework**: Next.js App Router Route Handlers.
- **Protocol**: REST + JSON.
- **Caching**: Aggressive Edge Caching for `GET` requests on public roadmaps (revalidate on write).
- **Versioning**: URI Versioning (`/api/v1/...`).

## Public endpoints (Usage by Embeds & Viewers)

### 1. Get Roadmap Configuration
Returns the "shell" of the roadmap: theme, view config, and featured items (Snapshot).

**GET** `/api/v1/public/roadmaps/:workspaceSlug/:roadmapSlug`

**Response:**
```json
{
  "id": "rm_123",
  "title": "Core Product",
  "config": {
    "views": ["board", "timeline"],
    "defaults": { "view": "board", "zoom": "standard" }
  },
  "theme": {
    "primaryColor": "#ff00dd",
    "stylePack": "neon_night"
  },
  "featuredItems": [ ... ] 
}
```

### 2. Get Items (Search/Filter)
Used by "Standard" and "Deep" views to fetch data.

**GET** `/api/v1/public/roadmaps/:id/items`

**Query Params:**
- `zoom`: snapshot | standard | deep (Affects fields returned)
- `status`: exploring | building ...
- `group`: now | next ...
- `search`: "query string"

**Response:**
```json
{
  "data": [
    {
      "id": "item_abc",
      "title": "Dark Mode",
      "status": "BUILDING",
      "confidence": "LIKELY",
      "group": "Next",
      "stats": { "votes": 42 }
    }
  ],
  "meta": { "total": 150 }
}
```

### 3. Engagement (Vote/Follow)

**POST** `/api/v1/public/items/:id/vote`
**POST** `/api/v1/public/items/:id/follow`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
- `200 OK`: Success (or Magic Link sent).

## Private Endpoints (Admin)
Standard crud protected by Clerk Middleware.
- `POST /api/trpc/items.create`
- `POST /api/trpc/items.updateStatus`
- `POST /api/trpc/roadmaps.publish`
(Using tRPC or Server Actions for Admin implementation is recommended for type safety).

## Rate Limits
- Public GET: 100 req/min per IP (high because it's public).
- Engagement POST: 5 req/min per IP (spam protection).
