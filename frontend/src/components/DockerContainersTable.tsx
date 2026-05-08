import type { DockerContainer } from "../types";

type DockerContainersTableProps = {
  containers: DockerContainer[];
};

export function DockerContainersTable({ containers }: DockerContainersTableProps) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <h2>Docker containers</h2>
        <span>{containers.length}</span>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Контейнер</th>
              <th>Статус</th>
              <th>Health</th>
              <th>Restart</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {containers.length === 0 ? (
              <tr>
                <td colSpan={5}>Docker socket недоступен или контейнеры не найдены.</td>
              </tr>
            ) : (
              containers.map((container) => (
                <tr key={container.name}>
                  <td>
                    <strong>{container.name}</strong>
                    <small>{container.image ?? "image unknown"}</small>
                  </td>
                  <td>
                    <StatusPill value={container.status} />
                  </td>
                  <td>{container.health ?? "n/a"}</td>
                  <td>{container.restart_count ?? 0}</td>
                  <td>{container.started_at ? new Date(container.started_at).toLocaleString("ru-RU") : "n/a"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone = value === "running" ? "normal" : value === "restarting" ? "warning" : "critical";
  return <span className={`status-pill tone-${tone}`}>{value}</span>;
}
