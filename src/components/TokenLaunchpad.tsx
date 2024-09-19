import React, { useEffect, useState } from 'react'
import { ed25519 } from '@noble/curves/ed25519';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { toast } from 'react-hot-toast'
import { Send, Coins, Plus, Copy, CheckIcon, Eye, EyeOff, Signature } from 'lucide-react'
import { UploadClient } from "@uploadcare/upload-client";
import { TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync, getTokenMetadata, createTransferInstruction } from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';

const client = new UploadClient({ publicKey: import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY });

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  description: string;
  image: string;
}
interface Token22 {
  mint: string;
  balance: number;
  name: string;
  symbol: string;
}
export function TokenLaunchpad() {
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>()
  const [showWalletBalance, setShowPrivateKey] = useState(false);
  const [walletAddressCopied, setWalletAddressCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('CreateToken')
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [setToken22s] = useState<Token22[]>([]);
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
    if (publicKey && wallet.publicKey) {
      fetchBalance();
      fetchTokens();
    }
  }, [walletBalance, publicKey])

  const fetchBalance = async () => {
    if (wallet.publicKey) {
      const res = await connection.getBalance(wallet.publicKey);
      setWalletBalance(res / LAMPORTS_PER_SOL);
    }
  }

  const fetchTokens = async () => {
    if (!publicKey) {
      console.error('No public key available.');
      return;
    }

    const tokenMint22 = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID });
    const userTokens22 = await Promise.all(tokenMint22.value.map(async (account) => {
      const mint = account.account.data.parsed.info.mint;
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount;

      const metadata = await getTokenMetadata(connection, new PublicKey(mint), 'confirmed', TOKEN_2022_PROGRAM_ID);
      if (metadata) {
        return {
          mint,
          balance,
          name: metadata.name || "Unknown Token-22",
          symbol: metadata.symbol || "Coin"
        };
      } else {
        return {
          mint,
          balance,
          name: "Unknown Token-22",
          symbol: "Coin"
        };
      }
    }));

    setToken22s(userTokens22);
  };

  const sendToken = async () => {
    if (!publicKey || !wallet.publicKey || !selectedToken) {
      toast.error('Please connect your wallet and select a token')
      return
    }

    try {
      const sourceTokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey, { programId: TOKEN_2022_PROGRAM_ID }
      );

      if (sourceTokenAccounts.value.length === 0) {
        toast.error('No Token-22 account found for the wallet')
        return;
      }
      const sourceTokenAccount = sourceTokenAccounts.value[0].pubkey;

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
        await sendTransaction(transaction, connection);
      } else {
        destinationTokenAccountPubkey = destinationTokenAccount.value[0].pubkey;
      }

      const transferInstruction = createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccountPubkey,
        publicKey,
        LAMPORTS_PER_SOL * Math.pow(10, 9),
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
        const response = await fetch('/api/requestAirdrop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            publicKey: wallet.publicKey.toString(),
          })
        });
        const responseData = await response.json();
        if (response.ok) {
          toast.success('Airdrop Request Successful');
        } else {
          toast.error(`Failed to request airdrop: ${responseData.error || 'Unknown Error'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error requesting airdrop');
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

      const isValid = ed25519.verify(signature, encodedMessage, publicKey.toBytes());
      if (!isValid) throw new Error('Message signature invalid!');
      toast.success("Message signed!");
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

      setTokens(prevTokens => [...prevTokens, newToken]);
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
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 
                    focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
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
              <button onClick={requestAirdrop} className="transition-transform transform active:scale-95 flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] hover:bg-white font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:w-max md:px-10 uppercase text-center">
                <Coins className="mr-2 h-4 w-4" /> Airdrop 1 SOL
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl border border-[#434348] p-2 md:p-5 w-full">
          <div className="max-w-full md:w-max mx-auto text-center text-sm md:text-base text-white font-semibold rounded-md flex items-center justify-center
        overflow-hidden border border-[#434348]">
            <div onClick={() => setActiveTab('CreateToken')} className={`${activeTab === 'CreateToken' ? 'bg-transparent' : ''} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 bg-white/30 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Create Token</div>
            <div onClick={() => setActiveTab('TokenList')} className={`${activeTab === 'TokenList' ? 'bg-transparent' : ''} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 bg-white/30 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Manage Tokens</div>
            <div onClick={() => setActiveTab('ShareToken')} className={`${activeTab === 'ShareToken' ? 'bg-transparent' : ''} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 bg-white/30 backdrop-blur-lg backdrop-saturate-150 shadow-lg`}>Send Tokens</div>
          </div>
          <div className="border-t border-[#434348] my-5"></div>

          {activeTab && activeTab === 'CreateToken' &&
            <div className='flex items-center justify-center flex-col gap-5 w-full'>
              <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Create New Token</h2>
              </div>
              <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <form onSubmit={createToken} >
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
              </div>
            </div>}
          {activeTab && activeTab === 'TokenList' &&
            <div className='flex items-center justify-center flex-col gap-5 w-full'>
              <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Token List</h2>
              </div>
              <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <div className="w-full overflow-scroll md:overflow-auto md:max-w-7xl mx-auto p-5">
                  <table className="w-full text-sm text-left text-white">
                    <thead className="text-xs text-white uppercase bg-white/30">
                      <tr>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Token</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Symbol</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Total Supply</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Decimals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token: TokenData) => (
                        <tr key={token.name}
                          className='cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]'>
                          <td className="p-3 md:px-6 md:py-4">
                            <div className="flex items-center space-x-4">
                              <img src={token.image} alt={token.name} className="h-12 w-12 rounded-full" />
                              <span className="font-bold">{token.name}</span>
                            </div>
                          </td>
                          <td className="p-3 md:px-6 md:py-4">{token.symbol}</td>
                          <td className="p-3 md:px-6 md:py-4">{token.totalSupply.toLocaleString()}</td>
                          <td className="p-3 md:px-6 md:py-4">{token.decimals}</td>
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
                  <select id='tokenList' className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    onChange={(e) => setSelectedToken(e.target.value)}>
                    <option value="">Select Token</option>
                    {tokens.map((token) => (
                      <option key={token.name} value={token.name}>{token.name}</option>
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