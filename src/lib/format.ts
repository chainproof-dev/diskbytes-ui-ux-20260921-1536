const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/** Formats a byte count using Windows binary units and three significant digits. */
export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "—";
  if (value < 1024) return `${Math.round(value)} B`;
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** index;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(digits)} ${units[index]}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value < 0.1) return "<0.1%";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  return milliseconds < 1000 ? `${Math.round(milliseconds)}ms` : `${(milliseconds / 1000).toFixed(1)}s`;
}

export function relativeAge(unixSeconds: number, nowSeconds = Date.now() / 1000): string {
  const seconds = Math.max(0, nowSeconds - unixSeconds);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
