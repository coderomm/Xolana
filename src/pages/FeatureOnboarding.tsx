import { useEffect } from "react"
import useOnboarding from "../hooks/useOnboarding"
import OnboardingTooltip from "../components/onboarding/OnboardingTooltip"

export default function FeatureOnboarding() {

  const swapSteps = [
    {
      targetId: "swap-from-token",
      content: "Select the token you want to swap from.",
      position: "bottom" as const,
    },
    {
      targetId: "swap-to-token",
      content: "Select the token you want to receive.",
      position: "bottom" as const,
    },
    {
      targetId: "slippage-settings",
      content: "Adjust slippage tolerance to control price impact.",
      position: "left" as const,
    },
    {
      targetId: "swap-button",
      content: "Click here to execute your swap once you're ready.",
      position: "top" as const,
    },
  ]

  const { currentStep, isActive, currentStepData, startOnboarding, nextStep, skipOnboarding, totalSteps } =
    useOnboarding(swapSteps)

  useEffect(() => {
    const hasVisitedSwap = localStorage.getItem("has-visited-swap")
    if (!hasVisitedSwap) {
      localStorage.setItem("has-visited-swap", "true")
      startOnboarding()
    }
  }, [startOnboarding])

  return (
    <>
      {currentStepData && (
        <OnboardingTooltip
          targetId={currentStepData.targetId}
          content={currentStepData.content}
          position={currentStepData.position}
          isVisible={isActive}
          onNext={nextStep}
          onSkip={skipOnboarding}
          stepNumber={currentStep + 1}
          totalSteps={totalSteps}
        />
      )}
    </>
  )
}
