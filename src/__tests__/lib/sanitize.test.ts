import { describe, it, expect } from "vitest"
import { sanitizeHtml, stripHtml, createSafeDescription, sanitizeUrl } from "@/lib/sanitize"

describe("Sanitization Utilities", () => {
  describe("sanitizeHtml", () => {
    it("allows safe HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>"
      const result = sanitizeHtml(input)
      expect(result).toContain("<p>")
      expect(result).toContain("<strong>")
      expect(result).toContain("Hello")
      expect(result).toContain("World")
    })

    it("removes script tags", () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain("<script>")
      expect(result).not.toContain("alert")
      expect(result).toContain("Hello")
    })

    it("removes onclick handlers", () => {
      const input = "<p onclick=\"alert('xss')\">Click me</p>"
      const result = sanitizeHtml(input)
      expect(result).not.toContain("onclick")
      expect(result).toContain("Click me")
    })

    it("removes onerror handlers on images", () => {
      const input = '<img src="x" onerror="alert(\'xss\')">'
      const result = sanitizeHtml(input)
      expect(result).not.toContain("onerror")
    })

    it("removes iframe tags", () => {
      const input = '<iframe src="https://evil.com"></iframe>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain("<iframe")
    })

    it("removes style tags", () => {
      const input = "<style>body { display: none; }</style><p>Content</p>"
      const result = sanitizeHtml(input)
      expect(result).not.toContain("<style>")
      expect(result).toContain("Content")
    })

    it("allows links with href", () => {
      const input = '<a href="https://example.com">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain("Link")
    })

    it("removes javascript: URLs", () => {
      const input = "<a href=\"javascript:alert('xss')\">Link</a>"
      const result = sanitizeHtml(input)
      expect(result).not.toContain("javascript:")
    })

    it("handles empty string", () => {
      expect(sanitizeHtml("")).toBe("")
    })

    it("handles null/undefined gracefully", () => {
      expect(sanitizeHtml(null as unknown as string)).toBe("")
      expect(sanitizeHtml(undefined as unknown as string)).toBe("")
    })

    it("allows headings", () => {
      const input = "<h1>Title</h1><h2>Subtitle</h2>"
      const result = sanitizeHtml(input)
      expect(result).toContain("<h1>")
      expect(result).toContain("<h2>")
    })

    it("allows lists", () => {
      const input = "<ul><li>Item 1</li><li>Item 2</li></ul>"
      const result = sanitizeHtml(input)
      expect(result).toContain("<ul>")
      expect(result).toContain("<li>")
    })

    it("allows code blocks", () => {
      const input = "<pre><code>const x = 1;</code></pre>"
      const result = sanitizeHtml(input)
      expect(result).toContain("<pre>")
      expect(result).toContain("<code>")
    })
  })

  describe("stripHtml", () => {
    it("removes all HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>"
      const result = stripHtml(input)
      expect(result).toBe("Hello World")
    })

    it("handles complex HTML", () => {
      const input = "<div><h1>Title</h1><p>Paragraph with <a href='#'>link</a></p></div>"
      const result = stripHtml(input)
      expect(result).not.toContain("<")
      expect(result).not.toContain(">")
      expect(result).toContain("Title")
      expect(result).toContain("Paragraph")
      expect(result).toContain("link")
    })

    it("decodes HTML entities", () => {
      const input = "<p>Hello &amp; World</p>"
      const result = stripHtml(input)
      expect(result).toContain("&")
    })

    it("handles empty string", () => {
      expect(stripHtml("")).toBe("")
    })

    it("handles null/undefined gracefully", () => {
      expect(stripHtml(null as unknown as string)).toBe("")
      expect(stripHtml(undefined as unknown as string)).toBe("")
    })
  })

  describe("createSafeDescription", () => {
    it("strips HTML and returns plain text", () => {
      const input = "<p>Hello <strong>World</strong></p>"
      const result = createSafeDescription(input)
      expect(result).not.toContain("<")
    })

    it("truncates to specified length", () => {
      const input = "<p>This is a very long description that should be truncated</p>"
      const result = createSafeDescription(input, 20)
      expect(result.length).toBeLessThanOrEqual(23) // 20 + "..."
    })

    it("adds ellipsis when truncated", () => {
      const input = "<p>This is a very long description that should be truncated</p>"
      const result = createSafeDescription(input, 20)
      expect(result).toContain("...")
    })

    it("does not add ellipsis for short content", () => {
      const input = "<p>Short</p>"
      const result = createSafeDescription(input, 200)
      expect(result).toBe("Short")
    })

    it("truncates at word boundary when possible", () => {
      const input = "<p>This is a test description that is quite long</p>"
      const result = createSafeDescription(input, 20)
      // Should end with ellipsis
      expect(result).toContain("...")
      // Should be within expected length
      expect(result.length).toBeLessThanOrEqual(23)
    })
  })

  describe("sanitizeUrl", () => {
    it("accepts valid https URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/")
      expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path")
    })

    it("accepts valid http URLs", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/")
    })

    it("rejects javascript: URLs", () => {
      expect(sanitizeUrl("javascript:alert('xss')")).toBe(null)
    })

    it("rejects data: URLs", () => {
      expect(sanitizeUrl("data:text/html,<script>alert('xss')</script>")).toBe(null)
    })

    it("rejects file: URLs", () => {
      expect(sanitizeUrl("file:///etc/passwd")).toBe(null)
    })

    it("returns null for invalid URLs", () => {
      expect(sanitizeUrl("not-a-url")).toBe(null)
      expect(sanitizeUrl("://example.com")).toBe(null)
    })

    it("returns null for null/undefined", () => {
      expect(sanitizeUrl(null)).toBe(null)
      expect(sanitizeUrl(undefined)).toBe(null)
    })

    it("returns null for empty string", () => {
      expect(sanitizeUrl("")).toBe(null)
    })
  })
})
