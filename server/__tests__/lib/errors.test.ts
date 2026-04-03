import { describe, it, expect } from "vitest";
import { AppError, httpStatusForError } from "@server/lib/errors";

describe("AppError", () => {
  it("stores the error code", () => {
    const err = new AppError("INVALID_INPUT", "bad input");
    expect(err.code).toBe("INVALID_INPUT");
  });

  it("stores the message", () => {
    const err = new AppError("NOT_FOUND", "not found");
    expect(err.message).toBe("not found");
  });

  it("sets name to AppError", () => {
    const err = new AppError("UNAVAILABLE", "down");
    expect(err.name).toBe("AppError");
  });

  it("is an instance of Error", () => {
    const err = new AppError("OUTSIDE_REGION", "out of region");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("httpStatusForError", () => {
  it("maps NOT_FOUND to 404", () => {
    expect(httpStatusForError("NOT_FOUND")).toBe(404);
  });

  it("maps UNAVAILABLE to 503", () => {
    expect(httpStatusForError("UNAVAILABLE")).toBe(503);
  });

  it("maps INVALID_INPUT to 400", () => {
    expect(httpStatusForError("INVALID_INPUT")).toBe(400);
  });

  it("maps OUTSIDE_REGION to 400", () => {
    expect(httpStatusForError("OUTSIDE_REGION")).toBe(400);
  });
});
