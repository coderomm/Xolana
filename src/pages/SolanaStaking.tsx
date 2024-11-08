import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRightLeft, Clock, Coins } from 'lucide-react';

const SolanaStaking = () => {
    const [stakeAmount, setStakeAmount] = useState('0.1');
    const [balance] = useState(27.23);
    const [apy] = useState(5.8);
    const [lockPeriod, setLockPeriod] = useState(0); // 0 = flexible
    const [estimatedRewards, setEstimatedRewards] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const amount = parseFloat(stakeAmount) || 0;
        const annualReward = (amount * apy) / 100;
        const periodReward = lockPeriod ? (annualReward * lockPeriod) / 12 : annualReward;
        setEstimatedRewards(periodReward);
    }, [stakeAmount, apy, lockPeriod]);

    const handleStake = async () => {
        setIsLoading(true);
        // Implement stake logic here
        setTimeout(() => setIsLoading(false), 1500);
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
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200">
                            <h1 className="text-xl md:text-3xl font-bold mb-1 text-center">Liquid Staking</h1>
                            <p className="text-gray-300 mb-6 text-center text-[15px]">Stake SOL and receive XolSOL while earning rewards</p>
                        </div>
                        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>

                        <div className="p-6 space-y-6">
                            {/* Staking Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-[#a1a1aa]">Stake Amount (SOL)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={stakeAmount}
                                        onChange={(e) => setStakeAmount(e.target.value)}
                                        className='bg-[#09090b] text-base py-1 px-3 border border-[#27272a] rounded w-full h-12
                    focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                                    />
                                    <button
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                                        onClick={() => setStakeAmount(balance.toString())}
                                    >
                                        MAX
                                    </button>
                                </div>
                                <p className="text-sm text-[#a1a1aa]">Balance: {balance} SOL</p>
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
                                onClick={handleStake}
                                disabled={isLoading || !parseFloat(stakeAmount)}
                                //                     className={`w-full py-3 px-4 rounded-lg font-medium text-white
                                //   ${isLoading || !parseFloat(stakeAmount)
                                //                             ? 'bg-gray-400 cursor-not-allowed'
                                //                             : 'bg-white/30 hover:bg-blue-700 transition-colors'}`}
                                className="flex items-center justify-center gap-1 md:gap-2 border text-base bg-white font-bold text-black rounded-lg h-14 py-2 w-full  md:px-10 mx-auto text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 ease-out active:scale-95 hover:opacity-90 cursor-pointer"
                            >
                                {isLoading ? 'Processing...' : 'Stake SOL'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
};

export default SolanaStaking;