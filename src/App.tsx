import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'sonner';

import '@solana/wallet-adapter-react-ui/styles.css'
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import { Home } from './components/Home';
import { RecoilRoot } from 'recoil';
import Sidebar from './components/ui/Sidebar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Swap from './components/Swap';
import Stake from './components/Stake';

function App() {
  const network = 'devnet'
  const endpoint = clusterApiUrl(network)
  console.log(endpoint)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <RecoilRoot>
            <Router>
              <div className="flex w-full">
                <div className="w-full">
                  <Sidebar />
                  <Header />
                  <main className='min-h-[80vh]'>
                    <Routes>
                      <Route path='*' element={<Navigate to={'/'} replace />} />
                      <Route path='/' element={<Home />} />
                      <Route path='/o/swap' element={<Swap />} />
                      <Route path='/o/stake' element={<Stake />} />
                    </Routes>
                  </main>
                  <Footer />
                  <Toaster />
                </div>
              </div>
            </Router>
          </RecoilRoot>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider >
  )
}

export default App
