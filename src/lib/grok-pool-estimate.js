"use strict";

// Products whose pool share can be scaled into a token estimate.
// Grok Build is the measured ruler. Imagine is image generation.
const ESTIMATED_PRODUCTS = new Set(["Cursor", "GrokBot", "GrokChat"]);

/**
 * Scale measured Grok Build tokens across the other token products that share
 * the same pool percent. One percent point of Grok Build equals the same
 * number of tokens for Cursor and Grok Bot. The result is an estimate: the
 * pool may price a cache read below a fresh token, and these rows must not be
 * added to measured totals.
 *
 * A queue hour bucket is included only when the bucket starts at or after
 * periodStart. A bucket that started earlier also holds pre-period usage.
 */
function buildGrokPoolTokenEstimate({ products, periodStart, rows }) {
  if (!Array.isArray(products) || typeof periodStart !== "string") return null;
  const startMs = Date.parse(periodStart);
  if (!Number.isFinite(startMs)) return null;

  const basis = products.find((entry) => entry && entry.product === "GrokBuild");
  const basisPercent = Number(basis?.window?.used_percent);
  if (!Number.isFinite(basisPercent) || basisPercent <= 0) return null;

  let basisTokens = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || row.source !== "grok") continue;
    const hourMs = Date.parse(row.hour_start || "");
    if (!Number.isFinite(hourMs) || hourMs < startMs) continue;
    const total = Number(row.total_tokens);
    if (!Number.isFinite(total) || total <= 0) continue;
    basisTokens += total;
  }
  if (!(basisTokens > 0)) return null;

  const perPoint = basisTokens / basisPercent;
  const estimateRows = [];
  for (const entry of products) {
    const product = entry?.product;
    if (!ESTIMATED_PRODUCTS.has(product)) continue;
    const percent = Number(entry?.window?.used_percent);
    if (!Number.isFinite(percent) || percent <= 0) continue;
    estimateRows.push({
      product,
      usage_percent: percent,
      estimated_tokens: Math.round(percent * perPoint),
    });
  }
  if (estimateRows.length === 0) return null;

  return {
    kind: "estimate",
    period_start: new Date(startMs).toISOString(),
    basis_product: "GrokBuild",
    basis_percent: basisPercent,
    basis_tokens: Math.round(basisTokens),
    rows: estimateRows,
  };
}

module.exports = {
  ESTIMATED_PRODUCTS,
  buildGrokPoolTokenEstimate,
};
