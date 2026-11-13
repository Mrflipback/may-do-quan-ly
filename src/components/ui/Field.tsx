import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

const O_NHAP_CHUNG =
  'w-full rounded-lg bg-paper px-3 text-sm text-slate-900 ring-1 ring-slate-300 ' +
  'placeholder:text-slate-400 transition-shadow ' +
  'focus:ring-2 focus:ring-brand-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

interface NhanProps {
  nhan?: string
  batBuoc?: boolean
  loi?: string
  goiY?: string
  children: ReactNode
  htmlFor?: string
  className?: string
}

/** Khung bọc gồm nhãn, ô nhập và dòng báo lỗi. */
export function Field({ nhan, batBuoc, loi, goiY, children, htmlFor, className }: NhanProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {nhan && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {nhan}
          {batBuoc && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      {children}
      {loi ? (
        <p className="text-xs font-medium text-rose-600">{loi}</p>
      ) : goiY ? (
        <p className="text-xs text-slate-500">{goiY}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  nhan?: string
  batBuoc?: boolean
  loi?: string
  goiY?: string
  iconTrai?: ReactNode
  boxClassName?: string
}

export function Input({
  nhan,
  batBuoc,
  loi,
  goiY,
  iconTrai,
  className,
  boxClassName,
  id,
  ...rest
}: InputProps) {
  const tuSinh = useId()
  const inputId = id ?? tuSinh
  return (
    <Field nhan={nhan} batBuoc={batBuoc} loi={loi} goiY={goiY} htmlFor={inputId} className={boxClassName}>
      <div className="relative">
        {iconTrai && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {iconTrai}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={loi ? true : undefined}
          className={cn(
            O_NHAP_CHUNG,
            'h-10',
            iconTrai && 'pl-9',
            loi && 'ring-rose-400 focus:ring-rose-500',
            className,
          )}
          {...rest}
        />
      </div>
    </Field>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  nhan?: string
  batBuoc?: boolean
  loi?: string
  goiY?: string
}

export function Textarea({ nhan, batBuoc, loi, goiY, className, id, ...rest }: TextareaProps) {
  const tuSinh = useId()
  const inputId = id ?? tuSinh
  return (
    <Field nhan={nhan} batBuoc={batBuoc} loi={loi} goiY={goiY} htmlFor={inputId}>
      <textarea
        id={inputId}
        aria-invalid={loi ? true : undefined}
        className={cn(
          O_NHAP_CHUNG,
          'min-h-24 resize-y py-2.5 leading-relaxed',
          loi && 'ring-rose-400 focus:ring-rose-500',
          className,
        )}
        {...rest}
      />
    </Field>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  nhan?: string
  batBuoc?: boolean
  loi?: string
  goiY?: string
  boxClassName?: string
  children: ReactNode
}

export function Select({
  nhan,
  batBuoc,
  loi,
  goiY,
  className,
  boxClassName,
  id,
  children,
  ...rest
}: SelectProps) {
  const tuSinh = useId()
  const inputId = id ?? tuSinh
  return (
    <Field
      nhan={nhan}
      batBuoc={batBuoc}
      loi={loi}
      goiY={goiY}
      htmlFor={inputId}
      className={boxClassName}
    >
      <select
        id={inputId}
        aria-invalid={loi ? true : undefined}
        className={cn(
          O_NHAP_CHUNG,
          'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          loi && 'ring-rose-400 focus:ring-rose-500',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </Field>
  )
}
