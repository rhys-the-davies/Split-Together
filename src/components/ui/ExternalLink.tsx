interface ExternalLinkProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
}

export function ExternalLink({ href, className = "", children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={["truncate text-xs text-primary hover:underline", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? href}
    </a>
  );
}
