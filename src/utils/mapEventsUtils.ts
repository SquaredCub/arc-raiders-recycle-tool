import type {
  MapEventCategory,
  MapEventType,
  MapEventsData,
} from "../generated/types";

export interface ActiveEvent {
  eventType: MapEventType;
  mapId: string;
  mapDisplayName: string;
  category: MapEventCategory;
  startHour: number;
  endsAtHour: number;
}

export interface ScheduledEvent {
  eventType: MapEventType;
  mapId: string;
  mapDisplayName: string;
  category: MapEventCategory;
  hour: number;
}

export interface EventOccurrence {
  mapId: string;
  mapDisplayName: string;
  category: MapEventCategory;
  hour: number;
  isActive: boolean;
}

export interface EventTypeSchedule {
  eventId: string;
  eventType: MapEventType;
  occurrences: EventOccurrence[];
}

const isDisabled = (data: MapEventsData, eventId: string): boolean =>
  data.eventTypes[eventId as keyof typeof data.eventTypes]?.disabled === true;

/**
 * Returns the UTC hour when an event ends. Events always last exactly 1 hour.
 */
export const getEndsAtHour = (startHour: number): number =>
  (startHour + 1) % 24;

/**
 * Returns events that started at the current UTC hour (floor of now).
 * Only maps that have a scheduled event at exactly `nowUtcHour` are included.
 */
export const getActiveEvents = (
  data: MapEventsData,
  nowUtcHour: number,
): ActiveEvent[] => {
  const results: ActiveEvent[] = [];

  for (const [mapId, mapMeta] of Object.entries(data.maps)) {
    const mapSchedule = data.schedule[mapId as keyof typeof data.schedule];
    if (!mapSchedule) continue;

    for (const category of ["major", "minor"] as const) {
      const hours = mapSchedule[category];
      if (!hours) continue;

      const eventId = hours[String(nowUtcHour)];
      if (!eventId || isDisabled(data, eventId)) continue;

      const eventType = data.eventTypes[eventId as keyof typeof data.eventTypes];
      if (!eventType) continue;

      results.push({
        eventType,
        mapId,
        mapDisplayName: mapMeta.displayName,
        category,
        startHour: nowUtcHour,
        endsAtHour: getEndsAtHour(nowUtcHour),
      });
    }
  }

  return results;
};

/**
 * Finds the next UTC hour (after nowUtcHour, wrapping) that has at least
 * one non-disabled event scheduled across any map.
 */
export const getUpcomingNextHour = (
  data: MapEventsData,
  nowUtcHour: number,
): number | null => {
  const allHours = new Set<number>();

  for (const mapId of Object.keys(data.maps)) {
    const mapSchedule = data.schedule[mapId as keyof typeof data.schedule];
    if (!mapSchedule) continue;

    for (const category of ["major", "minor"] as const) {
      const hours = mapSchedule[category];
      if (!hours) continue;

      for (const [hourStr, eventId] of Object.entries(hours)) {
        if (!isDisabled(data, eventId)) {
          allHours.add(Number(hourStr));
        }
      }
    }
  }

  const sorted = [...allHours].sort((a, b) => a - b);
  // Find first hour strictly after nowUtcHour
  const next = sorted.find((h) => h > nowUtcHour);
  // Wrap to start of next day if needed
  return next ?? (sorted[0] ?? null);
};

/**
 * Returns events at the next upcoming UTC hour slot.
 */
export const getUpcomingEvents = (
  data: MapEventsData,
  nowUtcHour: number,
): ScheduledEvent[] => {
  const nextHour = getUpcomingNextHour(data, nowUtcHour);
  if (nextHour === null) return [];

  return getScheduledEventsAtHour(data, nextHour);
};

/**
 * Returns all non-disabled events scheduled at a specific UTC hour across all maps.
 */
const getScheduledEventsAtHour = (
  data: MapEventsData,
  hour: number,
): ScheduledEvent[] => {
  const results: ScheduledEvent[] = [];

  for (const [mapId, mapMeta] of Object.entries(data.maps)) {
    const mapSchedule = data.schedule[mapId as keyof typeof data.schedule];
    if (!mapSchedule) continue;

    for (const category of ["major", "minor"] as const) {
      const hours = mapSchedule[category];
      if (!hours) continue;

      const eventId = hours[String(hour)];
      if (!eventId || isDisabled(data, eventId)) continue;

      const eventType = data.eventTypes[eventId as keyof typeof data.eventTypes];
      if (!eventType) continue;

      results.push({ eventType, mapId, mapDisplayName: mapMeta.displayName, category, hour });
    }
  }

  return results;
};

/**
 * Returns all events in the current hour + next 23 hours, grouped by event type.
 * Active (current hour) occurrences have isActive=true.
 * Sorted: major events first, then minor, alphabetically by displayName within each group.
 */
export const getScheduleByEventType = (
  data: MapEventsData,
  nowUtcHour: number,
): EventTypeSchedule[] => {
  const byEventId = new Map<string, EventTypeSchedule>();

  for (let i = 0; i <= 23; i++) {
    const hour = (nowUtcHour + i) % 24;
    const isActive = i === 0;

    for (const [mapId, mapMeta] of Object.entries(data.maps)) {
      const mapSchedule = data.schedule[mapId as keyof typeof data.schedule];
      if (!mapSchedule) continue;

      for (const category of ["major", "minor"] as const) {
        const hours = mapSchedule[category];
        if (!hours) continue;

        const eventId = hours[String(hour)];
        if (!eventId || isDisabled(data, eventId)) continue;

        const eventType = data.eventTypes[eventId as keyof typeof data.eventTypes];
        if (!eventType) continue;

        if (!byEventId.has(eventId)) {
          byEventId.set(eventId, { eventId, eventType, occurrences: [] });
        }
        byEventId.get(eventId)!.occurrences.push({
          mapId,
          mapDisplayName: mapMeta.displayName,
          category,
          hour,
          isActive,
        });
      }
    }
  }

  const results = [...byEventId.values()];
  results.sort((a, b) => {
    const catA = a.eventType.category;
    const catB = b.eventType.category;
    if (catA !== catB) {
      if (catA === "major") return -1;
      if (catB === "major") return 1;
    }
    return a.eventType.displayName.localeCompare(b.eventType.displayName);
  });

  return results;
};

/**
 * Formats a countdown to a target UTC hour as "Xh Ym Zs" or "Ym Zs".
 * `targetHour` is the UTC hour the event starts/ends.
 */
export const formatCountdown = (targetHour: number, now: Date): string => {
  const targetMs = getNextOccurrenceMs(targetHour, now);
  const diffMs = targetMs - now.getTime();

  if (diffMs <= 0) return "0s";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

/**
 * Returns the ms timestamp of the next occurrence of `targetHour:00:00 UTC`.
 */
const getNextOccurrenceMs = (targetHour: number, now: Date): number => {
  const target = new Date(now);
  target.setUTCHours(targetHour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target.getTime();
};

/**
 * Converts a UTC schedule hour to the user's local time string (e.g. "4:00 AM" or "04:00").
 * Uses the browser's locale and timezone automatically.
 */
export const formatLocalHour = (utcHour: number): string => {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

/**
 * Returns the user's local timezone abbreviation (e.g. "CET", "GMT+1", "EST").
 */
export const getTimezoneLabel = (): string =>
  Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value ?? "";
