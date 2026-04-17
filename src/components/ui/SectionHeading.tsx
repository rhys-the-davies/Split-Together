interface SectionHeadingProps {
  children: React.ReactNode;
}

export function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
      {children}
    </h2>
  );
}
