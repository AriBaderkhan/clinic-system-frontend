// Price of a plan for the chosen billing period ('monthly' | 'yearly').
export const planPrice = (plan, period) =>
  period === "yearly" ? plan?.yearly_price : plan?.price;
