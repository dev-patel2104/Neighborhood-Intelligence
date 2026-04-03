/** Typed application errors thrown by services and caught by route handlers. */

export type AppErrorCode =
  | "INVALID_INPUT"   // malformed or too-short address
  | "NOT_FOUND"       // address not found in Nominatim
  | "OUTSIDE_REGION"  // address found but outside Atlantic Canada
  | "UNAVAILABLE";    // upstream service timeout / unexpected failure

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Maps an AppErrorCode to the appropriate HTTP status code. */
export function httpStatusForError(code: AppErrorCode): number {
  switch (code) {
    case "NOT_FOUND":    return 404;
    case "UNAVAILABLE":  return 503;
    default:             return 400;
  }
}
