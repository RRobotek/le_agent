'use client'

interface AddAgentButtonProps {
  onClick?: () => void
}

export function AddAgentButton({ onClick }: AddAgentButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 group"
      aria-label="Add agent"
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: '#EA6189' }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span
        className="text-sm tracking-widest uppercase"
        style={{ color: '#EA6189' }}
      >
        Add Agent
      </span>
    </button>
  )
}
