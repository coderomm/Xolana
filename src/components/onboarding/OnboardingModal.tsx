import { useState, useEffect } from "react"
import { X } from "lucide-react"

type OnboardingModalProps = {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to Xolana",
      description: "Let's get you started with the basics of our platform.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      title: "Connect Your Wallet",
      description: "Link your Solana wallet to access all features.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      title: "Explore Features",
      description: "Discover token creation, swapping, and staking.",
      image: "/placeholder.svg?height=150&width=150",
    },
  ]

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-purple-950 rounded-lg shadow-xl border border-purple-900/30 p-6 m-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center">
          <img
            src={steps[currentStep].image || "/placeholder.svg"}
            alt={steps[currentStep].title}
            className="w-24 h-24 mb-4"
          />
          <h2 className="text-xl font-bold text-white mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-300 text-center mb-6">{steps[currentStep].description}</p>

          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? "w-8 bg-purple-500" : "w-2 bg-gray-600"
                }`}
              ></div>
            ))}
          </div>

          <div className="flex justify-between w-full">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`py-2 px-4 rounded-md transition-all ${
                currentStep === 0 ? "opacity-0 cursor-default" : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="py-2 px-4 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-all"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
