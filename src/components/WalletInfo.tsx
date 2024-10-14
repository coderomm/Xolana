import { CheckIcon, Copy, Eye, EyeOff } from "lucide-react";
import RequestAirdrop from "./RequestAirdrop";
import SignMessage from "./SignMessage";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const WalletInfo = () => {
    const [walletBalance, setWalletBalance] = useState<number>()
    const [showWalletBalance, setShowWalletBalance] = useState(false);
    const [walletAddressCopied, setWalletAddressCopied] = useState(false);

    const wallet = useWallet()
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const fetchBalance = async () => {
        if (wallet.publicKey) {
            const res = await connection.getBalance(wallet.publicKey);
            setWalletBalance(res / LAMPORTS_PER_SOL);
        }
    };

    useEffect(() => {
        if (wallet.publicKey) {
            fetchBalance();
        }
    }, [wallet.publicKey]);

    const toggleWalletAddressVisibility = () => {
        if (!wallet.publicKey) {
            toast.error('Please connect your wallet first.')
            return;
        }
        setShowWalletBalance(!showWalletBalance);
    }

    const handleCopyWalletAddress = () => {
        if (!wallet.publicKey) {
            toast.error("Please connect your wallet first.");
            return;
        }
        navigator.clipboard.writeText(publicKey?.toString() ?? '');
        setWalletAddressCopied(true)
        setTimeout(() => setWalletAddressCopied(false), 2000)
        toast.success('Wallet address copied.')
    }
    return (
        <div className="flex flex-col rounded-2xl border border-[#434348] p-2 xl:p-5 max-w-3xl xl:max-w-full w-full h-max xl:w-1/2">
            <div className="flex items-center justify-center">
                <h2 className='text-center text-2xl md:text-3xl'>Wallet</h2>
            </div>
            <div className="border-t border-[#434348] my-5"></div>
            <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-10">
                <div onClick={handleCopyWalletAddress}
                    className="flex items-center justify-between bg-[#09090b] text-[0.875rem] py-2 px-3 md:p-4 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none">
                    <span className='text-sm font-medium truncate mr-2 cursor-pointer'>Address: {wallet.publicKey ? wallet.publicKey?.toString() : 'NoN'}</span>
                    <button disabled={!wallet.connected} className=' disabled:pointer-events-none disabled:opacity-50'>
                        {walletAddressCopied ? (
                            <CheckIcon />
                        ) : (
                            <Copy />
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-between bg-[#09090b] text-[0.875rem] py-2 px-3 md:py-2 md:px-4 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none">
                    <span className="text-sm font-medium">Balance: {wallet.publicKey ? (showWalletBalance ? walletBalance : '•••••••••••••••••••') : 'Non'}</span>
                    <div onClick={toggleWalletAddressVisibility} className="flex items-center">
                        <button disabled={!wallet.connected} className=' disabled:pointer-events-none disabled:opacity-50'>{showWalletBalance ? <Eye /> : <EyeOff />}</button>
                    </div>
                </div>
                <SignMessage />
                <RequestAirdrop onAirdropComplete={fetchBalance} />
            </div>
        </div>
    )
}
export default WalletInfo;