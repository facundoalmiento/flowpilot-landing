const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function startOfToday(reference = new Date()) {
  const next = new Date(reference);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfMonth(dateStringOrDate: string | Date) {
  const date =
    typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : new Date(dateStringOrDate);
  return startOfToday(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function startOfWeek(reference = new Date()) {
  const next = startOfToday(reference);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function endOfWeek(reference = new Date()) {
  const next = startOfWeek(reference);
  next.setDate(next.getDate() + 6);
  return next;
}

export function endOfMonth(reference = new Date()) {
  return startOfToday(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
}

export function getMonthKey(dateString: string | null) {
  if (!dateString) return "";
  return dateString.slice(0, 7);
}

export function addMonths(dateString: string, months: number) {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return startOfToday(date).toISOString().slice(0, 10);
}

export function daysUntil(dateString: string, reference = new Date()) {
  const target = startOfToday(new Date(dateString));
  const current = startOfToday(reference);
  return Math.round((target.getTime() - current.getTime()) / DAY_IN_MS);
}

export function isToday(dateString: string | null, reference = new Date()) {
  if (!dateString) return false;
  return daysUntil(dateString, reference) === 0;
}

export function isPastDate(dateString: string | null, reference = new Date()) {
  if (!dateString) return false;
  return daysUntil(dateString, reference) < 0;
}

export function isWithinDays(
  dateString: string | null,
  maxDays: number,
  reference = new Date()
) {
  if (!dateString) return false;
  const remaining = daysUntil(dateString, reference);
  return remaining >= 0 && remaining <= maxDays;
}

export function isDateWithinCurrentWeek(dateString: string | null, reference = new Date()) {
  if (!dateString) return false;
  const target = startOfToday(new Date(dateString)).getTime();
  const from = startOfWeek(reference).getTime();
  const to = endOfWeek(reference).getTime();
  return target >= from && target <= to;
}

export function formatDate(dateString: string | null) {
  if (!dateString) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string | null) {
  if (!dateString) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export function formatRelativeDeadline(dateString: string | null) {
  if (!dateString) return "Sin fecha definida";
  const remaining = daysUntil(dateString);

  if (remaining < 0) return `Vencido hace ${Math.abs(remaining)} dia${Math.abs(remaining) === 1 ? "" : "s"}`;
  if (remaining === 0) return "Vence hoy";
  if (remaining === 1) return "Vence manana";
  return `Faltan ${remaining} dias`;
}
