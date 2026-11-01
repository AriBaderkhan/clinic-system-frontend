// Money breakdown of one unpaid session: normal works + each treatment plan.
// Plan numbers are for the WHOLE plan (a plan is paid across several visits).
// Only amounts in the session's currency are added into `remaining`.
export function unpaidBreakdown(s) {
  const currency = s.currency_code;
  const totals = s.totals || {};

  const normal = {
    show: Number(totals.total) > 0,
    total: Number(totals.total) || 0,
    paid: Number(totals.total_paid) || 0,
    remaining: totals.is_paid ? 0 : Number(totals.remaining) || 0,
  };

  const plans = (s.treatment_plans || []).map((p) => ({ ...p, currency_code: p.currency_code || currency }));

  const remaining = normal.remaining + plans
    .filter((p) => p.currency_code === currency)
    .reduce((sum, p) => sum + (Number(p.remaining) || 0), 0);

  return {
    currency,
    normal,
    plans,
    remaining,
    normalWorks: s.works_summary?.items_count ?? 0,
    planWorks: plans.reduce((sum, p) => sum + (p.works_count || 0), 0),
  };
}
