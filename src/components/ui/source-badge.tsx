interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "CIBC":
        return { backgroundColor: "#c41f3f", color: "#ffffff" };
      case "AMEX":
        return { backgroundColor: "#026ed1", color: "#ffffff" };
      case "UNKNOWN":
        return { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" };
      default:
        return { backgroundColor: undefined, color: undefined };
    }
  };

  const style = getSourceBadgeStyle(source);

  return (
    <span
      className="text-[11px] px-0.5 py-[1px] rounded font-medium inline-block w-12 text-center"
      style={style}
    >
      {source}
    </span>
  );
}
