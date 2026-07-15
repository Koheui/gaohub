export function formatJpy(amount: number): string {
  return amount === 0 ? "無料" : `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const time = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  return sameDay
    ? `${formatDateTime(start)} 〜 ${time.format(end)}`
    : `${formatDateTime(start)} 〜 ${formatDateTime(end)}`;
}

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
