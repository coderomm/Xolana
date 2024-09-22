import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios, { AxiosError } from "axios";
import { Coins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RequestAirdropProps {
    onAirdropComplete: () => void;
}

const RequestAirdrop: React.FC<RequestAirdropProps> = ({ onAirdropComplete }) => {
    const [isAirdropping, setIsAirdropping] = useState<boolean>(false);
    const wallet = useWallet()
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const requestAirdrop = async () => {
        if (!wallet.publicKey) {
            toast.error('Please connect your wallet')
            return;
        }
        setIsAirdropping(true);
        if (import.meta.env.VITE_API_CHOICE === '0') {
            try {
                await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
                toast.success('1 SOL airdropped to your wallet!')
                onAirdropComplete();
            } catch (error) {
                console.error('Error airdropping SOL:', error)
                toast.error('Failed to airdrop SOL')
            } finally {
                setIsAirdropping(false);
            }
        } else if (import.meta.env.VITE_API_CHOICE === '1') {
            try {
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/request-airdrop`, {
                    publicKey
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    toast.success('Airdrop successful!');
                    onAirdropComplete();
                } else {
                    toast.error('Airdrop failed. Try again.');
                }
            } catch (error: unknown) {
                console.error('Error:', error);
                if (error instanceof AxiosError) {
                    console.error('Axios error:', error.response);
                    toast.error(error.response?.data || 'Failed to airdrop SOL');
                } else {
                    console.error('Unknown error:', error);
                    toast.error('Server error. Please try again later.');
                }
            } finally {
                setIsAirdropping(false);
            }
        }
    }
    return (
        <button disabled={!wallet.connected || isAirdropping} onClick={requestAirdrop} className="transition-transform transform active:scale-95 flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] hover:opacity-95 font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:px-10 text-center disabled:pointer-events-none disabled:opacity-50">
            <Coins className="mr-2 h-4 w-4" /> {isAirdropping ? 'Airdropping...' : 'Airdrop 1 SOL'}
        </button>
    )
}
export default RequestAirdrop;