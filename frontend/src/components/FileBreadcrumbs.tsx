type FileBreadcrumbsProps = {
  path: string;
  onNavigate: (path: string) => void;
};

export function FileBreadcrumbs({ path, onNavigate }: FileBreadcrumbsProps) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => ({
    label: part,
    path: parts.slice(0, index + 1).join("/")
  }));

  return (
    <nav className="file-breadcrumbs" aria-label="Путь к папке">
      {crumbs.map((crumb, index) => (
        <button key={crumb.path} type="button" onClick={() => onNavigate(crumb.path)}>
          {index > 0 ? "/ " : ""}
          {crumb.label}
        </button>
      ))}
    </nav>
  );
}
