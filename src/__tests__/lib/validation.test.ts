import { describe, it, expect } from "vitest"
import {
  SlugSchema,
  EmailSchema,
  TitleSchema,
  CreateRoadmapSchema,
  CreateItemSchema,
  FluxPosterPayloadSchema,
  ItemStatusSchema,
  validate,
  formatZodErrors,
} from "@/lib/validation"

describe("Validation Schemas", () => {
  describe("SlugSchema", () => {
    it("accepts valid slugs", () => {
      expect(SlugSchema.safeParse("my-roadmap").success).toBe(true)
      expect(SlugSchema.safeParse("roadmap-123").success).toBe(true)
      expect(SlugSchema.safeParse("abc").success).toBe(true)
    })

    it("rejects slugs that are too short", () => {
      const result = SlugSchema.safeParse("ab")
      expect(result.success).toBe(false)
    })

    it("rejects slugs with uppercase letters", () => {
      const result = SlugSchema.safeParse("My-Roadmap")
      expect(result.success).toBe(false)
    })

    it("rejects slugs with spaces", () => {
      const result = SlugSchema.safeParse("my roadmap")
      expect(result.success).toBe(false)
    })

    it("rejects slugs with special characters", () => {
      const result = SlugSchema.safeParse("my_roadmap!")
      expect(result.success).toBe(false)
    })

    it("rejects slugs that are too long", () => {
      const result = SlugSchema.safeParse("a".repeat(51))
      expect(result.success).toBe(false)
    })
  })

  describe("EmailSchema", () => {
    it("accepts valid emails", () => {
      expect(EmailSchema.safeParse("test@example.com").success).toBe(true)
      expect(EmailSchema.safeParse("user.name@domain.co.uk").success).toBe(true)
    })

    it("rejects invalid emails", () => {
      expect(EmailSchema.safeParse("not-an-email").success).toBe(false)
      expect(EmailSchema.safeParse("@example.com").success).toBe(false)
      expect(EmailSchema.safeParse("test@").success).toBe(false)
    })

    it("rejects emails that are too long", () => {
      const longEmail = "a".repeat(250) + "@example.com"
      expect(EmailSchema.safeParse(longEmail).success).toBe(false)
    })
  })

  describe("TitleSchema", () => {
    it("accepts valid titles", () => {
      expect(TitleSchema.safeParse("My Feature").success).toBe(true)
      expect(TitleSchema.safeParse("A").success).toBe(true)
    })

    it("rejects empty titles", () => {
      expect(TitleSchema.safeParse("").success).toBe(false)
    })

    it("rejects titles that are too long", () => {
      expect(TitleSchema.safeParse("a".repeat(201)).success).toBe(false)
    })
  })

  describe("ItemStatusSchema", () => {
    it("accepts valid statuses", () => {
      expect(ItemStatusSchema.safeParse("EXPLORING").success).toBe(true)
      expect(ItemStatusSchema.safeParse("BUILDING").success).toBe(true)
      expect(ItemStatusSchema.safeParse("TESTING").success).toBe(true)
      expect(ItemStatusSchema.safeParse("SHIPPED").success).toBe(true)
      expect(ItemStatusSchema.safeParse("CANCELLED").success).toBe(true)
    })

    it("rejects invalid statuses", () => {
      expect(ItemStatusSchema.safeParse("INVALID").success).toBe(false)
      expect(ItemStatusSchema.safeParse("shipped").success).toBe(false)
    })
  })

  describe("CreateRoadmapSchema", () => {
    it("accepts valid roadmap input", () => {
      const result = CreateRoadmapSchema.safeParse({
        title: "My Roadmap",
        slug: "my-roadmap",
      })
      expect(result.success).toBe(true)
    })

    it("accepts roadmap with optional fields", () => {
      const result = CreateRoadmapSchema.safeParse({
        title: "My Roadmap",
        slug: "my-roadmap",
        description: "A description",
        publicTitle: "Public Title",
      })
      expect(result.success).toBe(true)
    })

    it("rejects missing required fields", () => {
      expect(CreateRoadmapSchema.safeParse({ title: "Test" }).success).toBe(false)
      expect(CreateRoadmapSchema.safeParse({ slug: "test" }).success).toBe(false)
    })
  })

  describe("CreateItemSchema", () => {
    it("accepts valid item input", () => {
      const result = CreateItemSchema.safeParse({
        title: "My Feature",
        roadmapId: "roadmap-123",
        status: "EXPLORING",
      })
      expect(result.success).toBe(true)
    })

    it("uses default status when not provided", () => {
      const result = CreateItemSchema.safeParse({
        title: "My Feature",
        roadmapId: "roadmap-123",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe("EXPLORING")
      }
    })

    it("rejects missing roadmapId", () => {
      const result = CreateItemSchema.safeParse({
        title: "My Feature",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("FluxPosterPayloadSchema", () => {
    it("accepts valid FluxPoster payload", () => {
      const result = FluxPosterPayloadSchema.safeParse({
        id: "external-123",
        title: "New Feature",
        bodyHtml: "<p>Feature description</p>",
      })
      expect(result.success).toBe(true)
    })

    it("accepts payload with all optional fields", () => {
      const result = FluxPosterPayloadSchema.safeParse({
        id: "external-123",
        title: "New Feature",
        bodyHtml: "<p>Feature description</p>",
        summary: "Short summary",
        tags: ["feature", "new"],
        categories: ["Product"],
        images: [{ url: "https://example.com/image.png", role: "featured" }],
      })
      expect(result.success).toBe(true)
    })

    it("rejects missing required fields", () => {
      expect(
        FluxPosterPayloadSchema.safeParse({
          title: "Test",
          bodyHtml: "<p>Test</p>",
        }).success
      ).toBe(false)

      expect(
        FluxPosterPayloadSchema.safeParse({
          id: "123",
          bodyHtml: "<p>Test</p>",
        }).success
      ).toBe(false)
    })

    it("rejects invalid image URLs", () => {
      const result = FluxPosterPayloadSchema.safeParse({
        id: "123",
        title: "Test",
        bodyHtml: "<p>Test</p>",
        images: [{ url: "not-a-url" }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe("validate helper", () => {
    it("returns success with data for valid input", () => {
      const result = validate(TitleSchema, "Valid Title")
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("Valid Title")
      }
    })

    it("returns error for invalid input", () => {
      const result = validate(TitleSchema, "")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe("formatZodErrors", () => {
    it("formats Zod errors correctly", () => {
      const result = CreateRoadmapSchema.safeParse({ title: "" })
      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        expect(formatted).toBeInstanceOf(Array)
        expect(formatted.length).toBeGreaterThan(0)
        expect(formatted[0]).toHaveProperty("field")
        expect(formatted[0]).toHaveProperty("message")
      }
    })
  })
})
