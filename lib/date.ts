/** Local timezone YYYY-MM-DD string for consistent date comparisons */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The viewer's IANA timezone (e.g. "America/Los_Angeles", "Asia/Ho_Chi_Minh") */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get midnight (start of day) for an ISO date string in a specific timezone.
 * Returns epoch ms in UTC.
 *
 * Example: midnightInTz("2026-05-24", "America/Los_Angeles")
 *   → epoch ms for May 24 00:00:00 PDT (which is May 24 07:00:00 UTC)
 */
function midnightInTz(isoDate: string, tz: string): number {
  // Build a "wall clock" string for midnight of that date
  const midnightStr = `${isoDate}T00:00:00`;
  // Parse as if it were UTC
  const utcGuess = new Date(midnightStr + "Z").getTime();
  // Find the UTC offset at that moment in the target tz
  const asUtc = new Date(utcGuess);
  const inTz = new Date(asUtc.toLocaleString("en-US", { timeZone: tz }));
  const offsetMs = inTz.getTime() - asUtc.getTime();
  // Actual UTC moment = wall-clock time minus offset
  return utcGuess - offsetMs;
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
  return midnightInTz(ndStr, creatorTz);
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

  const deadline = deadlineMoment(dueDate, creatorTz); // end of due date in creator tz
  const activeStart = midnightInTz(dueDate, creatorTz); // start of due date in creator tz

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
  return deadlineMoment(dueDate, creatorTz) <= Date.now();
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
  if (viewerTz === creatorTz) return null;

  const deadline = new Date(deadlineMoment(dueDate, creatorTz));
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
