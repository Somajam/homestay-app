/**
 * Sanitizes phone input in real-time by stripping all alphabetic and invalid characters.
 * Allows digits, '+', spaces, hyphens, and parentheses.
 */
export const sanitizePhoneNumber = (input) => {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[a-zA-Z]/g, '')
    .replace(/[^0-9+\s\-()]/g, '');
};

/**
 * Validates that the phone number contains at least 10 digits and no alphabetic characters.
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  // Strictly reject if any letters exist
  if (/[a-zA-Z]/.test(phone)) return false;
  // Count digits only (stripping +, spaces, hyphens, parentheses)
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10;
};

