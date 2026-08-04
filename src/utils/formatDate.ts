export function formatDate(input: string) {
  const date = new Date(`${input}T00:00:00+09:00`);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  });
}

export function formatDateShort(input: string) {
  const date = new Date(`${input}T00:00:00+09:00`);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
}
