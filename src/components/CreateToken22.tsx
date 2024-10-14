import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PinataSDK } from "pinata-web3";

import { Plus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Keypair, SystemProgram, Transaction, } from "@solana/web3.js";
import { pack } from '@solana/spl-token-metadata';
import {
    TOKEN_2022_PROGRAM_ID,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    ExtensionType,
    getAssociatedTokenAddressSync,
    createInitializeInstruction
} from "@solana/spl-token"

interface RequestCreateTokenProps {
    onTokenCreateComplete: () => void;
}
const CreateToken22: React.FC<RequestCreateTokenProps> = ({ onTokenCreateComplete }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newToken, setNewToken] = useState(
        {
            name: '',
            symbol: '',
            decimals: 9,
            totalSupply: 1000000,
            description: '',
            image: ''
        })

    const wallet = useWallet()
    const pinata = new PinataSDK({
        pinataJwt: import.meta.env.VITE_PINATA_JWT,
        pinataGateway: import.meta.env.VITE_PINATA_GATEWAY_URL
    })

    const { connection } = useConnection();

    const createUploadMetadata = async (name: string, symbol: string, description: string, image: string) => {
        const metadata = JSON.stringify({
            name,
            symbol,
            description,
            image,
        });

        const metadataFile = new File([metadata], "metadata.json", { type: "application/json" });

        try {
            const result = await pinata.upload.file(metadataFile);
            return result.IpfsHash;

        } catch (error) {
            console.error("Upload failed:", error);
            throw error;
        }
    };

    const createToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wallet.publicKey) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (!newToken.name || !newToken.symbol || !newToken.image || !newToken.decimals || !newToken.totalSupply || !newToken.description) {
            toast.error("Please fill out all the required fields.");
            return;
        }

        try {
            setIsCreating(true);
            const mintKeypair = Keypair.generate();

            let metadataUri = await createUploadMetadata(newToken.name, newToken.symbol, newToken.description, newToken.image);
            if (!metadataUri) {
                metadataUri = import.meta.env.VITE_DEFAULT_METADATA_URI || '';
                if (!metadataUri) {
                    toast.error("Failed to create metadata URI.");
                    throw new Error("Metadata URI creation failed and no fallback provided.");
                }
            }

            metadataUri = `https://${import.meta.env.VITE_PINATA_GATEWAY_URL}/ipfs/${metadataUri}`

            const metadata = {
                mint: mintKeypair.publicKey,
                name: newToken.name,
                symbol: newToken.symbol,
                description: newToken.description,
                uri: metadataUri,
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
                createInitializeMintInstruction(mintKeypair.publicKey, newToken.decimals, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    metadata: mintKeypair.publicKey,
                    updateAuthority: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    mintAuthority: wallet.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                }),
            );

            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);

            await wallet.sendTransaction(transaction, connection);

            toast.success(`Token mint created successfully! Mint address: ${mintKeypair.publicKey.toBase58()}`);
            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
                createMintToInstruction(mintKeypair.publicKey, associatedToken, wallet.publicKey, newToken.totalSupply * Math.pow(10, newToken.decimals), [], TOKEN_2022_PROGRAM_ID)
            );

            await wallet.sendTransaction(transaction2, connection);
            
            toast.success(`Mint Successful! 🎉 ${newToken.totalSupply} ${newToken.symbol} has been successfully minted!`);

            setNewToken({ name: '', symbol: '', decimals: 9, totalSupply: 1000000, description: '', image: '' });
            setIsCreating(false)
            onTokenCreateComplete();
        } catch (error: unknown) {
            setIsCreating(false)
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        }
    }

    return (
        <div className='flex items-center justify-center flex-col gap-5 w-full'>
            <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Create New Token</h2>
            </div>
            <form className='flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4' onSubmit={createToken} >
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenName">Token Name</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        id="tokenName"
                        placeholder="My Awesome Token"
                        value={newToken.name}
                        onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenSymbol">Token Symbol</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        placeholder="MAT"
                        value={newToken.symbol}
                        onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                        required
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenDecimals">Decimals</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        id="tokenDecimals"
                        type="number"
                        placeholder="9"
                        value={newToken.decimals}
                        onChange={(e) => {
                            if (e.target.value.length <= 1 && /^[1-9]?$/.test(e.target.value)) {
                                setNewToken({ ...newToken, decimals: parseInt(e.target.value) });
                            }
                        }}
                        max={9}
                        min={1}
                        required
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenSupply">Total Supply</label>
                    <input
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        id="tokenSupply"
                        type="number"
                        placeholder="100000"
                        value={newToken.totalSupply}
                        onChange={(e) => { setNewToken({ ...newToken, totalSupply: parseInt(e.target.value) }) }}
                        min={1}
                        max={100000}
                        required
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenDescription">Description</label>
                    <textarea
                        id="tokenDescription"
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        placeholder="Describe your token..."
                        value={newToken.description}
                        onChange={(e) => setNewToken({ ...newToken, description: e.target.value })}
                        required
                    />
                </div>
                <div className="w-full">
                    <label className='text-sm text-[#a1a1aa]' htmlFor="tokenImage">Image URL</label>
                    <input
                        id="tokenImage"
                        className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                        type="url"
                        placeholder="https://example.com/token-image.png"
                        value={newToken.image}
                        onChange={(e) => setNewToken({ ...newToken, image: e.target.value })}
                        required
                    />
                </div>
                <button disabled={isCreating || !newToken.name || !newToken.description || !newToken.decimals || !newToken.image || !newToken.symbol || !newToken.totalSupply} type='submit' onClick={createToken} className="flex items-center justify-center gap-1 md:gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] font-bold hover:text-black rounded-lg py-2 w-full md:w-max md:px-10 mx-auto text-center disabled:pointer-events-none disabled:opacity-50 transition-all duration-100 ease-out active:scale-95 hover:opacity-90">
                    <Plus />{isCreating ? 'Creating...' : 'Create Token-22 with Metadata'}
                </button>
            </form>
        </div>
    )
}
export default CreateToken22;