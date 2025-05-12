// AppWithRouting.tsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import Sidebar from './components/ui/Sidebar';
import { Home } from './pages/Home';
import Swap from './pages/Swap';
import SolanaStaking from './pages/SolanaStaking';
import Onboarding from './pages/Onboarding';
import WelcomePopup from './components/onboarding/WelcomePopup';
import { Toaster } from 'sonner';

export function AppWithRouting() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("onboarding-completed") === "true"
  })

  useEffect(() => {
    // Show welcome popup after a short delay if onboarding not completed
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [hasCompletedOnboarding])

  const handleStartOnboarding = () => {
    setShowWelcome(false);
    handleCompleteOnboarding();
    navigate('/onboarding');
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem("onboarding-completed", "true")
    setHasCompletedOnboarding(true)
  }

  return (
    <div className="flex w-full">
      <div className="w-full">
        <Sidebar />
        <Header />
        <main className="min-h-[80vh]">
          <Routes>
            <Route path="*" element={<Navigate to={'/'} replace />} />
            <Route path="/" element={<Home />} />
            <Route path="/o/swap" element={<Swap />} />
            <Route path="/o/stake" element={<SolanaStaking />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
        {showWelcome && (
          <WelcomePopup
            onClose={() => setShowWelcome(false)}
            onStartOnboarding={handleStartOnboarding}
          />
        )}
      </div>
    </div>
  );
}
