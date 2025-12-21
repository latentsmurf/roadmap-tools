# FluxPoster Receiver API v1

Specification for sites that want to accept blog posts created in FluxPoster.

---

## 1. Overview

FluxPoster Receiver v1 defines a simple HTTP interface that allows any website or CMS to accept blog posts created by FluxPoster.

A site is FluxPoster compatible if it:

- Exposes an HTTPS endpoint that accepts a predefined JSON blog payload.
- Authenticates requests using the FluxPoster API Key.
- Stores the post in its own database and returns a public URL.

The spec is intentionally minimal so it works with any backend stack.

---

## 2. Quick start checklist

A site is **FluxPoster Receiver v1 compatible** if it:

- [ ] Implements `POST /api/fluxposter/posts` over HTTPS  
- [ ] Validates the **FluxPoster API Key** sent as `Authorization: Bearer <FLUXPOSTER_API_KEY>`  
- [ ] Accepts the JSON payload defined in section 4  
- [ ] Stores the post in a local database or queue  
- [ ] Responds with `201 Created` and `{ "postId": "...", "url": "..." }` on success  

Optional but recommended:

- [ ] Implements update and delete endpoints (section 6)  
- [ ] Implements advanced image handling (section 9)  
- [ ] Logs errors with enough context for debugging  

---

## 3. Authentication

FluxPoster identifies itself using a shared secret called the **FluxPoster API Key**.

### 3.1 Request header

```http
Authorization: Bearer <FLUXPOSTER_API_KEY>
```

### 3.2 Server configuration

On the receiving site:

- Store the key in a secure server side environment variable:

```bash
FLUXPOSTER_API_KEY=super-secret-key-here
```

- Treat this value as the canonical secret for FluxPoster requests.

### 3.3 Validation rules

The receiver **must**:

1. Read the `Authorization` header.
2. Expect the form `Bearer <token>`.
3. Compare `<token>` to the configured `FLUXPOSTER_API_KEY`.

If the key is missing or does not match:

- Respond with `401 Unauthorized`.

All FluxPoster requests must use HTTPS.

---

## 4. Blog post payload

FluxPoster sends a canonical blog post representation as JSON.

### 4.1 Post schema

Top level JSON object:

| Field          | Type             | Required | Description |
| ------------- | ---------------- | -------- | ----------- |
| `id`          | string           | yes      | Unique FluxPoster post id. Use as `externalId` in your DB. |
| `title`       | string           | yes      | Post title. |
| `slug`        | string           | no       | Desired URL slug. Receiver may override or regenerate. |
| `status`      | string           | no       | `"draft"`, `"published"`, or `"scheduled"`. Default: `"draft"`. |
| `publishedAt` | string (ISO 8601)| no       | Desired publish datetime in UTC. If missing, receiver may use current time. |
| `bodyHtml`    | string (HTML)    | yes      | Main body content as HTML. Can contain `<img>` tags pointing to remote URLs. |
| `summary`     | string           | no       | Short summary or excerpt. |
| `tags`        | string[]         | no       | Tag labels. |
| `categories`  | string[]         | no       | Category labels. |
| `images`      | ImageAsset[]     | no       | Structured list of images (see 4.2). |
| `canonicalUrl`| string (URL)     | no       | Canonical source URL, if any. |
| `meta`        | object           | no       | Optional SEO or custom metadata. Free form key-value. |

### 4.2 ImageAsset schema

Each item in `images` has this shape:

```json
{
  "id": "img_1",
  "url": "https://cdn.fluxposter.com/posts/fp_123/header.jpg",
  "alt": "Hero image",
  "caption": "Optional caption",
  "role": "featured"
}
```

- `role` can be:
  - `"featured"` - hero or cover image.
  - `"inline"` - inline in the article body.
  - `"thumbnail"` - smaller listing preview.
- Receivers may use or ignore `caption` as needed.
- All `url` fields are valid image URLs hosted by FluxPoster (or a configured CDN).

### 4.3 Example payload

```json
{
  "id": "fp_12345",
  "title": "Introducing FluxPoster",
  "slug": "introducing-fluxposter",
  "status": "published",
  "publishedAt": "2025-11-30T12:00:00Z",
  "bodyHtml": "<p>Hello from FluxPoster.</p><p><img src="https://cdn.fluxposter.com/posts/fp_12345/header.jpg" alt="Header"></p>",
  "summary": "A short intro to FluxPoster.",
  "tags": ["product", "launch"],
  "categories": ["Announcements"],
  "images": [
    {
      "id": "img_1",
      "url": "https://cdn.fluxposter.com/posts/fp_12345/header.jpg",
      "alt": "Header image",
      "caption": "Our new product",
      "role": "featured"
    }
  ],
  "canonicalUrl": null,
  "meta": {
    "seoTitle": "Introducing FluxPoster - AI blog assistant",
    "seoDescription": "FluxPoster lets you write once and publish everywhere."
  }
}
```

---

## 5. Primary endpoint - create post

