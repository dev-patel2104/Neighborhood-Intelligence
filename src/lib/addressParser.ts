/**
 * Client-side address validation and normalisation for Atlantic Canada.
 * Accepts standard Canadian civic address format:
 *   [street number] [street name], [community], [PROV] [postal code]
 *
 * Atlantic province postal codes:
 *   NS → starts with B
 *   NB → starts with E
 *   PE → starts with C
 *   NL → starts with A
 */

export interface ParsedAddress {
  raw: string;
  normalised: string;
  error: string | null;
}

// Canadian postal code pattern: letter-digit-letter space digit-letter-digit
const CA_POSTAL_CODE = /\b[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d\b/;
// Atlantic provinces: A (NL), B (NS), C (PE), E (NB)
const ATLANTIC_POSTAL_CODE = /\b[ABCEabce]\d[A-Za-z]\s?\d[A-Za-z]\d\b/i;

// Province abbreviations used in Atlantic Canada
const ATLANTIC_ABBREVS = ["NS", "NB", "PE", "NL"];

/**
 * Title-case a string while preserving:
 * - Province abbreviations (always uppercase)
 * - Canadian postal codes (always uppercase)
 */
function normaliseAddress(str: string): string {
  return str
    .trim()
    .replace(/\s{2,}/g, " ")
    .split(/\b/)
    .map((token) => {
      // Keep province abbreviations uppercase
      if (ATLANTIC_ABBREVS.includes(token.toUpperCase())) return token.toUpperCase();
      // Keep postal code tokens uppercase
      if (/^[A-Za-z]\d[A-Za-z]$/.test(token) || /^\d[A-Za-z]\d$/.test(token)) return token.toUpperCase();
      // Title-case everything else
      if (/^[a-z]/.test(token)) return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      return token;
    })
    .join("");
}

/**
 * Validates and normalises an Atlantic Canada civic address typed by the user.
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
      error: "Address is too short — please include a street number and name (e.g. 2595 Agricola St, Halifax, NS).",
    };
  }

  if (trimmed.length > 200) {
    return {
      raw,
      normalised: trimmed,
      error: "Address is too long. Please enter a valid civic address.",
    };
  }

  // Must contain a street number
  if (!/\d/.test(trimmed)) {
    return {
      raw,
      normalised: trimmed,
      error: "Please include a street number (e.g. 150 Main St, Moncton, NB).",
    };
  }

  // If a Canadian postal code is present, it must be an Atlantic province code
  if (CA_POSTAL_CODE.test(trimmed) && !ATLANTIC_POSTAL_CODE.test(trimmed)) {
    return {
      raw,
      normalised: trimmed,
      error: "That postal code doesn't appear to be in Atlantic Canada. This tool covers NS, NB, PE, and NL (postal codes starting with A, B, C, or E).",
    };
  }

  return {
    raw,
    normalised: normaliseAddress(trimmed),
    error: null,
  };
}
