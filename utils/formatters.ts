
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const isSameWeek = (d1: Date, d2: Date) => {
  const diff = Math.abs(d1.getTime() - d2.getTime());
  const oneDay = 24 * 60 * 60 * 1000;
  // A simple check for within the last 7 days and current week context
  return diff < 7 * oneDay && d1.getDay() >= d2.getDay();
};

export const isSameMonth = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth();
