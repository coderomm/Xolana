import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Stake() {
    const [amount, setAmount] = useState<string>('');
    const [walletBalance, setWalletBalance] = useState<number>();
    const wallet = useWallet()

    useEffect(() => {
        const connection = new Connection('https://api.devnet.solana.com');
        const fetchBalance = async () => {
            try {
                if (wallet.connected && wallet.publicKey) {
                    const balance = await connection.getBalance(wallet.publicKey);
                    setWalletBalance(balance / LAMPORTS_PER_SOL);
                }
            } catch (error) {
                console.error("Failed to fetch wallet balance - ", error);
                toast.error("Failed to fetch wallet balance");
            }
        };
        fetchBalance();
    }, [wallet.connected, wallet.publicKey]);

    const handleStakeSol = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            toast.error('Please connect your wallet to proceed');
            return;
        }

        const amountInNumber = parseFloat(amount);

        if (walletBalance !== undefined && amountInNumber > walletBalance) {
            toast.info('Wallet does not have enough SOL to stake!');
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/helius`, {
                senderPublicKey: wallet.publicKey.toString(),
                amount: amountInNumber,
            });

            if (response.status === 200) {
                toast.success('Staking request sent successfully!');
            } else {
                toast.error('Staking failed. Please try again.');
            }
        } catch (error) {
            console.error('An error occurred while staking. - ', error)
            toast.error('An error occurred while staking.');
        }
    }
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const validNumber = /^(\d+(\.\d{0,6})?|\.?\d{1,6})$/.test(value);
        const withinBalanceLimit = walletBalance === undefined || parseFloat(value) <= walletBalance;
        if (validNumber && withinBalanceLimit) {
            setAmount(value);
        }
    };
    return <>
        <section className="container mx-auto py-4 px-1 md:px-4 md:max-w-6xl relative flex items-center justify-center min-h-[80vh]">
            <div className="flex-col items-center justify-center w-full">
                <h1 className="text-xl md:text-3xl font-bold mb-1 text-center">Liquid Staking Redefined</h1>
                <p className="text-gray-300 mb-6 text-center text-[15px]">Unlock the full potential of your Solana assets with seamless, high-yield liquid staking</p>
                <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
                <div className="flex flex-col rounded-2xl border border-[#434348] p-2 xl:p-5 max-w-3xl xl:max-w-full w-full h-max xl:w-1/2 mx-auto">
                    <div className="items-center justify-center hidden">
                        <h2 className='text-center text-2xl md:text-3xl'>Wallet</h2>
                    </div>
                    <div className="border-t border-[#434348] my-5 hidden"></div>
                    <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-10">
                        <div className="w-full">
                            <label className='text-sm text-[#a1a1aa]' htmlFor="StakeSOLInput">Stake Amount (SOL)</label>
                            <div className="flex flex-col items-start justify-center gap-5 mt-2">
                                <input
                                    className='bg-[#09090b] text-base py-1 px-3 border border-[#27272a] rounded w-full h-12
                    focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                                    id="StakeSOLInput"
                                    placeholder="0.100000"
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    min={0.01}
                                    step={0.000001}
                                    required
                                />
                                <button
                                    disabled={!wallet.connected || parseFloat(amount) <= 0 || parseFloat(amount) > (walletBalance || 0)}
                                    onClick={handleStakeSol}
                                    className='flex items-center justify-center gap-1 w-full h-10 px-4 py-2 rounded-md font-medium text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow hover:bg-primary/90 text-[#18181b] bg-[#fafafa] transition-all duration-100 ease-out active:scale-95 hover:opacity-90'>
                                    <RefreshCcw />Stake SOL</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}