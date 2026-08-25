export interface NathContact {
  instagram: string;
  name: string;
}

function cleanInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/\/$/, "");
}

export function cleanNathContact(value: unknown): NathContact | null {
  if (!value || typeof value !== "object") return null;
  const contact = value as Record<string, unknown>;
  if (typeof contact.name !== "string" || typeof contact.instagram !== "string") return null;
  const name = contact.name.trim();
  const instagram = cleanInstagram(contact.instagram);
  if (!name || name.length > 120 || !instagram || instagram.length > 100) return null;
  return { instagram, name };
}

export function cleanNathAnswers(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const answers = value.map((answer) => (typeof answer === "string" ? answer.trim() : ""));
  if (answers.some((answer) => answer.length === 0 || answer.length > 12_000)) return null;
  return answers;
}
