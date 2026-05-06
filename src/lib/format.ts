/**
 * Format an amount in cents to a localized currency string.
 * e.g., formatAmount(4999, 'EUR', 'pt') → "€49,99"
 *       formatAmount(4999, 'USD', 'en') → "$49.99"
 */
export function formatAmount(
  cents: number,
  currency: string,
  locale: string = 'pt'
): string {
  const amount = cents / 100;

  const currencyMap: Record<string, string> = {
    EUR: 'EUR',
    USD: 'USD',
    GBP: 'GBP',
    BRL: 'BRL',
    CHF: 'CHF',
  };

  const localeMap: Record<string, string> = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  try {
    return new Intl.NumberFormat(localeMap[locale] || 'pt-PT', {
      style: 'currency',
      currency: currencyMap[currency] || currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback manual formatting
    const symbol =
      currency.toUpperCase() === 'EUR' ? '€' :
      currency.toUpperCase() === 'USD' ? '$' :
      currency.toUpperCase() === 'GBP' ? '£' :
      currency.toUpperCase();

    const formatted = amount.toLocaleString(localeMap[locale] || 'pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${symbol}${formatted}`;
  }
}

/**
 * Format an ISO date string to a localized date string.
 * e.g., formatDate('2024-03-15T10:30:00Z', 'pt') → "15/03/2024"
 */
export function formatDate(
  isoString: string,
  locale: string = 'pt'
): string {
  if (!isoString) return '';

  const localeMap: Record<string, string> = {
    pt: 'pt-PT',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(localeMap[locale] || 'pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format a date of birth string for display.
 * e.g., formatDob('1990-05-20', 'en') → "05/20/1990"
 */
export function formatDob(
  dobString: string,
  locale: string = 'pt'
): string {
  if (!dobString) return '';
  return formatDate(dobString, locale);
}
