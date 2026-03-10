export const DEWEY_GROUPS = [
  { range: "000–099", label: "Computer Science, Information & General Works" },
  { range: "100–199", label: "Philosophy & Psychology" },
  { range: "200–299", label: "Religion" },
  { range: "300–399", label: "Social Sciences" },
  { range: "400–499", label: "Language" },
  { range: "500–599", label: "Science" },
  { range: "600–699", label: "Technology" },
  { range: "700–799", label: "Arts & Recreation" },
  { range: "800–899", label: "Literature" },
  { range: "900–999", label: "History & Geography" },
] as const;

export function getDeweyCategory(dewey: string): string {
  const num = parseInt(dewey, 10);
  if (isNaN(num)) return "Unknown";
  if (num < 100) return "Computer Science, Information & General Works";
  if (num < 200) return "Philosophy & Psychology";
  if (num < 300) return "Religion";
  if (num < 400) return "Social Sciences";
  if (num < 500) return "Language";
  if (num < 600) return "Science";
  if (num < 700) return "Technology";
  if (num < 800) return "Arts & Recreation";
  if (num < 900) return "Literature";
  return "History & Geography";
}

export const CATEGORIES = [
  "Computer Science, Information & General Works",
  "Philosophy & Psychology",
  "Religion",
  "Social Sciences",
  "Language",
  "Science",
  "Technology",
  "Arts & Recreation",
  "Literature",
  "History & Geography",
] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Russian",
  "Italian",
] as const;

export const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "checked-out", label: "Checked Out" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
