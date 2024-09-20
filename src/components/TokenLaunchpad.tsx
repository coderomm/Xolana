import React, { useEffect, useState } from 'react'
import { ed25519 } from '@noble/curves/ed25519';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { toast } from 'sonner'
import { Send, Coins, Plus, Copy, CheckIcon, Eye, EyeOff, Signature } from 'lucide-react'
import { UploadClient } from "@uploadcare/upload-client";
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
  getTokenMetadata,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createTransferInstruction
} from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { Buffer } from "buffer";
import axios, { AxiosError } from 'axios';

window.Buffer = Buffer;
window.process = process;
window.Crypto = Crypto;
const client = new UploadClient({ publicKey: import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY });

// interface TokenData {
//   name: string;
//   symbol: string;
//   decimals: number;
//   totalSupply: number;
//   description: string;
//   image: string;
// }
interface Token22 {
  mintAddress: string;
  balance: number;
  name: string;
  symbol: string;
  image: string;
}

export function TokenLaunchpad() {
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>()
  const [showWalletBalance, setShowPrivateKey] = useState(false);
  const [walletAddressCopied, setWalletAddressCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('CreateToken')
  // const [setTokens] = useState<TokenData[]>([]);
  const [token22s, setToken22s] = useState<Token22[]>([]);
  const [selectedToken, setSelectedToken] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [sendAmount, setSendAmount] = useState(0)
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
  const { publicKey, signMessage, sendTransaction } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (token22s.length > 0) {
      setSelectedToken(token22s[0].mintAddress);
    }
  }, [token22s]);

  useEffect(() => {
    if (publicKey && wallet.publicKey) {
      const fetchBalance = async () => {
        if (wallet.publicKey) {
          const res = await connection.getBalance(wallet.publicKey);
          setWalletBalance(res / LAMPORTS_PER_SOL);
        }
      }

      const fetchTokens = async () => {
        if (!wallet.publicKey) return;
        try {
          // setIsFetching(true)
          const tokenMint22 = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_2022_PROGRAM_ID });
          const userTokens22 = await Promise.all(tokenMint22.value.map(async (account) => {
            // console.log('account:', account)
            const mintAddress = account.account.data.parsed.info.mint;
            const balance = account.account.data.parsed.info.tokenAmount.uiAmount;

            const metadata = await getTokenMetadata(connection, new PublicKey(mintAddress), 'confirmed', TOKEN_2022_PROGRAM_ID);
            let imageUrl = '';
            if (metadata) {
              const responce = await fetch(metadata.uri, { method: 'GET' });
              const data = await responce.json()
              imageUrl = data.image;
            }

            return {
              mintAddress,
              balance,
              name: metadata?.name || "Unknown Token-22",
              symbol: metadata?.symbol || "UNK",
              image: imageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg600Xa4ws6jp54kMDNGYF232lIhY51QJqEA&s',
            };
          }));

          setToken22s(userTokens22);
          console.log('token22s:', token22s)
          // setIsFetching(false)
        } catch (error) {
          if (error instanceof Error) {
            toast.error(error.message);
          } else {
            toast.error("An unexpected error occurred.");
          }
        }
      }

      fetchBalance();
      fetchTokens();
    }
  }, [wallet, connection])

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

      // Assuming the first account is the desired one
      const tokenAccountPubKey = data.result.value[0].pubkey;
      console.log('Token Account Public Key:', tokenAccountPubKey);

      // Use this public key for further processing, e.g., initiating a transfer
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
      // Fetch the user's token accounts
      console.log('selectedToken:', selectedToken)
      const sourceTokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey, { programId: TOKEN_2022_PROGRAM_ID }
      );

      // Check if the user has any token accounts
      if (sourceTokenAccounts.value.length === 0) {
        toast.error('No Token-22 account found for the wallet');
        return;
      }

      console.log('selectedToken:', selectedToken)

      const selectedTokenAccountPubkey = await fetchTokenAccountPublicKey(wallet.publicKey.toString(), selectedToken);
      const publicKeyObject = new PublicKey(selectedTokenAccountPubkey);

      if (!selectedTokenAccountPubkey) {
        toast.error('No matching token account found for the selected token.');
        return;
      }
      const sourceTokenAccountPubkey = publicKeyObject;
      const destinationWallet = new PublicKey(recipientAddress);
      const mint = new PublicKey(selectedToken);

      // const sourceTokenAccount = sourceTokenAccounts.value[0].pubkey;

      const destinationTokenAccount = await connection.getTokenAccountsByOwner(destinationWallet, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      let destinationTokenAccountPubkey;
      if (destinationTokenAccount.value.length === 0) {
        // Create an associated token account for the recipient if they don't have one
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
        await sendTransaction(transaction, connection);
      } else {
        destinationTokenAccountPubkey = destinationTokenAccount.value[0].pubkey;
      }

      const tokenDecimals = 9; // Adjust this based on your selected token's decimal precision (you can fetch it from token metadata)
      const transferAmount = sendAmount * Math.pow(10, tokenDecimals); // Convert amount to smallest unit

      // Prepare transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceTokenAccountPubkey,
        new PublicKey(destinationTokenAccountPubkey),
        publicKey,
        transferAmount, // Send the correct amount based on the token decimals
        [],
        TOKEN_2022_PROGRAM_ID
      );

      const transaction = new Transaction().add(transferInstruction);
      const latestBlockHash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockHash.blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      toast.success(`Transaction is Successful! ${signature}`);
      setNewToken({ name: '', symbol: '', decimals: 9, totalSupply: 1000000, description: '', image: '' });
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

    // try {
    //   const transaction = new Transaction();
    //   transaction.add(SystemProgram.transfer({
    //     fromPubkey: wallet.publicKey,
    //     toPubkey: new PublicKey(recipientAddress),
    //     lamports: sendAmount * LAMPORTS_PER_SOL,
    //   }));

    //   await wallet.sendTransaction(transaction, connection);
    //   toast.success(`Sent ${sendAmount} SOL to ${recipientAddress}`)
    //   setSelectedToken('')
    //   setRecipientAddress('')
    //   setSendAmount(0)
    // } catch (error) {
    //   console.error('Error sending token:', error)
    //   toast.error('Failed to send token')
    // }
  }
  const requestAirdrop = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet')
      return
    }
    if (import.meta.env.VITE_API_CHOICE === '0') {
      try {
        await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
        toast.success('1 SOL airdropped to your wallet!')
      } catch (error) {
        console.error('Error airdropping SOL:', error)
        toast.error('Failed to airdrop SOL')
      }
    } else if (import.meta.env.VITE_API_CHOICE === '1') {
      try {
        const response = await axios.post('http://localhost:5000/request-airdrop', {
          publicKey
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          toast.success('Airdrop successful!');
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
      }
    }
  }

  const toggleWalletAddressVisibility = () => {
    setShowPrivateKey(!showWalletBalance);
  }

  const handleSignMessage = async () => {
    if (!publicKey) throw new Error('Wallet not connected!');
    if (!signMessage) throw new Error('Wallet does not support message signing!');

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      if (!ed25519.verify(signature, encodedMessage, publicKey.toBytes())) throw new Error('Message signature invalid!');
      toast.success("Message signed!");
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      toast.error("Signing failed!");
      console.error('Signing failed!', error)
      return;
    }
  };

  const handleCopyWalletAddress = () => {
    navigator.clipboard.writeText(publicKey?.toString() ?? '');
    setWalletAddressCopied(true)
    setTimeout(() => setWalletAddressCopied(false), 2000)
    toast.success('Wallet address copied.')
  }

  const createUploadMetadata = async (name: string, symbol: string, description: string, image: string) => {
    const metadata = JSON.stringify({
      name,
      symbol,
      description,
      image,
    });

    const metadataFile = new File([metadata], "metadata.json", { type: "application/json" });

    try {
      const result = await client.uploadFile(metadataFile);
      return result.cdnUrl;
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
        metadataUri = import.meta.env.VITE_DEFAULT_URI || '';
        if (!metadataUri) {
          toast.error("Failed to create metadata URI.");
          throw new Error("Metadata URI creation failed and no fallback provided.");
        }
      }

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

      toast.success(`Token mint created at ${mintKeypair.publicKey.toBase58()}`)
      const associatedToken = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      toast.success(associatedToken.toBase58())

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

      // setTokens(prevTokens => [...prevTokens, newToken]);
      setNewToken({ name: '', symbol: '', decimals: 9, totalSupply: 1000000, description: '', image: '' });
      setIsCreating(false)
      toast.success("Token is created Successfully!")
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
    <section className="container mx-auto p-4 md:max-w-6xl">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center">Solana Token Launchpad</h1>
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
      <div className="flex flex-col md:flex-row gap-2 md:gap-10">
        <div className="flex flex-col rounded-2xl border border-[#434348] p-2 md:p-5 w-full h-max">
          <div className="flex items-center justify-center">
            <h2 className='text-center text-2xl md:text-3xl'>Wallet</h2>
          </div>
          <div className="border-t border-[#434348] my-5"></div>
          <div className='flex items-center justify-center flex-col gap-5 w-full'>
            <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-10">
              <div onClick={handleCopyWalletAddress}
                className="flex items-center justify-between bg-[#09090b] text-[0.875rem] py-2 px-3 md:p-4 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none">
                <span className='text-sm font-medium truncate mr-2 cursor-pointer'>{wallet.publicKey?.toString()}</span>
                <button>
                  {walletAddressCopied ? (
                    <CheckIcon />
                  ) : (
                    <Copy />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#09090b] text-[0.875rem] py-2 px-3 md:py-2 md:px-4 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none">
                <span className="text-sm font-medium">Balance: {showWalletBalance ? walletBalance : '••••••••••••••'}</span>
                <div onClick={toggleWalletAddressVisibility} className="flex items-center">
                  <button>{showWalletBalance ? <Eye /> : <EyeOff />}</button>
                </div>
              </div>
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
                  <button disabled={!message || !wallet.connected} onClick={handleSignMessage} className='flex items-center justify-center gap-1 rounded-md font-medium text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 h-9 px-4 py-2 text-[#18181b] bg-[#fafafa] transition-all duration-100 ease-out active:scale-95 hover:opacity-90'>
                    <Signature />Sign</button>
                </div>
              </div>
              <button onClick={requestAirdrop} className="transition-transform transform active:scale-95 flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] hover:opacity-95 font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:px-10 uppercase text-center">
                <Coins className="mr-2 h-4 w-4" /> Airdrop 1 SOL
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl border border-[#434348] p-2 md:p-5 w-full">
          <div className="max-w-full md:w-max mx-auto text-center text-sm md:text-base text-white font-semibold rounded-md flex items-center justify-center
        overflow-hidden border border-[#434348]">
            <div onClick={() => setActiveTab('CreateToken')} className={`${activeTab === 'CreateToken' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Create Token</div>
            <div onClick={() => setActiveTab('TokenList')} className={`${activeTab === 'TokenList' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Manage Tokens</div>
            <div onClick={() => setActiveTab('ShareToken')} className={`${activeTab === 'ShareToken' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg`}>Send Tokens</div>
          </div>
          <div className="border-t border-[#434348] my-5"></div>

          {activeTab && activeTab === 'CreateToken' &&
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
                    onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                    max={9}
                    min={1}
                    maxLength={1}
                    required
                  />
                </div>
                <div className="w-full">
                  <label className='text-sm text-[#a1a1aa]' htmlFor="tokenSupply">Total Supply</label>
                  <input
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    id="tokenSupply"
                    type="number"
                    placeholder="1000000"
                    value={newToken.totalSupply}
                    onChange={(e) => setNewToken({ ...newToken, totalSupply: parseInt(e.target.value) })}
                    min={1}
                    max={1000}
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
                <button disabled={!newToken.name || !newToken.description || !newToken.decimals || !newToken.image || !newToken.symbol || !newToken.totalSupply} type='submit' onClick={createToken} className="flex items-center justify-center gap-1 md:gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] font-bold hover:text-black rounded-lg py-2 w-full md:w-max md:px-10 mx-auto uppercase text-center disabled:pointer-events-none disabled:opacity-50 transition-all duration-100 ease-out active:scale-95 hover:opacity-90">
                  <Plus />{isCreating ? 'Creating Token-22 with Metadata' : 'Create Token-22 with Metadata'}
                </button>
              </form>
            </div>}
          {activeTab && activeTab === 'TokenList' &&
            <div className='flex items-center justify-center flex-col gap-5 w-full'>
              <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Token List</h2>
              </div>
              <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <div className="w-full overflow-scroll md:overflow-auto md:max-w-7xl mx-auto md:p-5">
                  <table className="w-full text-sm text-left text-white">
                    <thead className="text-xs text-white uppercase bg-white/30">
                      <tr>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Token</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Name</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Symbol</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {token22s.map((token) => (
                        <tr key={token.name}
                          className='cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]'>
                          <td className="p-3 md:px-6 md:py-4">
                            <img src={token.image} alt={token.name} className="h-12 w-12 rounded-full" />
                          </td>
                          <td className="p-3 md:px-6 md:py-4">
                            <span className="font-bold">{token.name}</span>
                          </td>
                          <td className="p-3 md:px-6 md:py-4">{token.symbol}</td>
                          <td className="p-3 md:px-6 md:py-4">{token.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}
          {activeTab && activeTab === 'ShareToken' &&
            <div className='flex items-center justify-center flex-col gap-5 w-full'>
              <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Send Token</h2>
              </div>
              <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <div className="w-full">
                  <label className='text-sm text-[#a1a1aa]' htmlFor="tokenList">Select Token</label>
                  <select data-selec={selectedToken} id='tokenList' className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    onChange={(e) => setSelectedToken(e.target.value)}>
                    {token22s.map((token) => (
                      <option key={token.name} value={token.mintAddress}>{token.name} ({token.mintAddress})</option>
                    ))}
                  </select>
                </div>
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
                <button disabled={!selectedToken || !recipientAddress || !sendAmount} type='submit' onClick={sendToken} className="flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:w-max md:px-10 mx-auto uppercase text-center  disabled:pointer-events-none disabled:opacity-50 transition-all duration-100 ease-out active:scale-95 hover:opacity-90">
                  <Send />{isSending ? 'Sending Token' : 'Send Token'}
                </button>
              </div>
            </div>}
        </div>
      </div>
    </section>
  )
}