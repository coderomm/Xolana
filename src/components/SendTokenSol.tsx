import { Send } from "lucide-react";
import { toast } from "sonner";
import {
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Transaction,
} from "@solana/web3.js";

import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferInstruction } from "@solana/spl-token"
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
interface Token22 {
    mintAddress: string;
    balance: number;
    name: string;
    symbol: string;
    image: string;
}

const SendTokenSol = ({ token22s }: { token22s: Token22[] }) => {
    const [selectedWhatToSend, setSelectedWhatToSend] = useState('sol')
    const [selectedToken, setSelectedToken] = useState('')
    const [recipientAddress, setRecipientAddress] = useState('')
    const [sendAmount, setSendAmount] = useState(0)
    const [isSending, setIsSending] = useState(false);
    // const [token22s] = useState<Token22[]>([]);

    const wallet = useWallet()
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (token22s.length > 0) {
            setSelectedToken(token22s[0].mintAddress);
        }
    }, [token22s]);

    const fetchTokenAccountPublicKey = async (ownerPublicKey: string, mintAddress: string) => {
        const requestBody = {
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
                ownerPublicKey,
                { mint: mintAddress },
                { encoding: "jsonParsed" }
            ]
        };

        try {
            const response = await fetch('https://api.devnet.solana.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.result.value.length) {
                console.error('No token accounts found for the given mint address.');
                return null;
            }
            const tokenAccountPubKey = data.result.value[0].pubkey;
            return tokenAccountPubKey;
        } catch (error) {
            console.error('Error fetching token account public key:', error);
            return null;
        }
    };

    const sendToken = async () => {
        if (!publicKey || !wallet.publicKey || !selectedToken) {
            toast.error('Please connect your wallet and select a token')
            return
        }

        try {
            setIsSending(true);
            const sourceTokenAccounts = await connection.getTokenAccountsByOwner(
                publicKey, { programId: TOKEN_2022_PROGRAM_ID }
            );

            if (sourceTokenAccounts.value.length === 0) {
                toast.error('No Token-22 account found for the wallet');
                return;
            }

            const selectedTokenAccountPubkey = await fetchTokenAccountPublicKey(wallet.publicKey.toString(), selectedToken);
            const publicKeyObject = new PublicKey(selectedTokenAccountPubkey);

            if (!selectedTokenAccountPubkey) {
                toast.error('No matching token account found for the selected token.');
                return;
            }
            const sourceTokenAccountPubkey = publicKeyObject;
            const destinationWallet = new PublicKey(recipientAddress);
            const mint = new PublicKey(selectedToken);

            const destinationTokenAccount = await connection.getTokenAccountsByOwner(destinationWallet, {
                programId: TOKEN_2022_PROGRAM_ID,
            });

            let destinationTokenAccountPubkey;
            if (destinationTokenAccount.value.length === 0) {
                const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
                const associatedTokenAddress = PublicKey.findProgramAddressSync(
                    [destinationWallet.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )[0];

                destinationTokenAccountPubkey = associatedTokenAddress;

                const createAssociatedAccountInstruction = createAssociatedTokenAccountInstruction(
                    publicKey,
                    associatedTokenAddress,
                    destinationWallet,
                    mint,
                    TOKEN_2022_PROGRAM_ID
                );

                const transaction = new Transaction().add(createAssociatedAccountInstruction);
                await wallet.sendTransaction(transaction, connection);
            } else {
                destinationTokenAccountPubkey = destinationTokenAccount.value[0].pubkey;
            }

            const tokenDecimals = 9;
            const transferAmount = sendAmount * Math.pow(10, tokenDecimals);

            const transferInstruction = createTransferInstruction(
                sourceTokenAccountPubkey,
                new PublicKey(destinationTokenAccountPubkey),
                publicKey,
                transferAmount,
                [],
                TOKEN_2022_PROGRAM_ID
            );

            const transaction = new Transaction().add(transferInstruction);
            const latestBlockHash = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = latestBlockHash.blockhash;
            transaction.feePayer = publicKey;

            const signature = await wallet.sendTransaction(transaction, connection);
            toast.success(`Transaction is Successful! ${signature}`);
        } catch (error) {
            setIsSending(false);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsSending(false);
        }
    }

    const sendSol = async () => {
        if (!wallet.publicKey) {
            toast.error('Please connect your wallet');
            return;
        }
    
        try {
            setIsSending(true);
    
            const transaction = new Transaction();
            transaction.add(SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(recipientAddress),
                lamports: sendAmount * LAMPORTS_PER_SOL,
            }));
    
            await wallet.sendTransaction(transaction, connection);
            toast.success("Sent " + sendAmount + " SOL to " + recipientAddress);
        } catch (error) {
            toast.error("Transaction failed: " + error);
            console.error("Error sending SOL:", error);
        } finally {
            setIsSending(false);
        }
    };    

    return (
        <div className='flex items-center justify-center flex-col gap-5 w-full'>
            <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Send Token</h2>
            </div>
            <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="what-to-send">Select what to send?</label>
                    <select id='what-to-send' className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        onChange={(e) => setSelectedWhatToSend(e.target.value)}>
                        <option value="sol">SOL</option>
                        <option value="token22">Token 22</option>
                    </select>
                </div>
                {selectedWhatToSend === 'token22' &&
                    <div className="w-full">
                        <label className='text-sm text-[#a1a1aa]' htmlFor="tokenList">Select Token</label>
                        <select id='tokenList' className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                            onChange={(e) => setSelectedToken(e.target.value)}>
                            {token22s.length > 0 ? (
                                token22s.map((token) => (
                                    <option key={token.mintAddress} value={token.mintAddress}>
                                        {token.name}
                                    </option>
                                ))
                            ) : (
                                <option>No tokens available</option>
                            )}
                        </select>
                    </div>
                }
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="recipientAddress">Recipient Address</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        id="recipientAddress"
                        placeholder="Solana address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        type='text'
                        required
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="sendAmount">Amount</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        id="sendAmount"
                        type="number"
                        placeholder="Amount to send"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(parseFloat(e.target.value))}
                        max={9}
                        min={1}
                        maxLength={1}
                        required
                    />
                </div>
                <button disabled={isSending|| !selectedWhatToSend || !recipientAddress || !sendAmount} type='submit' onClick={selectedWhatToSend === 'sol' ? sendSol : sendToken} className="flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:w-max md:px-10 mx-auto text-center  disabled:pointer-events-none disabled:opacity-50 transition-all duration-100 ease-out active:scale-95 hover:opacity-90">
                    <Send />{isSending ? (selectedWhatToSend === 'sol' ? 'Sending SOL' : 'Sending Token') : (selectedWhatToSend === 'sol' ? 'Send SOL' : 'Send Token')}
                </button>
            </div>
        </div>
    )
}

export default SendTokenSol;