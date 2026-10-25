import { CircleCheck } from 'lucide-react'

export function PrivacyShield() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true" className="h-32 w-auto">
      <circle cx="74" cy="70" r="62" fill="#dfe8fb" />
      <path d="M74 18l40 14v30c0 27-17 46-40 54-23-8-40-27-40-54V32z" fill="#3b6fd8" />
      <path d="M74 26l32 11v25c0 22-13.6 37.5-32 44-18.4-6.5-32-22-32-44V37z" fill="#5b88e6" />
      <rect x="60" y="62" width="28" height="22" rx="4" fill="#fff" />
      <path d="M65 62v-6a9 9 0 0118 0v6" fill="none" stroke="#fff" strokeWidth="4" />
      <circle cx="74" cy="72" r="3" fill="#3b6fd8" />
      <rect x="72.5" y="73" width="3" height="6" rx="1.5" fill="#3b6fd8" />
      <circle cx="116" cy="96" r="22" fill="#d6f0df" />
      <path d="M116 78l15 5v10c0 9-6.5 15.5-15 18.5-8.5-3-15-9.5-15-18.5V83z" fill="#1f9d55" />
      <path d="M109 94l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AuthSidePanel({
  title1,
  title2,
  body,
  points,
  showShield,
  children,
}: {
  title1: string
  title2: string
  body?: React.ReactNode
  points?: string[]
  showShield?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-center px-2 lg:px-6">
      {showShield && <PrivacyShield />}
      <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
        {title1}
        <br />
        {title2}
      </h2>
      {body && <div className="mt-4 leading-7 text-muted-foreground">{body}</div>}
      {points && (
        <ul className="mt-5 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
              <CircleCheck className="size-4.5 text-success" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  )
}
