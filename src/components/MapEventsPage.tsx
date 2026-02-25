import { useEffect, useRef, useState } from "react";
import mapEventsJson from "../generated/map-events.json";
import type { MapEventsData } from "../generated/types";
import { useLanguage } from "../hooks/useLanguage";
import {
  formatCountdown,
  formatLocalHour,
  getActiveEvents,
  getEndsAtHour,
  getScheduleByEventType,
  getTimezoneLabel,
  getUpcomingEvents,
  getUpcomingNextHour,
  type ActiveEvent,
  type EventTypeSchedule,
  type ScheduledEvent,
} from "../utils/mapEventsUtils";
import "./MapEventsPage.scss";

const mapEventsData = mapEventsJson as unknown as MapEventsData;

const EventCard = ({
  event,
  countdown,
  countdownLabel,
}: {
  event: ActiveEvent | ScheduledEvent;
  countdown: string;
  countdownLabel: string;
}) => (
  <div className={`event-card event-card--${event.category}`}>
    {event.eventType.icon && (
      <img
        className="event-card__icon invert-in-light"
        src={event.eventType.icon}
        alt={event.eventType.displayName}
        width={40}
        height={40}
      />
    )}
    <div className="event-card__info">
      <span className="event-card__name">{event.eventType.displayName}</span>
      <span className="event-card__map">{event.mapDisplayName}</span>
    </div>
    <div className="event-card__right">
      <span
        className={`event-card__badge event-card__badge--${event.category}`}
      >
        {event.category}
      </span>
      <span className="event-card__countdown">
        {countdownLabel} <strong>{countdown}</strong>
      </span>
    </div>
  </div>
);

const ScheduleCard = ({
  eventType,
  occurrences,
  now,
  translateUI,
}: EventTypeSchedule & { now: Date; translateUI: (key: import("../localization/uiStrings").UIStringKey) => string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      const overflows = el.scrollHeight > el.clientHeight;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      setShowGradient(overflows && !atBottom);
    };

    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, [occurrences]);

  return (
    <div className={`schedule-card schedule-card--${eventType.category}`}>
      <div className="schedule-card__header">
        {eventType.icon && (
          <img
            className="schedule-card__icon invert-in-light"
            src={eventType.icon}
            alt={eventType.displayName}
            width={28}
            height={28}
          />
        )}
        <span className="schedule-card__name">{eventType.displayName}</span>
      </div>
      <div
        className={`schedule-card__scroll-wrap${showGradient ? " schedule-card__scroll-wrap--overflowing" : ""}`}
      >
        <div ref={scrollRef} className="schedule-card__occurrences">
          {occurrences.map((occ) => (
            <div
              key={`${occ.mapId}-${occ.hour}`}
              className={`schedule-occurrence${occ.isActive ? " schedule-occurrence--active" : ""}`}
            >
              <span className="schedule-occurrence__map">
                {occ.mapDisplayName}
              </span>
              <div className="schedule-occurrence__time">
                <span className="schedule-occurrence__hour">
                  {formatLocalHour(occ.hour)}
                </span>
                <span className="schedule-occurrence__countdown">
                  {occ.isActive
                    ? `${translateUI("events.endsIn")} ${formatCountdown(getEndsAtHour(occ.hour), now)}`
                    : `${translateUI("events.in")} ${formatCountdown(occ.hour, now)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MapEventsPage = () => {
  const { translateUI } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowUtcHour = now.getUTCHours();
  const tzLabel = getTimezoneLabel();

  const activeEvents = getActiveEvents(mapEventsData, nowUtcHour);
  const upcomingEvents = getUpcomingEvents(mapEventsData, nowUtcHour);
  const nextHour = getUpcomingNextHour(mapEventsData, nowUtcHour);
  const schedule: EventTypeSchedule[] = getScheduleByEventType(
    mapEventsData,
    nowUtcHour,
  );

  return (
    <div className="map-events-page">
      <div className="map-events-page__top">
        {/* Active Now */}
        <section className="map-events-section">
          <h2 className="map-events-section__title">
            <span className="pulse-dot" aria-hidden="true" />
            {translateUI("events.activeNow")}
            <span className="map-events-section__subtitle">
              {formatLocalHour(nowUtcHour)} · {tzLabel}
            </span>
          </h2>
          {activeEvents.length === 0 ? (
            <p className="map-events-empty">{translateUI("events.noActiveEvents")}</p>
          ) : (
            <div className="event-cards">
              {activeEvents.map((event) => (
                <EventCard
                  key={`${event.mapId}-${event.category}`}
                  event={event}
                  countdown={formatCountdown(event.endsAtHour, now)}
                  countdownLabel={translateUI("events.endsIn")}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Next */}
        <section className="map-events-section">
          <h2 className="map-events-section__title">
            <svg
              className="map-events-section__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {translateUI("events.upcomingNext")}
            {nextHour !== null && (
              <span className="map-events-section__subtitle">
                {formatLocalHour(nextHour)} · {tzLabel}
              </span>
            )}
          </h2>
          {upcomingEvents.length === 0 ? (
            <p className="map-events-empty">{translateUI("events.noUpcomingEvents")}</p>
          ) : (
            <div className="event-cards">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={`${event.mapId}-${event.category}`}
                  event={event}
                  countdown={
                    nextHour !== null ? formatCountdown(nextHour, now) : "—"
                  }
                  countdownLabel={translateUI("events.startsIn")}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Next 24 Hours */}
      <section className="map-events-section map-events-section--schedule">
        <h2 className="map-events-section__title">{translateUI("events.next24Hours")}</h2>
        {schedule.length === 0 ? (
          <p className="map-events-empty">{translateUI("events.noScheduledEvents")}</p>
        ) : (
          <div className="schedule-grid">
            {schedule.map(({ eventId, eventType, occurrences }) => (
              <ScheduleCard
                key={eventId}
                eventId={eventId}
                eventType={eventType}
                occurrences={occurrences}
                now={now}
                translateUI={translateUI}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MapEventsPage;
