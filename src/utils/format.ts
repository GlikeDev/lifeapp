// Formatting helpers

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function monthsLeft(current: number, target: number, monthly: number): number {
  if (monthly <= 0) return 0;
  return Math.ceil((target - current) / monthly);
}
