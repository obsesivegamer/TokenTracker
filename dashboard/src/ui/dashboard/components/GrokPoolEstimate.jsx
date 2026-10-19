import { copy, getCopyLocale } from "../../../lib/copy";
import { formatCompactNumber } from "../../../lib/format";

const ESTIMATE_LABEL_KEYS = {
  Cursor: "limits.label.grok_cursor",
  GrokBot: "limits.label.grok_bot",
  GrokChat: "limits.label.grok_chat",
};

function exactTokens(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(getCopyLocale());
}

// Integer shares stay integers (22 → "22"). A fractional share keeps one
// decimal (0.4 → "0.4", 17.6 → "17.6") so Math.round cannot print 0% for a
// positive ruler. Anything under 0.05 prints "<0.1".
export function formatEstimatePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0";
  const rounded = Math.round(n * 10) / 10;
  if (rounded === 0) return "<0.1";
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function GrokPoolEstimate({ estimate }) {
  const rows = Array.isArray(estimate?.rows) ? estimate.rows : [];
  if (estimate?.kind !== "estimate" || rows.length === 0) return null;
  const basisTokens = Number(estimate.basis_tokens);
  const basisPercent = Number(estimate.basis_percent);
  if (!Number.isFinite(basisTokens) || basisTokens <= 0) return null;
  if (!Number.isFinite(basisPercent) || basisPercent <= 0) return null;
  const visible = rows.filter((row) => {
    if (!ESTIMATE_LABEL_KEYS[row?.product]) return false;
    const tokens = Number(row.estimated_tokens);
    return Number.isFinite(tokens) && tokens > 0;
  });
  if (visible.length === 0) return null;

  return (
    <div data-grok-pool-estimate="" className="mt-2 max-w-xl">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-oai-gray-400 dark:text-oai-gray-500">
        {copy("limits.estimate.title")}
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {visible.map((row) => {
          const tokens = Number(row.estimated_tokens);
          return (
            <div key={row.product} className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="text-oai-gray-500 dark:text-oai-gray-400">{copy(ESTIMATE_LABEL_KEYS[row.product])}</span>
              <span
                className="tabular-nums text-oai-black dark:text-white"
                title={exactTokens(tokens)}
              >
                {formatCompactNumber(tokens)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-oai-gray-500 dark:text-oai-gray-400">
        {copy("limits.estimate.note", {
          tokens: formatCompactNumber(basisTokens),
          percent: formatEstimatePercent(basisPercent),
        })}
      </p>
    </div>
  );
}
