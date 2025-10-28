export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M12 14L20 10L28 14V20C28 24.4183 24.4183 28 20 28C15.5817 28 12 24.4183 12 20V14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="15" r="1.5" fill="currentColor" />
    </svg>
  )
}
