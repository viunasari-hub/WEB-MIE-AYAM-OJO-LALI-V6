import { prisma } from "@/lib/prisma";

/**
 * Utility functions for Indonesian phone number normalization & queries
 */

// Returns only the digits from a string, e.g. "0812-3456-7890" -> "081234567890"
export function cleanPhoneDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

/**
 * Returns an array of common Indonesian phone format variants for database lookup:
 * e.g. for "081234567890", generates:
 * - "081234567890" (local 08)
 * - "6281234567890" (international without +)
 * - "+6281234567890" (international with +)
 * - "81234567890" (pure subscriber number)
 * - raw trimmed input
 */
export function getPhoneVariants(input: string): string[] {
  const trimmed = (input || "").trim();
  const digits = cleanPhoneDigits(trimmed);

  if (!digits) {
    return trimmed ? [trimmed] : [];
  }

  let base8 = "";
  if (digits.startsWith("62")) {
    base8 = digits.slice(2);
  } else if (digits.startsWith("0")) {
    base8 = digits.slice(1);
  } else {
    base8 = digits;
  }

  const v0 = "0" + base8;
  const v62 = "62" + base8;
  const vPlus = "+62" + base8;
  const vRaw = base8;

  const set = new Set([
    v0,
    v62,
    vPlus,
    vRaw,
    trimmed,
    digits,
  ]);

  return Array.from(set).filter(Boolean);
}

/**
 * Standardizes phone number to standard Indonesian format "08xxxxxxxxxx"
 */
export function normalizePhoneLocal(input: string | null | undefined): string {
  if (!input) return "";
  const digits = cleanPhoneDigits(input);
  if (digits.startsWith("62")) {
    return "0" + digits.slice(2);
  }
  if (digits.startsWith("8")) {
    return "0" + digits;
  }
  return digits;
}

/**
 * Standardizes phone number to WhatsApp format "628xxxxxxxxxx"
 */
export function normalizePhoneWA(input: string | null | undefined): string {
  if (!input) return "";
  const digits = cleanPhoneDigits(input);
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

/**
 * Find user by email OR phone number (supports all variations of phone formatting)
 */
export async function findUserByIdentifier(identifier: string) {
  const trimmed = (identifier || "").trim();
  if (!trimmed) return null;

  // 1. If it contains '@', prioritize email query
  if (trimmed.includes("@")) {
    return await prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
    });
  }

  // 2. Otherwise generate phone variations and query
  const variants = getPhoneVariants(trimmed);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...variants.map((v) => ({ phone: v })),
        { email: trimmed.toLowerCase() },
      ],
    },
  });

  return user;
}
