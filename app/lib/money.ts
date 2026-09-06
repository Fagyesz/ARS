/**
 * Deterministic price formatting ("8000 Ft", "12 000 Ft"). Server and browser ICU
 * data disagree on HUF decimals (Intl gives "HUF 4,000.00" vs "HUF 4,000"), which
 * breaks hydration wherever a price is server-rendered, so avoid Intl here.
 */
export function formatMoney(
  amount: string | number,
  currencyCode: string = 'HUF',
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return '';
  const whole = Math.round(value);
  // hu-HU style: thousands separated by a space, but 4-digit amounts stay solid
  const digits = Math.abs(whole).toString();
  const grouped =
    digits.length >= 5 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : digits;
  const sign = whole < 0 ? '−' : '';
  const unit = currencyCode === 'HUF' ? 'Ft' : currencyCode;
  return `${sign}${grouped} ${unit}`;
}
