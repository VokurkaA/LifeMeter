export const normalizePositiveDecimal = (input: string, {maxDecimals = 1}: { maxDecimals?: number } = {}): {text: string; value: number | undefined} => {
    const t = (input ?? "").replace(",", ".").trim();

    let out = "";
    let seenDot = false;
    let decimals = 0;

    for (const ch of t) {
        if (ch >= "0" && ch <= "9") {
            if (seenDot) {
                if (decimals >= maxDecimals) continue;
                decimals++;
            }
            out += ch;
            continue;
        }
        if (ch === "." && !seenDot) {
            seenDot = true;
            if (out === "") out = "0";
            out += ".";
        }
    }

    if (out === "") return {text: "", value: undefined};

    const n = Number(out);
    const value = Number.isFinite(n) && n > 0 ? n : undefined;
    return {text: out, value};
};

export function normalizePercentInput(
  input: string,
  { maxDecimals = 1 }: { maxDecimals?: number } = {},
): { text: string; value: number | undefined } {
  const t = (input ?? "").replace(",", ".").trim();

  let out = "";
  let seenDot = false;
  let decimals = 0;

  for (const ch of t) {
    if (ch >= "0" && ch <= "9") {
      if (seenDot) {
        if (decimals >= maxDecimals) continue;
        decimals++;
      }
      out += ch;
      continue;
    }
    if (ch === "." && !seenDot) {
      seenDot = true;
      if (out === "") out = "0";
      out += ".";
    }
  }

  if (out === "") return { text: "", value: undefined };

  const n = Number(out);
  if (!Number.isFinite(n)) return { text: out, value: undefined };

  // allow 0..100
  if (n < 0 || n > 100) return { text: out, value: undefined };

  return { text: out, value: n };
}