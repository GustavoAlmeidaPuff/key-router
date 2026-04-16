export function maskKey(value: string, visible = 4): string {
  if (value.length <= visible) return value;
  return `${"*".repeat(Math.max(value.length - visible, 4))}${value.slice(-visible)}`;
}
