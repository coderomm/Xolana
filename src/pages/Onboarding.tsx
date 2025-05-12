import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ArrowRight, Wallet, ArrowLeftRight, Landmark, CheckCircle2, WalletIcon } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const OnboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to Xolana",
    subtitle: "Your gateway to the Solana blockchain",
    description: "Experience seamless token management, swapping, and staking in one powerful platform.",
  },
  {
    id: "wallet",
    title: "Connect Your Wallet",
    subtitle: "Secure access to the Solana ecosystem",
    description: "Link your Solana wallet to access all features and manage your assets safely.",
  },
  {
    id: "features",
    title: "Explore Features",
    subtitle: "Discover what you can do",
    description: "Create tokens, swap assets, and stake SOL to earn rewards - all in one place.",
  },
  {
    id: "complete",
    title: "You're All Set!",
    subtitle: "Start your Web3 journey",
    description: "Your onboarding is complete. Explore the Xolana platform and unlock the full potential of Solana.",
  },
]

const features = [
  {
    icon: <Wallet size={24} />,
    title: "Wallet Management",
    description: "Securely manage your Solana assets with our integrated wallet solution.",
  },
  {
    icon: <ArrowLeftRight size={24} />,
    title: "Token Swapping",
    description: "Swap tokens effortlessly with competitive rates and minimal slippage.",
  },
  {
    icon: <Landmark size={24} />,
    title: "Liquid Staking",
    description: "Stake your SOL and earn rewards while maintaining liquidity.",
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [walletConnected, setWalletConnected] = useState(false)
  const navigate = useNavigate()

  const handleNext = () => {
    if (currentStep < OnboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate("/")
      toast("Onboarding complete! Welcome to Xolana.")
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // const handleConnectWallet = () => {
  //   setTimeout(() => {
  //     setWalletConnected(true)
  //     toast("Wallet connected successfully!")
  //   }, 1000)
  // }

  const handleSkip = () => {
    navigate("/")
    toast("You can complete onboarding later from settings.")
  }

  const { connected } = useWallet();

  const renderStepContent = () => {
    const step = OnboardingSteps[currentStep]

    switch (step.id) {
      case "welcome":
        return (
          <div className="flex flex-col items-center justify-center space-y-8 px-4">
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-white text-center mb-2">{step.title}</h1>
              <h2 className="text-xl text-purple-300 text-center mb-4">{step.subtitle}</h2>
              <p className="text-gray-300 text-center mb-8">{step.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="text-purple-400 mb-3">{feature.icon}</div>
                  <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "wallet":
        return (
          <div className="flex flex-col items-center justify-center space-y-6 px-4">
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-white text-center mb-2">{step.title}</h1>
              <h2 className="text-xl text-purple-300 text-center mb-4">{step.subtitle}</h2>
              <p className="text-gray-300 text-center mb-8">{step.description}</p>
            </div>

            <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6">
              <div className="flex flex-col space-y-4 items-center">
                {connected ? (
                    <WalletDisconnectButton />
                ) : (
                    <WalletMultiButton onClick={()=>setWalletConnected(true)} >
                        <WalletIcon className="mr-2 mb-0.5 h-4 w-4" /> Select Wallet
                    </WalletMultiButton>
                )}
                {/* <button
                  onClick={handleConnectWallet}
                  disabled={walletConnected}
                  className={`w-full py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-all duration-300 ${
                    walletConnected
                      ? "bg-green-600/20 border border-green-500 text-green-400 cursor-default"
                      : "bg-purple-600/20 border border-purple-500 text-white hover:bg-purple-600/40"
                  }`}
                >
                  {walletConnected ? (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Wallet Connected</span>
                    </>
                  ) : (
                    <>
                      <Wallet size={20} />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button> */}

                <div className="text-center text-sm text-gray-400 mt-4">
                  <p>Don't have a wallet?</p>
                  <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                    Learn how to create one
                  </a>
                </div>
              </div>
            </div>
          </div>
        )

      case "features":
        return (
          <div className="flex flex-col items-center justify-center space-y-6 px-4">
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-white text-center mb-2">{step.title}</h1>
              <h2 className="text-xl text-purple-300 text-center mb-4">{step.subtitle}</h2>
              <p className="text-gray-300 text-center mb-8">{step.description}</p>
            </div>

            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <span className="bg-purple-600/20 p-2 rounded-md mr-3">
                      <Wallet size={20} className="text-purple-400" />
                    </span>
                    Create Tokens
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Launch your own token on Solana with just a few clicks. Set name, symbol, supply, and more.
                  </p>
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JcCrRwNX9RnIKqv9jlHUFgquYXyhbs.png"
                    alt="Token Creation Interface"
                    className="w-full rounded-md border border-gray-800"
                  />
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <span className="bg-purple-600/20 p-2 rounded-md mr-3">
                      <ArrowLeftRight size={20} className="text-purple-400" />
                    </span>
                    Swap Tokens
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Exchange tokens at the best rates with our optimized swap interface.
                  </p>
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-iRf5Tz5Y9J6DveD5TnlGZ69APKy9dQ.png"
                    alt="Swap Interface"
                    className="w-full rounded-md border border-gray-800"
                  />
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300 md:col-span-2">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <span className="bg-purple-600/20 p-2 rounded-md mr-3">
                      <Landmark size={20} className="text-purple-400" />
                    </span>
                    Stake SOL
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Earn rewards by staking your SOL with flexible lock periods and competitive APY.
                  </p>
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rEGTgTsIPh5lnASh1SPIWiBESP7ExT.png"
                    alt="Staking Interface"
                    className="w-full rounded-md border border-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "complete":
        return (
          <div className="flex flex-col items-center justify-center space-y-8 px-4">
            <div className="w-full max-w-md">
              <div className="flex justify-center mb-6">
                <div className="bg-green-600/20 p-6 rounded-full border border-green-500">
                  <CheckCircle2 size={48} className="text-green-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white text-center mb-2">{step.title}</h1>
              <h2 className="text-xl text-purple-300 text-center mb-4">{step.subtitle}</h2>
              <p className="text-gray-300 text-center mb-8">{step.description}</p>
            </div>

            <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/o/swap")}
                  className="py-3 px-4 rounded-md bg-purple-600/20 border border-purple-500 text-white hover:bg-purple-600/40 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <ArrowLeftRight size={18} />
                  <span>Swap Tokens</span>
                </button>
                <button
                  onClick={() => navigate("/o/stake")}
                  className="py-3 px-4 rounded-md bg-purple-600/20 border border-purple-500 text-white hover:bg-purple-600/40 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Landmark size={18} />
                  <span>Stake SOL</span>
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black to-purple-950 flex flex-col">
      <div className="w-full px-4 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {OnboardingSteps.length}
            </span>
            <button onClick={handleSkip} className="text-sm text-purple-400 hover:text-purple-300">
              Skip
            </button>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / OnboardingSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-4xl mx-auto">{renderStepContent()}</div>
      </div>

      <div className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`py-2 px-4 rounded-md transition-all duration-300 ${
              currentStep === 0 ? "opacity-0 cursor-default" : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === 1 && !walletConnected}
            className={`py-2 px-4 rounded-md bg-purple-600 text-white flex items-center space-x-2 transition-all duration-300 ${
              currentStep === 1 && !walletConnected ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-500"
            }`}
          >
            <span>{currentStep === OnboardingSteps.length - 1 ? "Get Started" : "Next"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
