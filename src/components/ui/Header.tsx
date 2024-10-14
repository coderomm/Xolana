import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, WalletIcon } from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { SideBarOpen } from '../../atoms/sidebarAtom';
import { useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();
    const { connected } = useWallet();
    const setSideBarOpen = useSetRecoilState(SideBarOpen);
    return (
        <>
            <header className="flex items-center justify-between border-b border-white text-white backdrop-blur-xl sticky
            rounded-b-[35px] px-3 md:px-20 py-4">
                <div className="flex items-center justify-start gap-5 cursor-pointer">
                    <h1 onClick={() => navigate('/')} className="font-bold text-2xl cursor-pointer">Xolana</h1>
                    <div className="hidden lg:flex items-center justify-center gap-3">
                        <a href='https://crypto-kosh.vercel.app' target='_blank' className='rounded cursor-pointer transition-transform transform active:scale-95 hover:bg-white/30 px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border border-[#434348]'>CryptoKosh Wallet</a>
                        <button type='button' onClick={() => navigate('/o/swap')} className='rounded cursor-pointer transition-transform transform active:scale-95 hover:bg-white/30 px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border border-[#434348]'>Swap</button>
                    </div>

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