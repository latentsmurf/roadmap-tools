import pino from "pino"

/**
 * Log levels available
 */
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

/**
 * Context to include with log entries
 */
export interface LogContext {
  requestId?: string
  userId?: string
  action?: string
  resource?: string
  resourceId?: string
  duration?: number
  [key: string]: unknown
}

/**
 * Audit log entry for security-sensitive actions
 */
export interface AuditEntry {
  action: string
  userId: string
  resource: string
  resourceId?: string
  result: "success" | "failure"
  reason?: string
  ip?: string
  userAgent?: string
  details?: Record<string, unknown>
}

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL as LogLevel
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

// Create base Pino logger
const baseLogger = pino({
  level: getLogLevel(),
  // Use pino-pretty in development for readable output
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: "roadmap-tools",
  },
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "apiKey",
      "authorization",
      "cookie",
      "email",
      "*.password",
      "*.token",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
})

/**
 * Logger class with structured logging methods
 */
class Logger {
  private logger: pino.Logger

  constructor(context?: LogContext) {
    this.logger = context ? baseLogger.child(context) : baseLogger
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.logger = this.logger.child(context)
    return childLogger
  }

  /**
   * Trace level logging (most verbose)
   */
  trace(message: string, context?: LogContext): void {
    this.logger.trace(context || {}, message)
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(context || {}, message)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          ...context,
          err: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        },
        message
      )
    } else if (error) {
      this.logger.error({ ...context, err: error }, message)
    } else {
      this.logger.error(context || {}, message)
    }
  }

  /**
   * Fatal level logging (application cannot continue)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (error instanceof Error) {
      this.logger.fatal(
        {
          ...context,
          err: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        },
        message
      )
    } else if (error) {
      this.logger.fatal({ ...context, err: error }, message)
    } else {
      this.logger.fatal(context || {}, message)
    }
  }

  /**
   * Audit logging for security-sensitive actions
   * Always logs at INFO level regardless of log level setting
   */
  audit(entry: AuditEntry): void {
    this.logger.info(
      {
        type: "AUDIT",
        ...entry,
        timestamp: new Date().toISOString(),
      },
      `AUDIT: ${entry.action} on ${entry.resource} by ${entry.userId} - ${entry.result}`
    )
  }

  /**
   * Request logging helper
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info"

    this.logger[level](
      {
        type: "REQUEST",
        method,
        path,
        statusCode,
        duration,
        ...context,
      },
      `${method} ${path} ${statusCode} ${duration}ms`
    )
  }
}

// Default logger instance
export const logger = new Logger()

/**
 * Create a request-scoped logger with a unique request ID
 */
export function createRequestLogger(requestId?: string): Logger {
  return logger.child({
    requestId: requestId || crypto.randomUUID(),
  })
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID()
}

export default logger
