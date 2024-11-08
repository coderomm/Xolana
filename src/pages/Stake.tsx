import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Stake() {
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [walletBalance, setWalletBalance] = useState<number>();
    const [isStaking, setIsStaking] = useState(false);
    const connection = new Connection('https://api.devnet.solana.com');
    const wallet = useWallet()

    useEffect(() => {
        const BACKEND_WS_URL = 'wss://xolana.onrender.com';
        const ws = new WebSocket(BACKEND_WS_URL);
        ws.onopen = () => {
            console.log('WebSocket connection opened');
            setWebSocket(ws);
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'connected':
                    console.log('WebSocket connection established');
                    break;
                case 'log':
                    toast.info(data.message);
                    break;
                case 'not-a-stake-transaction':
                    toast.info('Not a stake transaction');
                    break;
                case 'stake-processed-successfully':
                    toast.success(`Stake processed successfully. Signature: ${data.signature}`);
                    break;
                case 'transaction-processed':
                    toast.info('Transaction processed');
                    break;
                case 'error-processing-stake':
                    toast.error(`Error processing stake: ${data.error}`);
                    break;
                default:
                    console.log('Unsupported message type:', data.type);
            }
        };
        if (webSocket) {
            console.log(webSocket);
        }
        ws.onclose = () => {
            console.log('WebSocket connection closed');
            setWebSocket(null);
        };

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

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

        const amountInNumber = parseFloat(amount);
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
            // data.logs.forEach((log: string) => {
            //     toast.info(log);
            // });
            // if (data.message === 'Stake processed successfully') {
            //     // Handle successful stake
            // } else {
            //     // Handle other cases
            // }
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
            setAmount('');
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
                    focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                                    id="StakeSOLInput"
                                    placeholder="0.100000"
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    min={0.01}
                                    step={0.000001}
                                    required
                                    disabled={!wallet.connected || isStaking}
                                />
                                <div className="mb-4 text-sm">
                                    Balance: {walletBalance?.toFixed(4) || 0} SOL
                                </div>
                                <button
                                    disabled={!wallet.connected || isStaking || !amount}
                                    onClick={handleStakeSol}
                                    className='flex items-center justify-center gap-1 w-full h-10 px-4 py-2 rounded-md font-medium text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow hover:bg-primary/90 text-[#18181b] bg-[#fafafa] transition-all duration-100 ease-out active:scale-95 hover:opacity-90'>
                                    <RefreshCcw />{isStaking ? 'Staking...' : 'Stake SOL'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}