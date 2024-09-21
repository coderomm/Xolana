import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'sonner';

import '@solana/wallet-adapter-react-ui/styles.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import Header from './components/Header'
import Footer from './components/Footer'


function App() {
  const network = 'devnet'
  const endpoint = clusterApiUrl(network)
  console.log(endpoint)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <Header />
          <main>
            <TokenLaunchpad />
          </main>
          <Footer />
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
