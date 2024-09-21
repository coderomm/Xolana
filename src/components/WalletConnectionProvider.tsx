import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import * as web3 from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import React from "react";
type Props = {
    children: string | React.JSX.Element | React.JSX.Element[]
}
const WalletConnectionProvider = ({ children }: Props) => {
    return (
        <ConnectionProvider endpoint={'https://solana-devnet.g.alchemy.com/v2/ahzKpQE6h7g8eaKKa2xAFmY9Fe_cYM1L'}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletConnectionProvider;