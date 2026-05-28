/** Local timezone YYYY-MM-DD string for consistent date comparisons */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The viewer's IANA timezone (e.g. "America/Los_Angeles", "Asia/Ho_Chi_Minh") */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Normalize deprecated IANA aliases to canonical names */
export function normalizeTimezone(tz: string): string {
  if (tz === "Asia/Saigon") return "Asia/Ho_Chi_Minh";
  return tz;
}

type TzDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function datePartsInTz(epochMs: number, tz: string): TzDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(epochMs));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function compareLocalTimeToMidnight(
  parts: TzDateParts,
  y: number,
  m: number,
  d: number,
): number {
  if (parts.year !== y) return parts.year - y;
  if (parts.month !== m) return parts.month - m;
  if (parts.day !== d) return parts.day - d;
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

/**
 * Get midnight (start of day) for an ISO date string in a specific timezone.
 * Returns epoch ms in UTC.
 *
 * Uses Intl.formatToParts only — safe on Hermes/iOS where parsing
 * toLocaleString output via `new Date()` is unreliable.
 */
function midnightInTz(isoDate: string, tz: string): number {
  const normalizedTz = normalizeTimezone(tz);
  const [y, m, d] = isoDate.split("-").map(Number);

  let lo = Date.UTC(y, m - 1, d - 2);
  let hi = Date.UTC(y, m - 1, d + 2);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cmp = compareLocalTimeToMidnight(
      datePartsInTz(mid, normalizedTz),
      y,
      m,
      d,
    );
    if (cmp < 0) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}

/**
 * Compute the deadline moment for a due date in the creator's timezone.
 * "Due May 24 in America/Los_Angeles" = midnight end-of-day = May 25 00:00:00 PDT.
 * Returns epoch ms (UTC).
 */
export function deadlineMoment(dueDate: string, creatorTz: string): number {
  const [y, m, d] = dueDate.split("-").map(Number) as [number, number, number];
  // Next day's date string
  const nextDay = new Date(y, m - 1, d + 1);
  const ndStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;
  return midnightInTz(ndStr, normalizeTimezone(creatorTz));
}

/**
 * Check if a task is "due today" for the viewer.
 *
 * A task is due today if:
 * - It has a due date, AND
 * - The deadline (end of due_date in creator's tz) has NOT passed, AND
 * - The due date's "active period" overlaps with the viewer's current day.
 *
 * The "active period" is [start of due_date in creator tz, end of due_date in creator tz).
 * It overlaps the viewer's today if: activeStart < viewerTomorrowStart AND activeEnd > viewerTodayStart.
 */
export function isDueToday(
  dueDate: string | null,
  creatorTz: string,
): boolean {
  if (!dueDate) return false;

  const tz = normalizeTimezone(creatorTz);
  const deadline = deadlineMoment(dueDate, tz); // end of due date in creator tz
  const activeStart = midnightInTz(dueDate, tz); // start of due date in creator tz

  const now = new Date();
  const viewerTodayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const viewerTomorrowStart = viewerTodayStart + 86_400_000;

  // Two intervals overlap if each starts before the other ends
  return activeStart < viewerTomorrowStart && deadline > viewerTodayStart;
}

/**
 * Check if a task is overdue from the viewer's perspective.
 * Overdue = the deadline moment (end of due_date in creator's tz) has passed.
 */
export function isOverdue(
  dueDate: string | null,
  creatorTz: string,
): boolean {
  if (!dueDate) return false;
  return deadlineMoment(dueDate, normalizeTimezone(creatorTz)) <= Date.now();
}

/**
 * Format the deadline in the viewer's local timezone for display.
 * Returns null if creator and viewer are in the same timezone.
 * e.g. "May 25, 2:00 PM PDT"
 */
export function formatDeadlineLocal(
  dueDate: string,
  creatorTz: string,
): string | null {
  const viewerTz = localTimezone();
  const normalizedCreatorTz = normalizeTimezone(creatorTz);
  if (viewerTz === normalizedCreatorTz) return null;

  const deadline = new Date(deadlineMoment(dueDate, normalizedCreatorTz));
  return deadline.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Start of current week (Monday) as ISO string in local timezone */
export function localWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
