const mojibakeMarker = /[ÃÂâð�]/;

export function cleanDisplayText(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  if (!mojibakeMarker.test(value)) {
    return value;
  }

  return value
    .replace(/^\s*(?:Ã|Â|â|ð|�)[^\s]*(?:\s+)?/u, "")
    .replace(/\s+(?:Ã|Â|â|ð|�)[^\s]*/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
