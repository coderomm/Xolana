import { useState, useEffect, useRef } from "react"

type TooltipPosition = "top" | "right" | "bottom" | "left"

type OnboardingTooltipProps = {
  targetId: string
  content: string
  position?: TooltipPosition
  isVisible: boolean
  onNext: () => void
  onSkip: () => void
  stepNumber: number
  totalSteps: number
}

export default function OnboardingTooltip({
  targetId,
  content,
  position = "bottom",
  isVisible,
  onNext,
  onSkip,
  stepNumber,
  totalSteps,
}: OnboardingTooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      const targetElement = document.getElementById(targetId)
      if (targetElement && tooltipRef.current) {
        const targetRect = targetElement.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()

        let top = 0
        let left = 0

        switch (position) {
          case "top":
            top = targetRect.top - tooltipRect.height - 10
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
            break
          case "right":
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
            left = targetRect.right + 10
            break
          case "bottom":
            top = targetRect.bottom + 10
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
            break
          case "left":
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
            left = targetRect.left - tooltipRect.width - 10
            break
        }

        if (left < 10) left = 10
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10
        }

        if (top < 10) top = 10
        if (top + tooltipRect.height > window.innerHeight - 10) {
          top = window.innerHeight - tooltipRect.height - 10
        }

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
        })

        targetElement.classList.add("ring-2", "ring-purple-500", "ring-offset-2", "ring-offset-black", "z-10")

        return () => {
          targetElement.classList.remove("ring-2", "ring-purple-500", "ring-offset-2", "ring-offset-black", "z-10")
        }
      }
    }
  }, [targetId, position, isVisible])

  if (!isVisible) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none"></div>
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-gradient-to-br from-gray-900 to-purple-950 rounded-lg shadow-xl border border-purple-500/30 p-4 max-w-xs pointer-events-auto"
        style={tooltipStyle}
      >
        <p className="text-white mb-3">{content}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex space-x-2">
            <button onClick={onSkip} className="py-1 px-2 text-xs text-gray-300 hover:text-white">
              Skip
            </button>
            <button
              onClick={onNext}
              className="py-1 px-3 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors"
            >
              {stepNumber === totalSteps ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
