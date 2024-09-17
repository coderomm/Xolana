import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletIcon } from 'lucide-react';

function Header() {
    const { connected } = useWallet();
    return (
        <>
            <header className="flex items-center justify-between border-b border-white text-white backdrop-blur-xl sticky
            rounded-b-[35px] px-3 md:px-20 py-4">
                <div className="flex items-center justify-start gap-1 cursor-pointer">
                    <h1 className="font-bold text-2xl">Xolana</h1>
                </div>
                <div className="flex flex-col">
                    {connected ? (
                        <WalletDisconnectButton />
                    ) : (
                        <WalletMultiButton >
                            <WalletIcon className="mr-2 mb-0.5 h-4 w-4" /> Select Wallet
                        </WalletMultiButton>
                    )}
                </div>
            </header>
        </>
    )
}
export default Header;