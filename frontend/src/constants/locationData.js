const COUNTRY_FALLBACK_CODES = [
  'US', 'CA', 'MX', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'SE', 'NO',
  'DK', 'FI', 'PL', 'CZ', 'AT', 'AU', 'NZ', 'JP', 'KR', 'CN', 'IN', 'SG', 'MY', 'ID', 'TH',
  'PH', 'VN', 'AE', 'SA', 'QA', 'ZA', 'EG', 'NG', 'KE', 'BR', 'AR', 'CL', 'CO', 'PE',
];

const getCountryCodes = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('region');
    } catch (error) {
      return COUNTRY_FALLBACK_CODES;
    }
  }
  return COUNTRY_FALLBACK_CODES;
};

const buildCountries = () => {
  const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

  return getCountryCodes()
    .map((code) => ({
      code,
      name: displayNames?.of(code) || code,
    }))
    .filter((entry) => entry.name && entry.name !== entry.code ? true : COUNTRY_FALLBACK_CODES.includes(entry.code))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const COUNTRIES = buildCountries();

export const STATES_BY_COUNTRY = {
  US: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
  ],
  CA: [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  ],
  AU: [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
    'Australian Capital Territory', 'Northern Territory',
  ],
  IN: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  ],
  GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
};

export const getStatesForCountry = (countryCode) => STATES_BY_COUNTRY[countryCode] || [];

