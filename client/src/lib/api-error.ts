/**
 * Custom error class for API errors with structured data
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string
  ) {
    super(message || `API request failed with status ${status}`);
    this.name = "ApiError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get user-friendly error message from error data
   */
  getMessage(): string {
    if (typeof this.data === "string") {
      return this.data;
    }

    if (this.data && typeof this.data === "object") {
      const data = this.data as Record<string, unknown>;

      // Handle { error: "message" } format
      if (typeof data.error === "string") {
        return data.error;
      }

      // Handle ZodError format: { error: [{ message: "...", path: [...] }] }
      if (Array.isArray(data.error)) {
        const firstError = data.error[0];
        if (firstError && typeof firstError === "object" && "message" in firstError) {
          return String(firstError.message);
        }
      }

      // Handle { message: "..." } format
      if (typeof data.message === "string") {
        return data.message;
      }
    }

    return this.message;
  }

  /**
   * Check if error is a validation error (4xx)
   */
  isValidationError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}
