import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, WalletIcon } from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { SideBarOpen } from '../../atoms/sidebarAtom';

function Header() {
    const { connected } = useWallet();
    const setSideBarOpen = useSetRecoilState(SideBarOpen);
    return (
        <>
            <header className="flex items-center justify-between border-b border-white text-white backdrop-blur-xl sticky
            rounded-b-[35px] px-3 md:px-20 py-4">
                <div className="flex items-center justify-start gap-1 cursor-pointer">
                    <h1 className="font-bold text-2xl">Xolana</h1>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <div className="flex flex-col">
                        {connected ? (
                            <WalletDisconnectButton />
                        ) : (
                            <WalletMultiButton >
                                <WalletIcon className="mr-2 mb-0.5 h-4 w-4" /> Select Wallet
                            </WalletMultiButton>
                        )}
                    </div>
                    <button className="block text-white" onClick={() => setSideBarOpen((prev) => !prev)}>
                        <Menu />
                    </button>
                </div>
            </header>
        </>
    )
}
export default Header;