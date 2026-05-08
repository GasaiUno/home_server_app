import type { EventItem } from "../types";

type EventsTimelineProps = {
  events: EventItem[];
};

export function EventsTimeline({ events }: EventsTimelineProps) {
  return (
    <section className="panel events-panel">
      <div className="panel-header">
        <h2>Журнал событий</h2>
        <span>{events.length}</span>
      </div>
      <div className="events-timeline">
        {events.length === 0 ? (
          <p className="muted">Событий пока нет.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className={`event-item level-${event.level}`}>
              <strong>{event.message}</strong>
              <small>
                {new Date(event.created_at).toLocaleString("ru-RU")} · Telegram:{" "}
                {event.sent_to_telegram ? "отправлено" : "нет"}
              </small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
