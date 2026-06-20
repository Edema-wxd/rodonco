export function currentWeekOf(reference: Date = new Date()): string {
  // Define "week of" as the Sunday (UTC) that starts the current week.
  const day = reference.getUTCDay(); // 0 = Sunday
  const sunday = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - day),
  );
  return sunday.toISOString().slice(0, 10);
}

/**
 * Given a week_of date string (YYYY-MM-DD, always a Sunday),
 * returns a human-readable range label: "Jun 14 – Jun 20, 2026".
 */
export function formatWeekRange(sundayIso: string): string {
  const [year, month, day] = sundayIso.split("-").map(Number);
  const sunday = new Date(Date.UTC(year, month - 1, day));
  const saturday = new Date(Date.UTC(year, month - 1, day + 6));

  const fmt = (d: Date, includeYear: boolean) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });

  // Only show the year once, on the Saturday side
  return `${fmt(sunday, false)} – ${fmt(saturday, true)}`;
}

