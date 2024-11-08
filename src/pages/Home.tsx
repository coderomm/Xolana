import { useEffect, useState } from 'react'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from 'sonner'
import { Buffer } from "buffer";

import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getTokenMetadata } from "@solana/spl-token"
import { ExternalLink } from 'lucide-react';
import CreateToken22 from '../components/CreateToken22';
import SendTokenSol from '../components/SendTokenSol';
import WalletInfo from '../components/WalletInfo';

window.Buffer = Buffer;
window.process = process;
window.Crypto = Crypto;

interface Token22 {
  mintAddress: string;
  balance: number;
  name: string;
  symbol: string;
  image: string;
}

export function Home() {
  const [activeTab, setActiveTab] = useState('CreateToken22')
  const [token22s, setToken22s] = useState<Token22[]>([]);

  const wallet = useWallet()
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (publicKey && wallet.publicKey) {
      fetchTokens();
    }
  }, [publicKey])

  const fetchTokens = async () => {
    if (!wallet.publicKey) return;
    try {
      const tokenMint22 = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_2022_PROGRAM_ID });
      const userTokens22 = await Promise.all(tokenMint22.value.map(async (account) => {
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
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  }

  const handleTokenCreateComplete = () => {
    fetchTokens()
  };

  return (
    <section className="container mx-auto p-4 md:max-w-6xl">
      <h1 className="text-xl md:text-4xl font-bold mb-2 text-center">Decentralized Application (DApp) </h1>
      <p className="text-gray-300 mb-6 text-center text-[15px]">Built on the Solana blockchain, designed for token management & crypto wallet integration.</p>
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
      <div className="flex flex-col items-center xl:items-start xl:flex-row gap-10 md:gap-10">
        <WalletInfo />
        <div className="flex flex-col rounded-2xl border border-[#434348] p-2 xl:p-5 max-w-3xl xl:max-w-full w-full xl:w-1/2">
          <div className="max-w-full md:w-max mx-auto text-center text-sm md:text-base text-white font-semibold rounded-md flex items-center justify-center overflow-hidden border border-[#434348]">
            <div onClick={() => setActiveTab('CreateToken22')} className={`${activeTab === 'CreateToken22' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Create Token</div>
            <div onClick={() => setActiveTab('TokenList')} className={`${activeTab === 'TokenList' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border-r border-[#434348]`}>Manage Tokens</div>
            <div onClick={() => setActiveTab('ShareToken')} className={`${activeTab === 'ShareToken' ? 'bg-transparent' : 'bg-white/30'} cursor-pointer transition-transform transform active:scale-95 hover:bg-transparent px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg`}>Send Tokens</div>
          </div>
          <div className="border-t border-[#434348] my-5"></div>

          {activeTab && activeTab === 'CreateToken22' && <CreateToken22 onTokenCreateComplete={handleTokenCreateComplete} />}
          {activeTab && activeTab === 'TokenList' &&
            <div className='flex items-center justify-center flex-col gap-5 w-full'>
              <div className='flex items-center justify-center flex-col'>
                <h2 className='text-center text-2xl md:text-3xl'>Token List</h2>
              </div>
              <div className="flex items-start justify-start gap-5 flex-col w-full p-2 md:px-4">
                <div className="w-full overflow-auto md:overflow-auto md:max-w-7xl mx-auto md:p-5">
                  <table className="w-full text-sm text-left text-white">
                    <thead className="text-xs text-white uppercase bg-white/30">
                      <tr>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Token</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Name</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Symbol</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">Balance</th>
                        <th scope="col" className="p-4 md:px-6 md:py-3">View More</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!wallet.connected &&
                        <tr className='cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]'>
                          <td className="p-3 md:px-6 md:py-4 text-center" colSpan={4}>Please connect your wallet first.</td>
                        </tr>
                      }
                      {wallet.publicKey && token22s.length > 0 ? token22s.map((token) => (
                        <tr key={token.name}
                          className='cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]'>
                          <td className="p-2 md:p-3">
                            <img src={token.image} alt={token.name} className="w-full h-full rounded-md" />
                          </td>
                          <td className="p-3 md:px-6 md:py-4">
                            <span className="font-bold">{token.name}</span>
                          </td>
                          <td className="p-3 md:px-6 md:py-4">
                            {token.symbol}
                          </td>
                          <td className="p-3 md:px-6 md:py-4">{token.balance}</td>
                          <td className="p-3 md:px-6 md:py-4">
                            <a href={`https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`} target='_blank'>
                              <ExternalLink />
                            </a>
                          </td>
                        </tr>
                      )) : (
                        <tr className='cursor-pointer transition-transform duration-300 ease-out transform active:scale-95 hover:scale-95 bg-transparent border-b border-[#434348]'>
                          <td className="p-3 md:px-6 md:py-4 text-center" colSpan={4}>No tokens available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}
          {activeTab && activeTab === 'ShareToken' && <SendTokenSol token22s={token22s} />}
        </div>
      </div>
    </section >
  )
}