import { useState, useEffect } from "react"

type OnboardingStep = {
  targetId: string
  content: string
  position?: "top" | "right" | "bottom" | "left"
}

export default function useOnboarding(steps: OnboardingStep[]) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("feature-onboarding-completed") === "true"
  })

  useEffect(() => {
    if (isActive && currentStep >= steps.length) {
      completeOnboarding()
    }
  }, [currentStep, steps.length, isActive])

  const startOnboarding = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const skipOnboarding = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    setIsActive(false)
    localStorage.setItem("feature-onboarding-completed", "true")
    setHasCompletedOnboarding(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem("feature-onboarding-completed")
    setHasCompletedOnboarding(false)
  }

  return {
    currentStep,
    isActive,
    hasCompletedOnboarding,
    currentStepData: isActive && currentStep < steps.length ? steps[currentStep] : null,
    startOnboarding,
    nextStep,
    skipOnboarding,
    resetOnboarding,
    totalSteps: steps.length,
  }
}
