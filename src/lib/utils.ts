import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert prisma object to regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with decimal places
export function formatNumberWithDecimal(number: number): string {
  const [int, decimal] = number.toString().split('.');

  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}

//Round number to 2 decimal places
export function round2(value: number | string) {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === 'string') {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error('Invalid value, not a number or string');
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

// Format currency using the formatter
export function formatCurrency(value: number | string | null) {
  if (typeof value === 'number') {
    return CURRENCY_FORMATTER.format(value);
  } else if (typeof value === 'string') {
    return CURRENCY_FORMATTER.format(Number(value));
  } else {
    return 'NaN';
  }
}

// Format number
const NUMBER_FORMATTER = new Intl.NumberFormat('pt-PT');

export function formatNumber(value: number | string | null) {
  if (typeof value === 'number') {
    return NUMBER_FORMATTER.format(value);
  } else if (typeof value === 'string') {
    return NUMBER_FORMATTER.format(Number(value));
  } else {
    return 'NaN';
  }
}

// Format date and times
export const formatDateTime = (dateString: Date | string | null | undefined) => {
  if (!dateString) {
    return {
      dateTime: '',
      dateOnly: '',
      timeOnly: '',
    };
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return {
      dateTime: '',
      dateOnly: '',
      timeOnly: '',
    };
  }

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: '2-digit', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: false, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'numeric', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: false, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const formattedDateTime: string = date.toLocaleString(
    'pt-PT',
    dateTimeOptions,
  );
  const formattedDate: string = date.toLocaleString(
    'pt-PT',
    dateOptions,
  );
  const formattedTime: string = date.toLocaleString(
    'pt-PT',
    timeOptions,
  );

  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

// MESQUITA - #20: add clipboard copy helper with textarea fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to execCommand when Clipboard API is blocked or unavailable.
    }
  }

  if (typeof document === 'undefined' || !document.body) {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

