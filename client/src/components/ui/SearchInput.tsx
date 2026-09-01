import { type InputHTMLAttributes } from 'react'
import { SearchIcon, XIcon } from './icons'
import { Input } from './Input'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({ value, onChange, placeholder = 'Search...', disabled, className = '', ...props }: SearchInputProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      leftAddon={<SearchIcon className="h-4 w-4" />}
      rightAddon={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded p-0.5 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  )
}
