import { useState } from "react"
import { X } from "lucide-react"

type WelcomePopupProps = {
  onClose: () => void
  onStartOnboarding: () => void
}

export default function WelcomePopup({ onClose, onStartOnboarding }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleStartOnboarding = () => {
    setIsVisible(false)
    setTimeout(() => {
      onStartOnboarding()
    }, 300)
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
    >
      <div className="bg-gradient-to-br from-gray-900 to-purple-950 rounded-lg shadow-xl border border-purple-900/30 p-6 max-w-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-white">Welcome to Xolana</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X size={18} />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <p className="text-gray-300 mb-4">
          New to Xolana? Take a quick tour to learn about our features and get started with Web3.
        </p>

        <div className="flex justify-end space-x-3">
          <button onClick={handleClose} className="py-2 px-3 text-sm text-gray-300 hover:text-white">
            Maybe Later
          </button>
          <button
            onClick={handleStartOnboarding}
            className="py-2 px-4 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors"
          >
            Start Tour
          </button>
        </div>
      </div>
    </div>
  )
}
