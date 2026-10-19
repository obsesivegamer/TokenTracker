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

export function GrokPoolEstimate({ estimate }) {
  const rows = Array.isArray(estimate?.rows) ? estimate.rows : [];
  if (estimate?.kind !== "estimate" || rows.length === 0) return null;
  const basisTokens = Number(estimate.basis_tokens);
  const basisPercent = Number(estimate.basis_percent);
  if (!Number.isFinite(basisTokens) || basisTokens <= 0) return null;
  if (!Number.isFinite(basisPercent) || basisPercent <= 0) return null;

  return (
    <div data-grok-pool-estimate="" className="mt-2 max-w-xl">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-oai-gray-400 dark:text-oai-gray-500">
        {copy("limits.estimate.title")}
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {rows.map((row) => {
          const labelKey = ESTIMATE_LABEL_KEYS[row?.product];
          if (!labelKey) return null;
          const tokens = Number(row.estimated_tokens);
          if (!Number.isFinite(tokens) || tokens <= 0) return null;
          return (
            <div key={row.product} className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="text-oai-gray-500 dark:text-oai-gray-400">{copy(labelKey)}</span>
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
          percent: String(Math.round(basisPercent)),
        })}
      </p>
    </div>
  );
}
