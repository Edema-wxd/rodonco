/**
 * Best-effort conversion of a stored phone number into a wa.me-compatible
 * international number (digits only, no leading "+" or "0"). Nigerian defaults.
 * Returns null if the input has no digits.
 */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Local format 0XXXXXXXXXX (11 digits) → 234XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith("0")) return "234" + digits.slice(1);
  // Already international with Nigeria country code
  if (digits.startsWith("234")) return digits;
  // 10 digits with no leading zero (e.g. 8012345678) → assume Nigeria
  if (digits.length === 10) return "234" + digits;
  // Otherwise assume it already carries a country code
  return digits;
}
