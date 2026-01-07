import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger, createRequestLogger, generateRequestId } from "@/lib/logger"

describe("Logger", () => {
  beforeEach(() => {
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("logger instance", () => {
    it("should be defined", () => {
      expect(logger).toBeDefined()
    })

    it("should have logging methods", () => {
      expect(typeof logger.trace).toBe("function")
      expect(typeof logger.debug).toBe("function")
      expect(typeof logger.info).toBe("function")
      expect(typeof logger.warn).toBe("function")
      expect(typeof logger.error).toBe("function")
      expect(typeof logger.fatal).toBe("function")
    })

    it("should have audit method", () => {
      expect(typeof logger.audit).toBe("function")
    })

    it("should have request method", () => {
      expect(typeof logger.request).toBe("function")
    })

    it("should have child method", () => {
      expect(typeof logger.child).toBe("function")
    })
  })

  describe("createRequestLogger", () => {
    it("creates a logger with request context", () => {
      const requestLogger = createRequestLogger("test-request-id")
      expect(requestLogger).toBeDefined()
      expect(typeof requestLogger.info).toBe("function")
    })

    it("generates request ID if not provided", () => {
      const requestLogger = createRequestLogger()
      expect(requestLogger).toBeDefined()
    })
  })

  describe("generateRequestId", () => {
    it("generates a valid UUID", () => {
      const id = generateRequestId()
      expect(id).toBeDefined()
      expect(typeof id).toBe("string")
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it("generates unique IDs", () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      expect(id1).not.toBe(id2)
    })
  })

  describe("child logger", () => {
    it("creates a child logger with context", () => {
      const childLogger = logger.child({ userId: "user-123" })
      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe("function")
    })
  })

  describe("logging methods", () => {
    it("logs info messages without error", () => {
      expect(() => logger.info("Test message")).not.toThrow()
    })

    it("logs with context", () => {
      expect(() => logger.info("Test message", { action: "test", resource: "unit" })).not.toThrow()
    })

    it("logs errors with Error object", () => {
      expect(() => logger.error("Error occurred", new Error("Test error"))).not.toThrow()
    })

    it("logs errors with plain object", () => {
      expect(() => logger.error("Error occurred", { code: "TEST_ERROR" })).not.toThrow()
    })
  })

  describe("audit logging", () => {
    it("logs audit entries", () => {
      expect(() =>
        logger.audit({
          action: "login",
          userId: "user-123",
          resource: "auth",
          result: "success",
        })
      ).not.toThrow()
    })

    it("logs failed audit entries", () => {
      expect(() =>
        logger.audit({
          action: "login",
          userId: "user-123",
          resource: "auth",
          result: "failure",
          reason: "Invalid password",
        })
      ).not.toThrow()
    })
  })

  describe("request logging", () => {
    it("logs successful requests", () => {
      expect(() => logger.request("GET", "/api/roadmaps", 200, 150)).not.toThrow()
    })

    it("logs client error requests", () => {
      expect(() => logger.request("POST", "/api/items", 400, 50)).not.toThrow()
    })

    it("logs server error requests", () => {
      expect(() => logger.request("GET", "/api/error", 500, 200)).not.toThrow()
    })
  })
})
