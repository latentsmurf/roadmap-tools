import DOMPurify from "isomorphic-dompurify"

/**
 * Allowed HTML tags for sanitized content
 */
const ALLOWED_TAGS = [
  // Text formatting
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  // Headings
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // Lists
  "ul",
  "ol",
  "li",
  // Links
  "a",
  // Code
  "code",
  "pre",
  // Quotes
  "blockquote",
  // Dividers
  "hr",
  // Spans for styling
  "span",
  "div",
  // Images (validated URLs only)
  "img",
]

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  "href",
  "title",
  "class",
  "id",
  "target",
  "rel",
  "src",
  "alt",
  "width",
  "height",
]

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Removes all potentially dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Ensure links open in new tab safely
    ADD_ATTR: ["target", "rel"],
    // Transform hooks for additional security
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  })
}

/**
 * Strips all HTML tags and returns plain text
 * Useful for generating descriptions/summaries
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  // First sanitize to remove dangerous content
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })

  // Decode HTML entities
  return sanitized
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * Creates a safe description from HTML content
 * Strips HTML and truncates to specified length
 */
export function createSafeDescription(html: string, maxLength: number = 200): string {
  const plainText = stripHtml(html)

  if (plainText.length <= maxLength) {
    return plainText
  }

  // Truncate at word boundary
  const truncated = plainText.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "..."
  }

  return truncated + "..."
}

/**
 * Validates and sanitizes a URL
 * Returns null if URL is invalid or potentially dangerous
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null
  }

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null
    }

    return parsed.href
  } catch {
    return null
  }
}
