import type { ServiceHealthItem } from "../types";

type ServicesHealthTableProps = {
  services: ServiceHealthItem[];
};

export function ServicesHealthTable({ services }: ServicesHealthTableProps) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <h2>HTTP services</h2>
        <span>{services.length}</span>
      </div>
      <div className="health-list">
        {services.map((service) => (
          <article key={service.id} className="health-row">
            <span className={service.online ? "health-dot online" : "health-dot offline"} />
            <div>
              <strong>{service.name}</strong>
              <small>{service.checked_url}</small>
            </div>
            <span>{service.status_code ?? "offline"}</span>
            <span>{service.response_time_ms ?? 0} ms</span>
          </article>
        ))}
      </div>
    </section>
  );
}
