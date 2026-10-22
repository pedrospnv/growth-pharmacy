export type PaymentForValidation = {
  transaction_amount?: unknown;
  payer?: { email?: unknown } | null;
};

export type OrderForValidation = {
  total: number | string;
  email: string;
};

export function paymentMatchesOrder(payment: PaymentForValidation, order: OrderForValidation): boolean {
  const paymentAmount = Number(payment.transaction_amount);
  const orderAmount = Number(order.total);
  if (!Number.isFinite(paymentAmount) || !Number.isFinite(orderAmount)) return false;
  const sameAmount = Math.round(paymentAmount * 100) === Math.round(orderAmount * 100);
  const paymentEmail = String(payment.payer?.email ?? "").trim().toLowerCase();
  const orderEmail = String(order.email ?? "").trim().toLowerCase();
  return sameAmount && paymentEmail.length > 0 && paymentEmail === orderEmail;
}
