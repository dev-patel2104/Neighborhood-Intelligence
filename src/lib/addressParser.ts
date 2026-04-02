/**
 * Client-side address validation and normalisation for HRM (Halifax Regional Municipality).
 * Accepts standard Canadian civic address format:
 *   [street number] [street name], [community], NS [postal code]
 * Nova Scotia postal codes start with the letter B (e.g. B3H 1Y9).
 */

export interface ParsedAddress {
  raw: string;
  normalised: string;
  error: string | null;
}

// Canadian postal code pattern: letter-digit-letter space digit-letter-digit
// Nova Scotia codes always start with B
const CA_POSTAL_CODE = /\b[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d\b/;
const NS_POSTAL_CODE  = /\bB\d[A-Za-z]\s?\d[A-Za-z]\d\b/i;

/**
 * Title-case a string while preserving:
 * - Province abbreviation "NS" (always uppercase)
 * - Canadian postal codes (always uppercase, e.g. B3H 1Y9)
 */
function normaliseHrmAddress(str: string): string {
  return str
    .trim()
    .replace(/\s{2,}/g, " ") // collapse multiple spaces
    .split(/\b/)
    .map((token) => {
      // Keep NS uppercase
      if (/^ns$/i.test(token)) return "NS";
      // Keep postal code tokens uppercase (single letter or letter+digit patterns)
      if (/^[A-Za-z]\d[A-Za-z]$/.test(token) || /^\d[A-Za-z]\d$/.test(token)) return token.toUpperCase();
      // Title-case everything else
      if (/^[a-z]/.test(token)) return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      return token;
    })
    .join("");
}

/**
 * Validates and normalises an HRM civic address typed by the user.
 * Returns the cleaned address or a descriptive error message.
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
      error: "Address is too short — please include a street number and name (e.g. 2595 Agricola St, Halifax).",
    };
  }

  if (trimmed.length > 200) {
    return {
      raw,
      normalised: trimmed,
      error: "Address is too long. Please enter a valid HRM civic address.",
    };
  }

  // Must start with or contain a street number
  if (!/\d/.test(trimmed)) {
    return {
      raw,
      normalised: trimmed,
      error: "Please include a street number (e.g. 150 Wyse Rd, Dartmouth, NS).",
    };
  }

  // If a Canadian postal code is present, it must be a Nova Scotia code (starts with B)
  if (CA_POSTAL_CODE.test(trimmed) && !NS_POSTAL_CODE.test(trimmed)) {
    return {
      raw,
      normalised: trimmed,
      error: "That postal code doesn't appear to be in Nova Scotia. This tool covers HRM addresses only (NS postal codes begin with B).",
    };
  }

  return {
    raw,
    normalised: normaliseHrmAddress(trimmed),
    error: null,
  };
}