### 5.1 Endpoint definition

```http
POST /api/fluxposter/posts
Content-Type: application/json
Authorization: Bearer <FLUXPOSTER_API_KEY>
```

### 5.2 Receiver behavior

On a valid `POST /api/fluxposter/posts` the site should:

1. Validate authentication (section 3).
2. Parse JSON.
3. Validate required fields: `id`, `title`, `bodyHtml`.
4. Map payload to its internal model. For example:

   - `externalId` = `body.id`
   - `title` = `body.title`
   - `slug` = `body.slug` or `slugify(body.title)`
   - `html` = `body.bodyHtml`
   - `summary` = `body.summary` or `null`
   - `status` = `body.status` or `"draft"`
   - `publishedAt` = `body.publishedAt` or current server time
   - `tags` = `body.tags` or `[]`
   - `categories` = `body.categories` or `[]`
   - `featuredImageUrl` = URL from:
     - first `images[*]` where `role == "featured"`, or
     - `images[0].url` if available, or
     - `null`
   - `meta` = `body.meta` or `{}`

5. Save or upsert the post in the local database:
   - Create a new post if no record exists with `externalId == body.id`.
   - Optionally update an existing post if you want idempotent behavior.

6. Generate the public URL, for example:

   ```text
   https://example.com/blog/<slug>
   ```

### 5.3 Success response

On success, respond with `201 Created` and:

```json
{
  "postId": "local_987",
  "url": "https://example.com/blog/introducing-fluxposter"
}
```

Where:

- `postId` is the local database id in the receiver system.
- `url` is the canonical public URL for the post.

---

## 6. Optional endpoints - update and delete

These endpoints are optional but recommended if you want FluxPoster and the site to stay in sync.

### 6.1 Update post

```http
PUT /api/fluxposter/posts/{externalId}
Content-Type: application/json
Authorization: Bearer <FLUXPOSTER_API_KEY>
```

- `externalId` is the same as `payload.id` from the original create call.
- Request body uses the same schema as `POST /api/fluxposter/posts`.

**Behavior**

- Find a post with `externalId == {externalId}`.
- Update stored fields based on the new payload.
- Return `200 OK` with optionally the updated `postId` and `url`.

Example response:

```json
{
  "postId": "local_987",
  "url": "https://example.com/blog/introducing-fluxposter"
}
```

**Error codes**

- `404 Not Found` if no post is associated with that `externalId`.

### 6.2 Delete post

```http
DELETE /api/fluxposter/posts/{externalId}
Authorization: Bearer <FLUXPOSTER_API_KEY>
```

**Behavior**

- Find the post with `externalId == {externalId}`.
- Hard delete or mark as deleted/unpublished, depending on receiver policy.
- Respond with `204 No Content` on success.

**Error codes**

- `404 Not Found` if the post does not exist.

---

## 7. Error handling

Receivers should use standard HTTP status codes.

Recommended codes:

- `201 Created` - post successfully created.
- `200 OK` - update successful.
- `204 No Content` - delete successful.
- `400 Bad Request` - invalid JSON, missing required fields, or invalid data.
- `401 Unauthorized` - missing or incorrect FluxPoster API Key.
- `404 Not Found` - referenced resource does not exist.
- `409 Conflict` - conflicting state that prevents saving (for example slug collision if not auto resolved).
- `500 Internal Server Error` - unexpected server failure.

Recommended error body shape:

```json
{
  "error": "Bad Request",
  "message": "Missing id, title or bodyHtml"
}
```

Exact shape is implementation specific, but a clear `error` string and human readable `message` are encouraged.

---

## 8. Security recommendations

Receivers should:

- Require HTTPS for all FluxPoster endpoints.
- Keep `FLUXPOSTER_API_KEY` only on the server side (environment variable, secret manager).
- Never expose the FluxPoster API Key in client side code.
- Consider rate limiting requests to `/api/fluxposter/posts` (for example 60 requests per minute per key).
- Log failed authentication attempts and validation errors for debugging and abuse detection.

---

## 9. Advanced image handling (optional)

By default, FluxPoster sends:

- `bodyHtml` that already contains `<img>` tags pointing to FluxPoster hosted URLs.
- A structured list of `images` with roles and metadata.

A receiver remains fully compatible if it simply renders these external URLs.

For more control over performance, uptime, and SEO, receivers can implement advanced image handling.

### 9.1 Image handling modes

Receivers may choose one of these modes:

1. **External reference (default)**  
   - Use `images[*].url` and `<img src="...">` exactly as provided.
   - No additional work required.
   - Lowest complexity.

2. **Local mirror mode**  
   - On import, download images from FluxPoster URLs.
   - Store them in the site’s own storage or CDN.
   - Rewrite `bodyHtml` to point `<img src="...">` to local URLs.
   - Optionally track mapping between `images[*].id` and local URLs.

3. **Hybrid mode**  
   - Mirror only selected images, for example:
     - `role == "featured"`, or
     - First image in the article.
   - Keep inline images referencing FluxPoster hosted URLs.

