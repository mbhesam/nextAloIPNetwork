type StatusBadgeProps = {
  status: string;
  statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
  >;
  className?: string;
};

export default function StatusBadge({
  status,
  statusConfig,
  className = "",
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: "نامشخص",
    color: "bg-gray-100 text-gray-800",
    icon: "•",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${config.color} ${className}`}>
      {config.icon} {config.label}
    </span>
  );
}
