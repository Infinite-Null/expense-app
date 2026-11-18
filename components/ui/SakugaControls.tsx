'use client'

import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react'
import Script from 'next/script'

type SakugaAttributes<T extends HTMLElement> = DetailedHTMLProps<HTMLAttributes<T>, T> & {
  label?: string
  onchange?: (event: Event) => void
}

interface CheckedElement extends HTMLElement {
  checked: boolean
}

export interface ToastElement extends HTMLElement {
  show: () => void
  hide: () => void
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- React's JSX extension point for custom elements.
  namespace JSX {
    interface IntrinsicElements {
      'sakuga-checkbox': SakugaAttributes<CheckedElement> & { checked: boolean }
      'sakuga-toggle': SakugaAttributes<CheckedElement> & { checked: boolean }
      'sakuga-radio': SakugaAttributes<HTMLElement> & { value: string }
      'sakuga-tabs': SakugaAttributes<HTMLElement> & { selected: number }
      'sakuga-progress': SakugaAttributes<HTMLElement> & { value: string; 'done-label'?: string }
      'sakuga-toast': SakugaAttributes<ToastElement> & {
        duration: number
        onclose?: () => void
      }
    }
  }
}

interface CheckedProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ checked, onChange, children }: CheckedProps & { children: ReactNode }) {
  return (
    <sakuga-checkbox
      checked={checked}
      onchange={(event) => onChange((event.currentTarget as CheckedElement).checked)}
      className="sakuga-checkbox"
    >
      {children}
    </sakuga-checkbox>
  )
}

export function Toggle({ checked, onChange, label, id }: CheckedProps & { label: string; id?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <Script src="/sakuga-vfx/toggle.js" type="module" />
      <sakuga-toggle
        id={id}
        className="sakuga-toggle"
        label={label}
        checked={checked}
        onchange={(event) => onChange((event.currentTarget as CheckedElement).checked)}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className="sakuga-toggle-fallback"
          onClick={() => onChange(!checked)}
        />
      </sakuga-toggle>
      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    </label>
  )
}

interface OptionsProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

export function RadioGroup<T extends string>({ label, options, value, onChange }: OptionsProps<T>) {
  return (
    <sakuga-radio
      label={label}
      value={value}
      className="sakuga-options sakuga-radio"
      onchange={(event) => {
        const next = (event.currentTarget as HTMLElement & { value: string }).value
        const option = options.find((item) => item.value === next)
        if (option) onChange(option.value)
      }}
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </sakuga-radio>
  )
}

export function Tabs<T extends string>({ label, options, value, onChange }: OptionsProps<T>) {
  return (
    <sakuga-tabs
      label={label}
      selected={options.findIndex((option) => option.value === value)}
      className="sakuga-options sakuga-tabs"
      onchange={(event) => {
        const index = (event as CustomEvent<{ index: number }>).detail.index
        const option = options[index]
        if (option) onChange(option.value)
      }}
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </sakuga-tabs>
  )
}

export function Progress({ label, value, doneLabel }: { label: string; value: number; doneLabel: string }) {
  return (
    <sakuga-progress label={label} value={String(value)} done-label={doneLabel} className="sakuga-progress" />
  )
}
