const COUNTRY_CODES = [
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
]

type PhoneInputProps = {
  label?: string
  value?: string
  onChange?: (value: string) => void
  countryCode?: string
  onCountryCodeChange?: (code: string) => void
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

export function PhoneInput({
  label,
  value = '',
  onChange,
  countryCode = '+880',
  onCountryCodeChange,
  placeholder = '01XXXXXXXXX',
  error,
  helperText,
  required,
  disabled,
  className = '',
  id,
  name,
}: PhoneInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '')
    onChange?.(digits)
  }

  const fullPhone = countryCode && value ? `${countryCode}${value}` : value

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <div className="flex rounded-lg border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0 transition-colors duration-150 overflow-hidden">
        <div className="relative">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange?.(e.target.value)}
            disabled={disabled}
            className="h-full rounded-none border-0 bg-background px-2 py-2 pr-6 text-sm text-text outline-none disabled:bg-gray-100 disabled:text-text-muted disabled:pointer-events-none appearance-none cursor-pointer"
            style={{ minWidth: '110px' }}
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-text-muted">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <input
            id={inputId}
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            name={name}
            className={[
              'w-full rounded-none border-0 bg-transparent px-3 py-2 text-sm outline-none',
              'placeholder:text-text-muted',
              error
                ? 'text-error'
                : 'text-text',
              'disabled:bg-gray-100 disabled:text-text-muted disabled:pointer-events-none',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
          />
        </div>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
          {helperText}
        </p>
      )}
      {!error && !helperText && (
        <p className="mt-1.5 text-xs text-text-muted">
          Include country code
        </p>
      )}
      <input type="hidden" name={name} value={fullPhone || ''} readOnly />
    </div>
  )
}
