import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'react-hot-toast'

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  // You can also provide the mainnet cluster if you're ready for production
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
          <Toaster position="bottom-right" />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
