/**
 * Country and Currency Utilities (Client-side)
 * Provides mapping between countries and their currencies for African countries
 */

// Supported African countries and their currencies
export const AFRICAN_COUNTRIES = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencyName: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencyName: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencyName: 'South African Rand', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencyName: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencyName: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencyName: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', currencyName: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', currencyName: 'Rwandan Franc', flag: '🇷🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', currencyName: 'Zambian Kwacha', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', currencyName: 'US Dollar', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', currencyName: 'Botswana Pula', flag: '🇧🇼' },
  { code: 'MW', name: 'Malawi', currency: 'MWK', currencyName: 'Malawian Kwacha', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', currencyName: 'Mozambican Metical', flag: '🇲🇿' },
  { code: 'AO', name: 'Angola', currency: 'AOA', currencyName: 'Angolan Kwanza', flag: '🇦🇴' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇨🇲' },
  { code: 'CI', name: 'Ivory Coast', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇳🇪' },
  { code: 'TG', name: 'Togo', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇹🇬' },
  { code: 'BJ', name: 'Benin', currency: 'XOF', currencyName: 'West African CFA Franc', flag: '🇧🇯' },
  { code: 'TD', name: 'Chad', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇹🇩' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇨🇫' },
  { code: 'GA', name: 'Gabon', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇬🇦' },
  { code: 'CG', name: 'Republic of the Congo', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇨🇬' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF', currencyName: 'Central African CFA Franc', flag: '🇬🇶' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', currencyName: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', currencyName: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', currency: 'TND', currencyName: 'Tunisian Dinar', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', currency: 'DZD', currencyName: 'Algerian Dinar', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', currency: 'LYD', currencyName: 'Libyan Dinar', flag: '🇱🇾' },
] as const;

// Paystack supported currencies in Africa
export const PAYSTACK_SUPPORTED_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'XOF', 'XAF', 'USD'] as const;

export type CountryCode = typeof AFRICAN_COUNTRIES[number]['code'];
export type CurrencyCode = typeof AFRICAN_COUNTRIES[number]['currency'];

/**
 * Get currency code for a country code
 */
export function getCurrencyByCountry(countryCode: string | undefined | null): string {
  if (!countryCode) {
    return 'GHS'; // Default to Ghana
  }
  
  const country = AFRICAN_COUNTRIES.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
  return country?.currency || 'GHS';
}

/**
 * Get country data by country code
 */
export function getCountryByCode(countryCode: string | undefined | null) {
  if (!countryCode) {
    return AFRICAN_COUNTRIES.find(c => c.code === 'GH'); // Default to Ghana
  }
  
  return AFRICAN_COUNTRIES.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
}

/**
 * Check if a currency is supported by Paystack
 */
export function isPaystackSupportedCurrency(currency: string): boolean {
  return PAYSTACK_SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as any);
}

/**
 * Get all supported countries
 */
export function getSupportedCountries() {
  return AFRICAN_COUNTRIES;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Detect country from phone number
 */
export function detectCountryFromPhone(phoneNumber: string): string | null {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  const countryCodeMap: Record<string, string> = {
    '233': 'GH', '234': 'NG', '27': 'ZA', '254': 'KE', '256': 'UG',
    '255': 'TZ', '251': 'ET', '250': 'RW', '260': 'ZM', '263': 'ZW',
    '267': 'BW', '265': 'MW', '258': 'MZ', '244': 'AO', '237': 'CM',
    '225': 'CI', '221': 'SN', '223': 'ML', '226': 'BF', '227': 'NE',
    '228': 'TG', '229': 'BJ', '235': 'TD', '236': 'CF', '241': 'GA',
    '242': 'CG', '240': 'GQ', '20': 'EG', '212': 'MA', '216': 'TN',
    '213': 'DZ', '218': 'LY',
  };
  
  for (const [code, country] of Object.entries(countryCodeMap)) {
    if (digitsOnly.startsWith(code)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Detect country from browser geolocation (if available)
 */
export async function detectCountryFromGeolocation(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || null;
  } catch (error) {
    console.error('Error detecting country from geolocation:', error);
    return null;
  }
}

