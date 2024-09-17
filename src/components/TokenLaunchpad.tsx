import { useEffect, useState } from 'react'
import { ed25519 } from '@noble/curves/ed25519';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { toast } from 'react-hot-toast'
import { Send, Coins, Plus, Copy, CheckIcon, Eye, EyeOff, Signature } from 'lucide-react'

const staticTokens = [
  {
    address: 'TokenAddress1',
    name: 'Solana Gold',
    symbol: 'SGLD',
    decimals: 9,
    totalSupply: 1000000,
    description: 'A golden token for the Solana ecosystem',
    image: 'https://example.com/solana-gold.png'
  },
  {
    address: 'TokenAddress2',
    name: 'Decentralized Dollar',
    symbol: 'DDOL',
    decimals: 6,
    totalSupply: 10000000,
    description: 'A stable token pegged to the US Dollar',
    image: 'https://example.com/decentralized-dollar.png'
  },
  {
    address: 'TokenAddress3',
    name: 'Crypto Kitty Coin',
    symbol: 'MEOW',
    decimals: 8,
    totalSupply: 5000000,
    description: 'The purr-fect token for cat lovers',
    image: 'https://example.com/crypto-kitty-coin.png'
  }
]

export function TokenLaunchpad() {
  const [message, setMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>()
  const [showWalletBalance, setShowPrivateKey] = useState(false);
  const [walletAddressCopied, setWalletAddressCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('CreateToken')
  const [tokens, setTokens] = useState(staticTokens)
  const [selectedToken, setSelectedToken] = useState<typeof staticTokens[0] | null>(null)
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
  const { publicKey, signMessage } = useWallet();
  // const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const { connection } = useConnection();

  useEffect(() => {
    fetchBalance();
  }, [walletBalance, publicKey])

  const fetchBalance = async () => {
    if (wallet.publicKey) {
      const res = await connection.getBalance(wallet.publicKey);
      setWalletBalance(res / LAMPORTS_PER_SOL);
    }
  }

  const createToken = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      // In a real application, you would create the token on-chain here
      const newTokenData = {
        address: `TokenAddress${tokens.length + 1}`,
        ...newToken
      }
      setTokens([...tokens, newTokenData])
      toast.success('Token created successfully!')
      setNewToken({ name: '', symbol: '', decimals: 9, totalSupply: 1000000, description: '', image: '' })
    } catch (error) {
      console.error('Error creating token:', error)
      toast.error('Failed to create token')
    }
  }

  const sendToken = async () => {
    if (!wallet.publicKey || !selectedToken) {
      toast.error('Please connect your wallet and select a token')
      return
    }

    try {
      toast.success(`Sent ${sendAmount} ${selectedToken.symbol} to ${recipientAddress}`)
      setRecipientAddress('')
      setSendAmount(0)
    } catch (error) {
      console.error('Error sending token:', error)
      toast.error('Failed to send token')
    }
  }

  const requestAirdrop = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
      toast.success('1 SOL airdropped to your wallet!')
    } catch (error) {
      console.error('Error airdropping SOL:', error)
      toast.error('Failed to airdrop SOL')
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
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button onClick={handleSignMessage} className='flex items-center justify-center gap-1 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 h-9 px-4 py-2 text-[#18181b] bg-[#fafafa]'>
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
                <div className="w-full">
                  <label className='text-sm text-[#a1a1aa]' htmlFor="tokenName">Token Name</label>
                  <input
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    id="tokenName"
                    placeholder="My Awesome Token"
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  />
                </div>
                <div className="w-full">
                  <label className='text-sm text-[#a1a1aa]' htmlFor="tokenSymbol">Token Symbol</label>
                  <input
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    placeholder="MAT"
                    value={newToken.symbol}
                    onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                    required
                  />
                </div>
                <div className="w-full">
                  <label className='text-sm text-[#a1a1aa]' htmlFor="tokenDecimals">Decimals</label>
                  <input
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
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
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
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
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
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
                    className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full 
                focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'
                    type="url"
                    placeholder="https://example.com/token-image.png"
                    value={newToken.image}
                    onChange={(e) => setNewToken({ ...newToken, image: e.target.value })}
                    required
                  />
                </div>
                <button type='submit' onClick={createToken} className="flex items-center justify-center gap-1 md:gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] hover:bg-white font-bold hover:text-black rounded-lg py-2 w-full md:w-max md:px-10 mx-auto uppercase text-center">
                  <Plus />Create Token-22 with Metadata
                </button>
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
                      {tokens.map((token) => (
                        <tr key={token.address}
                          className={`cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]
                            ${selectedToken?.address === token.address ? '' : ''}`}
                          onClick={() => setSelectedToken(token)}>
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
                  <select id='tokenList' className='bg-[#09090b] text-[0.875rem] py-2 px-3 border border-[#27272a] rounded w-full focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none'>
                    <option value="">Select Token</option>
                    {tokens.map((token) => (
                      <option key={token.address} value={token.address}>{token.name}</option>
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
                <button type='submit' onClick={sendToken} className="flex items-center justify-center gap-2 border text-sm hover:bg-custom-gradient-none bg-white text-[#18181b] hover:bg-white font-bold hover:text-black rounded-lg py-2 px-[18px] w-full md:w-max md:px-10 mx-auto uppercase text-center">
                  <Send />Send Token
                </button>
              </div>
            </div>}
        </div>
      </div>
    </section>
  )
}