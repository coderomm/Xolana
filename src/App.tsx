import { BrowserRouter as Router } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

import { AppWithRouting } from './AppWithRouting';

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
              <AppWithRouting />
            </Router>
          </RecoilRoot>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider >
  )
}

export default App
