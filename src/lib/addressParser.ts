/**
 * Client-side address validation and normalisation.
 * Keeps validation logic out of components.
 */

export interface ParsedAddress {
  raw: string;
  normalised: string;
  error: string | null;
}

/** Title-case each word in a string */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Validates and normalises a raw address string typed by the user.
 * Returns the cleaned address or an error message.
 */
export function parseAddress(raw: string): ParsedAddress {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { raw, normalised: "", error: "Please enter an address." };
  }

  if (trimmed.length < 5) {
    return {
      raw,
      normalised: trimmed,
      error: "Address is too short — please include a street number and name.",
    };
  }

  if (trimmed.length > 200) {
    return {
      raw,
      normalised: trimmed,
      error: "Address is too long. Please enter a valid street address.",
    };
  }

  // Must contain at least one digit (street number)
  if (!/\d/.test(trimmed)) {
    return {
      raw,
      normalised: trimmed,
      error: "Please include a street number (e.g. 123 Main St).",
    };
  }

  return {
    raw,
    normalised: titleCase(trimmed),
    error: null,
  };
}
