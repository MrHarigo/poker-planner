// Generate a random passcode
export function generatePasscode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0, O, I, 1)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a game code like "POKER-X7K2"
export function generateGameCode(): string {
  const suffix = generatePasscode(4);
  return `POKER-${suffix}`;
}

// Day schedule type
export interface DaySchedule {
  date: string; // "2024-12-06" (the "night" this session belongs to)
  startHour: number; // 0-23, e.g., 18 for 6pm
  endHour: number; // 0-23, e.g., 5 for 5am (next day if < startHour)
}

// Helper to format date as local YYYY-MM-DD
function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to format slot as local datetime string (timezone-safe)
function toSlotKey(date: Date): string {
  const dateStr = toLocalDateStr(date);
  const hour = String(date.getHours()).padStart(2, "0");
  return `${dateStr}T${hour}:00`;
}

// Parse slot key back to Date (local time)
export function parseSlotKey(slot: string): Date {
  // slot is "YYYY-MM-DDTHH:00" in local time
  const [datePart, timePart] = slot.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const hour = parseInt(timePart.split(":")[0], 10);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

// Generate time slots from day schedules
export function generateTimeSlotsFromSchedules(daySchedules: DaySchedule[]): string[] {
  const slots: string[] = [];

  for (const schedule of daySchedules) {
    const [year, month, day] = schedule.date.split("-").map(Number);
    const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const isOvernight = schedule.endHour <= schedule.startHour;

    // Start from startHour on the base date
    let currentHour = schedule.startHour;
    let currentDay = 0; // 0 = base date, 1 = next day

    while (true) {
      const slotDate = new Date(baseDate);
      slotDate.setDate(slotDate.getDate() + currentDay);
      slotDate.setHours(currentHour, 0, 0, 0);

      slots.push(toSlotKey(slotDate));

      currentHour++;
      if (currentHour >= 24) {
        currentHour = 0;
        currentDay = 1;
      }

      // Check if we've reached the end
      if (isOvernight) {
        // For overnight: stop when we hit endHour on next day
        if (currentDay === 1 && currentHour >= schedule.endHour) break;
      } else {
        // For same-day: stop when we hit endHour
        if (currentHour >= schedule.endHour) break;
      }
    }
  }

  return slots;
}

// Group time slots by their "night" (session start date)
export function groupSlotsByNight(
  slots: string[],
  daySchedules: DaySchedule[]
): Record<string, { label: string; slots: string[] }> {
  const grouped: Record<string, { label: string; slots: string[] }> = {};

  // Create a map of schedule dates for quick lookup
  const scheduleMap = new Map<string, DaySchedule>();
  for (const schedule of daySchedules) {
    scheduleMap.set(schedule.date, schedule);
  }

  for (const slot of slots) {
    // slot is "YYYY-MM-DDTHH:00" format (local time)
    const slotDateStr = slot.split("T")[0];
    const slotHour = parseInt(slot.split("T")[1].split(":")[0], 10);

    // Find which schedule this slot belongs to
    let nightDate = slotDateStr;

    // If it's early morning (before noon), it might belong to previous night
    if (slotHour < 12) {
      const slotDate = parseSlotKey(slot);
      const prevDate = new Date(slotDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = toLocalDateStr(prevDate);

      if (scheduleMap.has(prevDateStr)) {
        const prevSchedule = scheduleMap.get(prevDateStr)!;
        // Check if this slot falls within the overnight portion
        if (prevSchedule.endHour <= prevSchedule.startHour && slotHour < prevSchedule.endHour) {
          nightDate = prevDateStr;
        }
      }
    }

    if (!grouped[nightDate]) {
      const [year, month, day] = nightDate.split("-").map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      grouped[nightDate] = {
        label: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        slots: [],
      };
    }
    grouped[nightDate].slots.push(slot);
  }

  // Sort slots within each group by hour
  for (const key of Object.keys(grouped)) {
    grouped[key].slots.sort((a, b) => {
      const dateA = parseSlotKey(a);
      const dateB = parseSlotKey(b);
      return dateA.getTime() - dateB.getTime();
    });
  }

  return grouped;
}

// Legacy: Generate time slots between start and end dates (kept for compatibility)
export function generateTimeSlots(
  startDateTime: Date,
  endDateTime: Date,
  slotDurationMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const current = new Date(startDateTime);

  while (current < endDateTime) {
    slots.push(current.toISOString());
    current.setMinutes(current.getMinutes() + slotDurationMinutes);
  }

  return slots;
}

// Format a date for display
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format just the time
export function formatTime(date: Date | string): string {
  // Handle our "YYYY-MM-DDTHH:00" format
  const d = typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:00$/)
    ? parseSlotKey(date)
    : new Date(date);
  return d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format just the date
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// Group time slots by date (legacy - use groupSlotsByNight for new games)
export function groupSlotsByDate(slots: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const slot of slots) {
    const date = new Date(slot);
    const dateKey = date.toISOString().split("T")[0];

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(slot);
  }

  return grouped;
}

// Get hour options for dropdowns (0-23)
export function getHourOptions(): { value: number; label: string }[] {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    options.push({ value: h, label: `${hour12} ${ampm}` });
  }
  return options;
}

// Format hour for display
export function formatHour(hour: number): string {
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${hour12} ${ampm}`;
}

// Parse JSON safely
export function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// Rate preference types
export type RatePreference = "preferred" | "playable" | "wont_play";

// Time slot availability types
export type TimeSlotAvailability = "can" | "maybe" | "unavailable";

