import { z } from "zod"

// === ENUMS ===

export const ItemStatusSchema = z.enum(["EXPLORING", "BUILDING", "TESTING", "SHIPPED", "CANCELLED"])

export const ItemConfidenceSchema = z.enum([
  "TENTATIVE",
  "LIKELY",
  "CONFIDENT",
  "H", // Legacy shorthand
  "M",
  "L",
])

export const ZoomLevelSchema = z.enum(["snapshot", "standard", "deep"])

// === PRIMITIVES ===

export const SlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")

export const EmailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters")

export const TitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters")

export const DescriptionSchema = z
  .string()
  .max(5000, "Description must be at most 5000 characters")
  .optional()

export const HtmlContentSchema = z.string().max(100000, "Content must be at most 100000 characters")

export const UrlSchema = z
  .string()
  .url("Invalid URL")
  .max(2000, "URL must be at most 2000 characters")
  .optional()
  .nullable()

// === ENTITY SCHEMAS ===

export const CreateRoadmapSchema = z.object({
  title: TitleSchema,
  slug: SlugSchema,
  publicTitle: TitleSchema.optional(),
  description: DescriptionSchema,
})

export const CreateItemSchema = z.object({
  title: TitleSchema,
  description: DescriptionSchema,
  status: ItemStatusSchema.default("EXPLORING"),
  confidence: ItemConfidenceSchema.optional(),
  roadmapId: z.string().min(1, "Roadmap ID is required"),
  groupId: z.string().optional().nullable(),
})

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  id: z.string().min(1, "Item ID is required"),
})

export const SubscribeSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  email: EmailSchema,
})

export const VoteSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
})

// === FLUXPOSTER SCHEMAS ===

export const FluxPosterImageSchema = z.object({
  role: z.string().optional(),
  url: z.string().url("Invalid image URL"),
})

export const FluxPosterPayloadSchema = z.object({
  id: z.string().min(1, "External ID is required"),
  title: TitleSchema,
  bodyHtml: HtmlContentSchema,
  summary: z.string().max(500).optional(),
  status: z.string().optional(),
  publishedAt: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  categories: z.array(z.string().max(50)).max(10).optional(),
  images: z.array(FluxPosterImageSchema).max(20).optional(),
})

// === API RESPONSE TYPES ===

export type ValidationError = {
  field: string
  message: string
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; errors?: ValidationError[] }

// === HELPER FUNCTIONS ===

/**
 * Formats Zod errors into a user-friendly array
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }))
}

/**
 * Validates data against a schema and returns formatted result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ActionResult<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = formatZodErrors(result.error)
    return {
      success: false,
      error: errors[0]?.message || "Validation failed",
      errors,
    }
  }

  return { success: true, data: result.data }
}

// === TYPE EXPORTS ===

export type ItemStatus = z.infer<typeof ItemStatusSchema>
export type ItemConfidence = z.infer<typeof ItemConfidenceSchema>
export type ZoomLevel = z.infer<typeof ZoomLevelSchema>
export type CreateRoadmapInput = z.infer<typeof CreateRoadmapSchema>
export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type FluxPosterPayload = z.infer<typeof FluxPosterPayloadSchema>
