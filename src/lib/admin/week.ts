export function currentWeekOf(reference: Date = new Date()): string {
  // Define "week of" as the Sunday (UTC) that starts the current week.
  const day = reference.getUTCDay(); // 0 = Sunday
  const sunday = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - day),
  );
  return sunday.toISOString().slice(0, 10);
}

