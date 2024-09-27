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

function App() {
  const network = 'devnet'
  const endpoint = clusterApiUrl(network)
  console.log(endpoint)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <RecoilRoot>
            <div className="flex w-full">
              <div className="w-full">
                <Sidebar />
                <Header />
                <main>
                  <Home />
                </main>
                <Footer />
                <Toaster />
              </div>
            </div>
          </RecoilRoot>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
