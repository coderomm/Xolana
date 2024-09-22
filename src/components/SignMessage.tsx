import { useWallet } from "@solana/wallet-adapter-react";
import { Signature } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ed25519 } from '@noble/curves/ed25519';

const SignMessage = () => {
    const [isSignning, setIsSignning] = useState<boolean>(false);
    const [message, setMessage] = useState('');
    const wallet = useWallet()
    const { publicKey, signMessage } = useWallet();

    const handleSignMessage = async () => {
        if (!publicKey) throw new Error('Wallet not connected!');
        if (!signMessage) throw new Error('Wallet does not support message signing!');

        setIsSignning(true);
        try {
            const encodedMessage = new TextEncoder().encode(message);
            const signature = await signMessage(encodedMessage);

            if (!ed25519.verify(signature, encodedMessage, publicKey.toBytes())) throw new Error('Message signature invalid!');
            toast.success("Message signed!");
            setMessage('');
        } catch (error) {
            toast.error("Signing failed!");
            console.error('Signing failed!', error)
            return;
        } finally {
            setIsSignning(false);
        }
    };

    return (
        <div className="w-full">
            <label className='text-sm text-[#a1a1aa]' htmlFor="signMessage">Sign Message</label>
            <div className="flex items-center justify-center gap-1">
                <input
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    id="signMessage"
                    placeholder="My Awesome Message"
                    value={message}
                    minLength={1}
                    required
                    onChange={
                        (e) => setMessage(e.target.value)
                    }
                />
                <button disabled={!message || !wallet.connected || isSignning} onClick={handleSignMessage} className='flex items-center justify-center gap-1 rounded-md font-medium text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 h-9 px-4 py-2 text-[#18181b] bg-[#fafafa] transition-all duration-100 ease-out active:scale-95 hover:opacity-90'>
                    <Signature />{isSignning ? 'Signning...' : 'Sign'}</button>
            </div>
        </div>
    )
}
export default SignMessage;