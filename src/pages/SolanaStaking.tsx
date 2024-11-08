import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRightLeft, Clock, Coins, RefreshCcw } from 'lucide-react';
import { Connection, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import axios from 'axios';

const SolanaStaking = () => {
    const [stakeAmount, setStakeAmount] = useState<string>('');
    const [walletBalance, setWalletBalance] = useState<number>();
    const [isStaking, setIsStaking] = useState(false);
    const connection = new Connection('https://api.devnet.solana.com');
    const wallet = useWallet()

    const [apy] = useState(5.8);
    const [lockPeriod, setLockPeriod] = useState(0);
    const [estimatedRewards, setEstimatedRewards] = useState(0);

    useEffect(() => {
        const amount = parseFloat(stakeAmount) || 0;
        const annualReward = (amount * apy) / 100;
        const periodReward = lockPeriod ? (annualReward * lockPeriod) / 12 : annualReward;
        setEstimatedRewards(periodReward);
    }, [stakeAmount, apy, lockPeriod]);

    useEffect(() => {
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
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [wallet.connected, wallet.publicKey]);

    const handleStakeSol = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            toast.error('Please connect your wallet to proceed');
            return;
        }

        const amountInNumber = parseFloat(stakeAmount);
        if (isNaN(amountInNumber) || amountInNumber <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (walletBalance !== undefined && amountInNumber > walletBalance) {
            toast.error('Insufficient balance');
            return;
        }

        setIsStaking(true);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API}/stake`,
                {
                    senderPublicKey: wallet.publicKey.toString(),
                    amount: amountInNumber,
                }, { withCredentials: true }
            );

            const transaction = Transaction.from(
                Buffer.from(data.transaction, 'base64')
            );
            const signature = await wallet.sendTransaction(
                transaction,
                connection
            );
            const confirmation = await connection.confirmTransaction(signature);

            if (confirmation.value.err) {
                toast.error('Transaction failed');
                throw new Error('Transaction failed');
            }
            toast.success('Staking transaction submitted successfully!');
            setTimeout(() => toast.success(`Congratulations 🎉, you have received ${stakeAmount} XolSol, please check your wallet`), 1000)
            setStakeAmount('');
        } catch (error) {
            console.error('Staking failed:', error);
            toast.error('Failed to stake SOL. Please try again.');
        } finally {
            setIsStaking(false);
        }
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const validNumber = /^(\d+(\.\d{0,6})?|\.?\d{1,6})$/.test(value);
        const withinBalanceLimit = walletBalance === undefined || parseFloat(value) <= walletBalance;
        if (validNumber && withinBalanceLimit) {
            setStakeAmount(value);
        }
    };

    const getLockPeriodBonus = () => {
        switch (lockPeriod) {
            case 1: return 0.5;
            case 3: return 1.0;
            case 6: return 2.0;
            case 12: return 3.0;
            default: return 0;
        }
    };

    const totalApy = apy + getLockPeriodBonus();

    return (
        <section className="container mx-auto py-4 px-1 md:px-4 md:max-w-6xl relative flex items-center justify-center min-h-[80vh]">
            <div className="flex-col items-center justify-center w-full">
                <div className="max-w-2xl mx-auto p-4 space-y-6">
                    <div className="rounded-lg shadow-lg overflow-hidden">

                        <h1 className="text-xl md:text-3xl font-bold mb-1 text-center">Liquid Staking Redefined 💰</h1>
                        <p className="text-base md:text-xl font-semibold text-gray-300 mb-1 text-center">🚀 Maximize your Solana assets' potential with easy, high-reward liquid staking on devnet</p>
                        <p className="text-gray-300 mb-6 text-center text-base hidden">🔗 Stake SOL to receive XolSOL and earn rewards as you learn and explore</p>

                        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>

                        <div className="p-6 space-y-6 rounded-2xl border border-[#434348]">
                            {/* Staking Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-[#a1a1aa]">Stake Amount (SOL)</label>
                                <div className="relative">
                                    <input
                                        className='bg-[#09090b] text-base py-1 px-3 border border-[#27272a] rounded w-full h-12
                    focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                                        id="StakeSOLInput"
                                        placeholder="0.100000"
                                        type="number"
                                        value={stakeAmount}
                                        onChange={handleAmountChange}
                                        min={0.01}
                                        step={0.000001}
                                        required
                                        disabled={!wallet.connected || isStaking}
                                    />
                                    <button
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-white hover:text-gray-400"
                                        onClick={() => {
                                            if (walletBalance) {
                                                setStakeAmount(walletBalance.toString())
                                            }
                                        }}
                                    >
                                        MAX
                                    </button>
                                </div>
                                <p className="text-sm text-[#a1a1aa]">Balance: {walletBalance} SOL</p>
                            </div>

                            {/* Lock Period Selection */}
                            <div className="space-y-2">
                                <label className="text-sm text-[#a1a1aa]">Lock Period</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[0, 1, 3, 6, 12].map((months) => (
                                        <button
                                            key={months}
                                            onClick={() => setLockPeriod(months)}
                                            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors
                    ${lockPeriod === months
                                                    ? 'bg-gray-100 text-black'
                                                    : 'bg-white/30 text-white hover:bg-gray-200 hover:text-black'}`}
                                        >
                                            {months === 0 ? 'Flex' : `${months}M`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Staking Info */}
                            <div className="grid grid-cols-2 gap-4 border border-[#27272a] rounded-lg p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Coins className="w-4 h-4" />
                                        Base APY
                                    </div>
                                    <p className="font-medium">{apy}%</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        Lock Bonus
                                    </div>
                                    <p className="font-medium">+{getLockPeriodBonus()}%</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Exchange Rate
                                    </div>
                                    <p className="font-medium">1 SOL = 1 XolSOL</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Coins className="w-4 h-4" />
                                        Total APY
                                    </div>
                                    <p className="font-medium text-green-600">{totalApy}%</p>
                                </div>
                            </div>

                            {/* Estimated Rewards */}
                            <div className="flex items-center gap-2 p-4 border border-[#27272a] bg-[#09090b] filter backdrop-blur-sm text-whit rounded-lg">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p className="text-sm">
                                    Estimated rewards: {estimatedRewards.toFixed(4)} SOL per year
                                </p>
                            </div>

                            {/* Stake Button */}
                            <button
                                disabled={!wallet.connected || isStaking || !parseFloat(stakeAmount)}
                                //                     className={`w-full py-3 px-4 rounded-lg font-medium text-white
                                //   ${isLoading || !parseFloat(stakeAmount)
                                //                             ? 'bg-gray-400 cursor-not-allowed'
                                //                             : 'bg-white/30 hover:bg-blue-700 transition-colors'}`}
                                onClick={handleStakeSol}
                                className='flex items-center justify-center gap-1 w-full h-10 px-4 py-2 rounded-md font-medium text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow hover:bg-primary/90 text-[#18181b] bg-[#fafafa] transition-all duration-100 ease-out active:scale-95 hover:opacity-90'>
                                <RefreshCcw />{isStaking ? 'Staking...' : 'Stake SOL'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
};

export default SolanaStaking;