'use client'

import { useId } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

export function Dropdown({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
}) {
  const id = useId()
  return (
    <select
      id={id}
      name="associatedTopic"
      aria-label={placeholder ?? '关联议题'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="r-input min-h-11 cursor-pointer">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}