Any of these strategies is allowed. The spec does not require a specific one.

### 9.2 Suggested configuration

Examples of internal configuration values:

```text
FLUXPOSTER_IMAGE_STRATEGY = external | mirror | hybrid
FLUXPOSTER_IMAGE_CACHE_DIR = /var/www/images/fluxposter
FLUXPOSTER_IMAGE_MAX_SIZE_BYTES = 5242880
FLUXPOSTER_IMAGE_ALLOWED_MIME = image/jpeg,image/png,image/webp
```

These are not part of the public contract, but recommended conventions for receivers.

### 9.3 Recommended local mirror algorithm

When using `mirror` or `hybrid`:

1. **Collect image URLs**  
   - Extract `<img src="...">` from `bodyHtml`.
   - Read `images[*].url` from the payload.

2. **Select images to mirror**  
   - In `mirror` strategy: mirror all images.
   - In `hybrid` strategy: mirror only featured or first image.

3. **Download images**  
   - HTTP GET each selected `url`.
   - Enforce:
     - Maximum size (from `FLUXPOSTER_IMAGE_MAX_SIZE_BYTES`).
     - MIME type in `FLUXPOSTER_IMAGE_ALLOWED_MIME`.
     - Reasonable timeout and retry policy.

4. **Store files**  
   - Save to local disk, object storage, or CDN.
   - Generate a public `localImageUrl`, for example:

     ```text
     https://example.com/media/fluxposter/<hash>.jpg
     ```

   - Store a mapping:

     ```text
     externalUrl -> localImageUrl
     imageId     -> localImageUrl (optional)
     ```

5. **Rewrite HTML**  
   - Replace every occurrence of `externalUrl` with `localImageUrl` in `bodyHtml`.

6. **Update featured image**  
   - If your CMS has a featured image field and:
     - The featured image was mirrored, set it to `localImageUrl`.
     - Otherwise, use `images[*].url` as a fallback.

7. **Save post and metadata**  
   - Store the final `bodyHtml` and image metadata in your database.

If image download fails for an asset, recommended approaches:

- Fallback to using the original FluxPoster URL, or
- Log the error and continue importing the rest of the content.

### 9.4 SEO and accessibility

Receivers should:

- Preserve and use `images[*].alt` as the `alt` attribute on `<img>` tags.
- Prefer lazy loading for non critical images:

  ```html
  <img src="..." alt="..." loading="lazy">
  ```

- Set image dimensions via attributes or CSS to avoid layout shifts.
- Use featured images (local or external) in meta tags for social previews, for example:

  ```html
  <meta property="og:image" content="https://example.com/media/fluxposter/header.jpg">
  <meta name="twitter:image" content="https://example.com/media/fluxposter/header.jpg">
  ```

### 9.5 Security considerations

When downloading and storing remote images:

- Only fetch over HTTPS.
- Enforce strict MIME type and size checks.
- Consider virus or malware scanning where appropriate.
- Handle network failures gracefully.
- Log source URLs and errors for operational visibility.

---

## 10. Minimal implementation example - Next.js App Router

This is a minimal TypeScript example for a Next.js project.

```ts
// app/api/fluxposter/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

const FLUXPOSTER_API_KEY = process.env.FLUXPOSTER_API_KEY!;
const SITE_URL = process.env.SITE_URL || "https://example.com";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!FLUXPOSTER_API_KEY || token !== FLUXPOSTER_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.title || !body.bodyHtml) {
    return NextResponse.json(
      { error: "Missing id, title or bodyHtml" },
      { status: 400 }
    );
  }

  const slug = body.slug || slugify(body.title);
  const featuredImageUrl =
    body.images?.find((img: any) => img.role === "featured")?.url ??
    body.images?.[0]?.url ??
    null;

  const postToSave = {
    externalId: body.id,
    title: body.title,
    slug,
    bodyHtml: body.bodyHtml,
    summary: body.summary ?? null,
    status: body.status ?? "draft",
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    tags: body.tags ?? [],
    categories: body.categories ?? [],
    featuredImageUrl,
    meta: body.meta ?? {}
  };

  const saved = await savePostToDatabase(postToSave);
  const url = `${SITE_URL}/blog/${saved.slug}`;

  return NextResponse.json({ postId: saved.id, url }, { status: 201 });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Replace with actual DB logic (Prisma, SQL, etc.)
async function savePostToDatabase(post: any) {
  return { ...post, id: "local_123" };
}
```

---

## 11. Summary

To integrate with FluxPoster:

1. Implement `POST /api/fluxposter/posts`.
2. Validate the FluxPoster API Key from `Authorization: Bearer <FLUXPOSTER_API_KEY>`.
3. Accept and store the canonical blog post JSON.
4. Return `201 Created` with `{ "postId", "url" }`.
5. Optionally implement:
   - Update and delete endpoints.
   - Advanced image handling.

Following this spec makes any site FluxPoster compatible and ready to receive AI generated blog content.
