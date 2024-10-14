import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { ArrowUpDown, ChevronDown, ChevronUp, CircleX, RefreshCw, Settings, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

window.Buffer = Buffer;
window.process = process;
window.Crypto = Crypto;

interface UserToken {
    mintAddress: string;
    name: string;
    symbol: string;
    image: string;
    decimals: number;
    balance: number;
}

enum SlippageType { 'Dynamic', 'Fixed' }

const Swap = () => {
    const [userTokens, setUserTokens] = useState<UserToken[]>([]);
    const [jupiterTokens, setJupiterTokens] = useState<UserToken[]>([]);
    const [combinedTokens, setCombinedTokens] = useState<UserToken[]>([]);
    const [selectedTokenToSell, setSelectedTokenToSell] = useState<UserToken>(userTokens[0] || {
        name: "Wrapped SOL",
        symbol: "SOL",
        mintAddress: "So11111111111111111111111111111111111111112",
        balance: 0,
        image: 'https://coin-images.coingecko.com/coins/images/21629/large/solana.jpg',
        decimals: 9
    });
    const [selectedTokenToBuy, setSelectedTokenToBuy] = useState<UserToken>(jupiterTokens[0] || {
        name: "",
        symbol: "",
        mintAddress: "",
        image: "",
        decimals: 0,
        balance: 0
    });
    const [outAmount, setOutAmount] = useState('')
    const [otherAmountThreshold, setOtherAmountThreshold] = useState('')
    const [slippageTab, setSlippageTab] = useState<SlippageType>(SlippageType.Dynamic);
    const [slippageType, setSlippageType] = useState<SlippageType>(SlippageType.Dynamic);
    const [slippageAmt, setSlippageAmt] = useState<number>(0)
    const [dynamicSlippageAmt, setDynamicSlippageAmt] = useState<number>(3)
    const [fixedSlippageAmt, setFixedSlippageAmt] = useState<number>(1)
    const [isCustomFixedSlippage, setIsCustomFixedSlippage] = useState<boolean>(false)
    const [sellingSearchTerm, setSellingSearchTerm] = useState('');
    const [buyingSearchTerm, setBuyingSearchTerm] = useState('')
    const [isSlippageOpen, setIsSlippageOpen] = useState(false);
    const [isSellingOpen, setIsSellingOpen] = useState(false);
    const [isBuyingOpen, setIsBuyingOpen] = useState(false);
    const [sellingAmount, setSellingAmount] = useState<number>(0)
    const [isComingSoon, setIsComingSoon] = useState(false);
    const wallet = useWallet()

    const connection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_RPC}`
    );

    const { publicKey } = useWallet();
    // const { connection } = useConnection();

    useEffect(() => {
        fetchJupiterTokens();
        if (wallet.connected && wallet.publicKey) {
            fetchUserTokens();
        }
    }, [wallet.publicKey, publicKey, wallet.connected]);

    useEffect(() => {
        if (
            !isNaN(sellingAmount) &&
            sellingAmount > 0 &&
            slippageAmt >= 0 &&
            (slippageType === SlippageType.Dynamic || slippageType === SlippageType.Fixed)
        ) {
            fetchQuoteResponse()
            const interval = setInterval(() => fetchQuoteResponse(), 30000);
            return () => clearInterval(interval);
        }
    }, [sellingAmount, slippageType, slippageAmt, wallet.publicKey]);

    const filteredSellingItems = useMemo(() => {
        return combinedTokens.filter((item) =>
            item.name.toLowerCase().includes(sellingSearchTerm.toLowerCase())
        );
    }, [sellingSearchTerm, combinedTokens])

    const filteredBuyingItems = useMemo(() => {
        return jupiterTokens.filter((item) =>
            item.name.toLowerCase().includes(buyingSearchTerm.toLowerCase())
        );
    }, [buyingSearchTerm, jupiterTokens])

    const fetchJupiterTokens = useCallback(async () => {
        // if (!wallet.publicKey) {
        //     toast.info('Please connect wallet!')
        //     return;
        // };
        try {
            const { data } = await axios.get('https://tokens.jup.ag/tokens?tags=verified');
            const tokens: UserToken[] = data.map((token: { address: string, name: string, symbol: string, logoURI: string, decimals: number }) => ({
                mintAddress: token.address,
                name: token.name,
                symbol: token.symbol,
                image: token.logoURI,
                decimals: token.decimals,
                balance: 0,
            }));
            setJupiterTokens(tokens);
            if (tokens.length > 0) {
                setSelectedTokenToSell(tokens[0]);
                setSelectedTokenToBuy(tokens[1] || tokens[0]);
            }
        } catch (error) {
            console.error("Failed to fetch Solana tokens", error);
        }
    }, [wallet.publicKey]);

    const fetchUserTokens = async () => {
        if (!wallet.publicKey) {
            console.error("Wallet is not connected");
            return [];
        }
        console.log("Fetching user tokens and SOL balance from wallet...");
        try {
            const solBalanceLamports = await connection.getBalance(wallet.publicKey);
            const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
            // setWalletBalance(solBalance)
            const fetchTokens = async (programId: PublicKey) => {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey as PublicKey, { programId });
                return tokenAccounts.value.map((account) => {
                    const mintAddress = account.account.data.parsed.info.mint;
                    const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
                    const decimals = account.account.data.parsed.info.tokenAmount.decimals;
                    return { mintAddress, balance, decimals, };
                });
            };

            const splTokens = await fetchTokens(TOKEN_PROGRAM_ID);
            const token22Tokens = await fetchTokens(TOKEN_2022_PROGRAM_ID);
            const allTokens = [...splTokens, ...token22Tokens];

            const updatedUserTokens = jupiterTokens.map((jToken) => {
                const userToken = allTokens.find((uToken) => uToken.mintAddress === jToken.mintAddress);
                if (userToken) {
                    return { ...jToken, balance: userToken.balance };
                }
                return { ...jToken, balance: 0 };
            });
            const isSolIncluded = jupiterTokens.some((token) => token.symbol === 'SOL');
            if (!isSolIncluded) {
                const solToken = {
                    mintAddress: "So11111111111111111111111111111111111111112",
                    name: "Solana",
                    symbol: "SOL",
                    image: 'https://coin-images.coingecko.com/coins/images/21629/large/solana.jpg',
                    decimals: 9,
                    balance: solBalance,
                };
                updatedUserTokens.unshift(solToken);
            }

            setUserTokens(updatedUserTokens);
            if (updatedUserTokens.length > 0) {
                setSelectedTokenToSell(updatedUserTokens[0]);
            }
        } catch (error) {
            console.error('Error fetching user tokens:', error);
        }
    };

    useEffect(() => {
        const mergedTokens = jupiterTokens.map((token) => {
            const userToken = userTokens.find((uToken) => uToken.mintAddress === token.mintAddress);
            return userToken ? { ...token, balance: userToken.balance } : token;
        });
        setCombinedTokens(mergedTokens);
    }, [userTokens, jupiterTokens]);

    const handleAmountClick = (type: 'HALF' | 'MAX') => {
        if (selectedTokenToSell.balance > 0) {
            const amount = type === 'HALF' ? selectedTokenToSell.balance / 2 : selectedTokenToSell.balance;
            setSellingAmount(amount);
        } else {
            toast.error('Insufficient balance for the selected token.');
        }
    };

    const isTokenAvailableForSwap = useMemo(() => {
        return selectedTokenToSell.balance > 0;
    }, [selectedTokenToSell]);

    const handleFixSlippageAmt = (amt: number) => {
        setIsCustomFixedSlippage(false)
        setSlippageType(SlippageType.Fixed);
        setFixedSlippageAmt(amt)
        setSlippageAmt(amt)
    }

    const handleCustomFixSlippageAmt = () => {
        setIsCustomFixedSlippage(true)
        setSlippageType(SlippageType.Fixed);
    }

    const handleSlippageSubmit = (slippageType: SlippageType) => {
        if (slippageType === SlippageType.Dynamic) {
            setDynamicSlippageAmt(dynamicSlippageAmt);
            setSlippageAmt(dynamicSlippageAmt)
            toast.info(`Slippage Type: Dynamic - ${dynamicSlippageAmt}%`);
        } else if (slippageType === SlippageType.Fixed) {
            setFixedSlippageAmt(fixedSlippageAmt);
            setSlippageAmt(fixedSlippageAmt)
            toast.info(`Slippage Type: Fixed - ${fixedSlippageAmt}%`);
        } else {
            toast.error('Error in setting slippage type');
        }
    };

    const hancalculateOutAmts = (amt: number) => {
        const outAmountNumber = Number(amt) / Math.pow(10, selectedTokenToBuy.decimals);
        return outAmountNumber;
    }

    const fetchQuoteResponse = async (swapMode: string = 'ExactIn', isReturn: boolean = false) => {
        if (selectedTokenToBuy.mintAddress === selectedTokenToSell.mintAddress) {
            toast.error('Both tokens to swap can not be same.')
            return;
        }
        if (slippageType !== SlippageType.Dynamic && slippageType !== SlippageType.Fixed) {
            toast.error('Error in setting slippage type');
            return;
        }
        if (sellingAmount <= 0) {
            // toast.error('Please enter a valid amount to sell.');
            return;
        }
        const slippageBps = slippageType === SlippageType.Dynamic ? dynamicSlippageAmt * 100 : fixedSlippageAmt * 100;
        let response;
        try {
            const apiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${selectedTokenToSell.mintAddress}&outputMint=${selectedTokenToBuy.mintAddress}&amount=${sellingAmount * LAMPORTS_PER_SOL}&swapMode=${swapMode}&slippageBps=${slippageBps}`;
            if (slippageType === SlippageType.Dynamic) {
                response = await axios.get(apiUrl);
            } else {
                response = await axios.get(`${apiUrl}&computeAutoSlippage=true`);
            }

            if (response && response.data) {
                const quoteResponse = response.data;
                const resultOutAmount = hancalculateOutAmts(quoteResponse.outAmount)
                setOutAmount(resultOutAmount.toString());
                const resulTotherAmountThreshold = hancalculateOutAmts(quoteResponse.otherAmountThreshold)
                setOtherAmountThreshold(resulTotherAmountThreshold.toString());
                if (isReturn === true) {
                    return quoteResponse;
                }
            }
        } catch (error) {
            console.error('Error fetching quote:', error);
            toast.error('Failed to fetch quote.');
        }
    }

    const isTokenAvailableInWallet = selectedTokenToSell.balance > 0;

    const handleSwapSubmit = async () => {
        if (!selectedTokenToSell || !selectedTokenToBuy || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please select valid tokens and connect wallet.');
            return;
        }

        if (selectedTokenToSell.balance <= 0) {
            toast.error('Insufficient balance to perform the swap.');
            return;
        }
        try {
            const quoteResponse = await fetchQuoteResponse('', true)

            const { data: { swapTransaction } } = (
                await axios.post('https://quote-api.jup.ag/v6/swap', {
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            );

            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            const signedTransaction = await wallet.signTransaction(transaction);
            const rawTransaction = signedTransaction.serialize();

            const txid = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 2,
            });

            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txid
            }, 'confirmed');

            toast.success(`Transaction successful: https://solscan.io/tx/${txid}`);
        } catch (error) {
            toast.error('Error signing or sending the transaction');
            console.error('Error signing or sending the transaction:', error);
        }
    }

    const handleSellingInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue = parseInt(e.target.value)
        if (!isNaN(parsedValue) && parsedValue > 0) {
            setSellingAmount(parsedValue)
            // setTimeout(() => {
            //     fetchQuoteResponse();
            // }, 300);
        } else {
            setSellingAmount(0);
            setOutAmount('');
        }
    }

    // const handleBuyingInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const parsedValue = parseInt(e.target.value)
    //     if (!isNaN(parsedValue) && parsedValue > 0) {
    //         setSellingAmount(parsedValue)
    //         setTimeout(() => {
    //             fetchQuoteResponse('ExactOut')
    //         }, 300);
    //     }
    // }

    const handleSwapSelection = () => {
        const tempSellToken = selectedTokenToSell;
        setSelectedTokenToSell(selectedTokenToBuy);
        setSelectedTokenToBuy(tempSellToken);
    };

    const handleRefreshQuote = () => {
        toast.info('Feature coming soon...')
        setIsComingSoon(true)
        setTimeout(() => setIsComingSoon(false), 10000)
    }

    return (
        <>
            <section className="container mx-auto py-4 px-1 md:px-4 md:max-w-6xl relative">
                <h1 className="text-xl md:text-3xl font-bold mb-6 text-center hidden md:block">Solana Swap Hub – Trade Crypto Effortlessly</h1>
                <h1 className="text-xl md:text-3xl font-bold mb-6 text-center block md:hidden">Solana Swap Hub – <br/> Trade Crypto Effortlessly</h1>
                {/* <p className="text-gray-300 mb-6 text-center text-[15px]"></p> */}
                <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-60 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
                <form className='flex flex-col gap-5 p-2 md:px-4 w-full max-w-full md:w-1/2 mx-auto'>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center justify-start gap-2">Slippage Settings:
                            <button type="button" onClick={() => setIsSlippageOpen(!isSlippageOpen)}
                                className="rounded-full bg-white/30 hover:scale-95 transition-transform duration-100 ease-linear text-sm py-[2px] px-3 text-white flex items-center justify-start gap-1">
                                <Settings className="w-4" /> {slippageType === SlippageType.Dynamic ? 'Dynamic' : 'Fixed'}
                            </button>
                            <div onClick={() => setIsSlippageOpen(false)} className={`${isSlippageOpen ? 'flex' : 'hidden'} fixed inset-0 bg-black/50 z-10 top-0 right-0 bottom-0 left-0 w-full h-full filter backdrop-blur-sm`}>
                            </div>
                            <div className={`${isSlippageOpen ? 'flex' : 'hidden'} flex-col z-20 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] md:w-full max-w-md h-full max-h-fit lg:h-auto rounded-lg bg-[#0d0410] border border-[#27272a] shadow-lg`}>
                                <CircleX className="ms-auto mt-2 me-2 cursor-pointer" onClick={() => setIsSlippageOpen(false)} />
                                <div className="w-full p-5">
                                    <div className="flex flex-col justify-start gap-2">
                                        <div className="flex items-center gap-x-3 text-2xl font-semibold">Slippage Settings</div>
                                        <p className="text-sm">{slippageType === SlippageType.Dynamic ? 'Dynamic Slippage optimizes your slippage to safeguard against front-running while maximizing transaction success rate.' :
                                            'Fixed Slippage may help with transaction success rate, but exposes you to front-running. Try using Fixed mode with MEV Protect turned on.'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-between transition-all">
                                        <div className="mt-4 flex flex-col gap-y-4">
                                            <div className="flex flex-col">
                                                <div className="text-xs font-semibold">Mode</div>
                                                <div className="mt-1 flex h-10 items-center justify-between gap-x-2 rounded-lg bg-[#1B1B1E] p-1">
                                                    <button type="button" onClick={() => setSlippageTab(SlippageType.Dynamic)} className={`${slippageTab === SlippageType.Dynamic ? 'bg-white/30' : ''} h-7 lg:h-full lg:w-20 w-full flex flex-1 justify-center items-center font-semibold space-x-2 text-white fill-current border border-transparent bg-transparent rounded-lg px-0.5 py-0.5`}>
                                                        <span className="font-semibold whitespace-nowrap">Dynamic</span>
                                                    </button>
                                                    <button type="button" onClick={() => setSlippageTab(SlippageType.Fixed)} className={`${slippageTab === SlippageType.Fixed ? 'bg-white/30' : ''} h-7 lg:h-full lg:w-20 w-full flex flex-1 justify-center items-center font-semibold space-x-2 text-white fill-current border border-transparent bg-transparent rounded-lg px-0.5 py-0.5`}>
                                                        <span className="font-semibold whitespace-nowrap text-v2-primary">Fixed</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {slippageTab === SlippageType.Dynamic && (
                                                <>
                                                    <div className="my-2 text-sm flex flex-col justify-start gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs font-semibold">Max Slippage:</div>
                                                            <input
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value);
                                                                    const regex = /^\d*\.?\d{0,2}$/;
                                                                    if (regex.test(value.toString()) && value >= 0.1 && value <= 10) {
                                                                        setDynamicSlippageAmt(value);
                                                                        setSlippageAmt(value)
                                                                    } else if (e.target.value === "") {
                                                                        setDynamicSlippageAmt(0);
                                                                    }
                                                                }}
                                                                value={dynamicSlippageAmt}
                                                                placeholder="0.00%"
                                                                type="number"
                                                                min="0.1"
                                                                max="10"
                                                                step="0.1"
                                                                className="bg-[#1B1B1E] h-full w-full max-w-40 rounded-lg px-2 py-2 text-right text-base outline-none placeholder:text-white/25 focus:border focus:border-white/30" />
                                                        </div>
                                                        <p className="text-sm">Set a max slippage you are willing to accept. Jupiter will intelligently minimize slippage, up to your max</p>
                                                    </div>
                                                    <div className="mt-4 pb-5">
                                                        <button onClick={() => {
                                                            handleSlippageSubmit(SlippageType.Dynamic)
                                                            setIsSlippageOpen(false)
                                                        }} disabled={dynamicSlippageAmt <= 0} type="button" className="h-full w-full rounded-xl bg-[#fefefe] text-black font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-300 ease-in hover:bg-slate-200">
                                                            Save Settings
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                            {slippageTab === SlippageType.Fixed && (<>
                                                <div className="my-2 text-sm">
                                                    <div className="mb-2 text-xs font-semibold">Slippage:</div>
                                                    <div className="mt-1 flex h-10 items-center justify-between gap-x-2 rounded-lg bg-[#1B1B1E] p-1">
                                                        <button onClick={() => handleFixSlippageAmt(0.3)} type="button" className={`${fixedSlippageAmt === 0.3 ? 'bg-white/30' : ''} flex-1 py-4 px-1 text-white-50 bg-[#1B1B1E] h-full relative rounded-md`}>
                                                            <div className="flex h-full w-full items-center justify-center leading-none">0.3%</div>
                                                        </button>
                                                        <button onClick={() => handleFixSlippageAmt(0.5)} type="button" className={`${fixedSlippageAmt === 0.5 ? 'bg-white/30' : ''} flex-1 py-4 px-1 text-white-50 bg-[#1B1B1E] h-full relative rounded-md`}>
                                                            <div className="flex h-full w-full items-center justify-center leading-none">0.5%</div>
                                                        </button>
                                                        <button onClick={() => handleFixSlippageAmt(1)} type="button" className={`${fixedSlippageAmt === 1 ? 'bg-white/30' : ''} flex-1 py-4 px-1 text-white-50 bg-[#1B1B1E] h-full relative rounded-md`}>
                                                            <div className="flex h-full w-full items-center justify-center leading-none">1%</div>
                                                        </button>
                                                        <div onClick={() => handleCustomFixSlippageAmt()} className={`${isCustomFixedSlippage ? 'bg-white/30' : ''} rounded-md cursor-pointer relative flex h-full w-[130px] items-center justify-between border-l border-white/5 bg-[#1B1B1E] px-2 text-sm text-white-50`}>
                                                            <span className="text-xs cursor-pointer">Custom</span>
                                                            <input className="pointer-events-all h-full w-full rounded-lg bg-transparent px-2 py-4 text-right text-sm text-v2-primary outline-none placeholder:text-white/25"
                                                                value={fixedSlippageAmt}
                                                                placeholder="0.00%"
                                                                type="number"
                                                                min="0.1"
                                                                max="10"
                                                                step="0.1"
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value);
                                                                    const regex = /^\d*\.?\d{0,2}$/;
                                                                    if (regex.test(value.toString()) && value >= 0.1 && value <= 10) {
                                                                        setFixedSlippageAmt(value);
                                                                    } else if (e.target.value === "") {
                                                                        setFixedSlippageAmt(0);
                                                                    }
                                                                }} />
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex flex-col gap-y-2 text-xs text-v2-lily/50">
                                                        <p>Set a fixed slippage you are willing to accept.</p>
                                                    </div>
                                                    <div className="block"></div>
                                                </div>
                                                <div className="mt-4 pb-5">
                                                    <button onClick={() => {
                                                        handleSlippageSubmit(SlippageType.Fixed)
                                                        setIsSlippageOpen(false)
                                                    }} disabled={fixedSlippageAmt <= 0} type="button" className="h-full w-full rounded-xl bg-[#fefefe] text-black font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-300 ease-in hover:bg-slate-200">
                                                        Save Settings
                                                    </button>
                                                </div>
                                            </>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button disabled={isComingSoon} type="button" onClick={handleRefreshQuote}
                            className="rounded-full bg-white/30 hover:scale-95 transition-transform duration-100 ease-linear text-sm py-[2px] px-3 text-white flex items-center justify-start gap-1 disabled:cursor-not-allowed">
                            <RefreshCw className="w-4" />
                        </button>
                    </div>
                    <div className="w-full border rounded-xl hover:border-white/30 hover:shadow-md hover:shadow-white/30 transition-shadow duration-300 ease-out border-[#27272a] bg-[#09090b] p-3 filter backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row justify-start md:justify-between">
                            <span className='text-lg text-[#a1a1aa] font-bold'>You're Selling</span>
                            <div className="flex items-center justify-start md:justify-end gap-2">
                                <span className="flex items-center gap-1"><Wallet className="w-4" />{selectedTokenToSell.balance} {selectedTokenToSell.symbol}</span>
                                <button onClick={() => handleAmountClick('HALF')} disabled={!isTokenAvailableInWallet} className="bg-white/30 hover:scale-95 transition-transform duration-100 ease-linear text-sm py-[3px] px-3 text-white rounded disabled:cursor-not-allowed" type="button">HALF</button>
                                <button onClick={() => handleAmountClick('MAX')} disabled={!isTokenAvailableInWallet} className="bg-white/30  hover:scale-95 transition-transform duration-100 ease-linear text-sm py-[3px] px-3 text-white rounded disabled:cursor-not-allowed" type="button">MAX</button>
                            </div>
                        </div>
                        <div className="w-full mt-5 flex items-center justify-between">
                            <div
                                onClick={() => {
                                    setIsSellingOpen(!isSellingOpen)
                                    setSellingSearchTerm('')
                                }}
                                className="hover:border-white/30 cursor-pointer select-none bg-transparent text-sm p-1 md:py-2 md:px-3 border border-[#27272a] rounded w-max min-w-max focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none flex items-center justify-between">
                                <div className="flex items-center justify-start gap-2">
                                    <img src={selectedTokenToSell.image} className="w-7 h-7 md:h-10 md:w-10 rounded-full" />
                                    <h3 className="font-bold text-base">{selectedTokenToSell.symbol}</h3>
                                </div>
                                {isSellingOpen ? <ChevronUp /> : <ChevronDown />}
                            </div>
                            <input className="w-full h-12 border text-right bg-transparent text-xl md:text-2xl border-none outline-none"
                                value={sellingAmount} onChange={(e) => handleSellingInput(e)} placeholder="0.00" />
                        </div>
                    </div>
                    {isSellingOpen && (
                        <>
                            <div
                                className={`${isSellingOpen ? 'flex' : 'hidden'} fixed inset-0 bg-black/50 z-10 top-0 right-0 bottom-0 left-0 w-full h-full filter backdrop-blur-sm`}
                                onClick={() => {
                                    setIsSellingOpen(!isSellingOpen)
                                    setSellingSearchTerm('')
                                }}
                            ></div>
                            <div className={`${isSellingOpen ? 'flex' : 'hidden'} flex-col z-20 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] md:w-full max-w-md h-full max-h-fit lg:h-auto rounded-lg bg-[#0d0410] border border-[#27272a] shadow-lg`}>
                                <CircleX className="ms-auto mt-2 me-2 cursor-pointer" onClick={() => setIsSellingOpen(false)} />
                                <div className="flex items-center w-full p-5">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-4 py-2 border border-[#27272a] focus:outline-none bg-transparent"
                                        value={sellingSearchTerm}
                                        onChange={(e) => setSellingSearchTerm(e.target.value)}
                                    />
                                </div>
                                <ul className="max-h-96 overflow-y-auto">
                                    {filteredSellingItems.length > 0 ? (
                                        filteredSellingItems.map((token, index) => (
                                            <li
                                                key={index}
                                                className="px-4 py-2 cursor-pointer flex items-center justify-start gap-2 hover:bg-white/30 hover:text-black"
                                                onClick={() => {
                                                    setIsSellingOpen(false);
                                                    setSellingSearchTerm("");
                                                    if (token.mintAddress === selectedTokenToBuy.mintAddress) {
                                                        setSelectedTokenToBuy(selectedTokenToSell);
                                                    }
                                                    setSelectedTokenToSell({
                                                        ...selectedTokenToSell,
                                                        name: token.name,
                                                        symbol: token.symbol,
                                                        mintAddress: token.mintAddress,
                                                        balance: token.balance,
                                                        image: token.image,
                                                        decimals: token.decimals
                                                    });
                                                }}
                                            >
                                                <img src={token.image} className="w-12 h-12 rounded-full" />
                                                <div className="flex flex-col items-start">
                                                    <h3 className="font-bold text-base">{token.symbol}</h3>
                                                    <p className="text-sm">{token.name}</p>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No results found</li>
                                    )}
                                </ul>
                            </div>
                        </>
                    )}
                    <button onClick={handleSwapSelection} type="button" className="flex items-center justify-center rounded-full bg-white/30 hover:scale-95 transition-transform duration-100 ease-linear max-w-max p-1 mx-auto -mt-6 -mb-6 w-7 h-7 relative z-[5] border border-black cursor-pointer"><ArrowUpDown className="w-5" /></button>
                    <div className="w-full border rounded-xl hover:border-white/30 hover:shadow-md hover:shadow-white/30 transition-shadow duration-300 ease-out border-[#27272a] bg-[#09090b] p-3 filter backdrop-blur-sm">
                        <label className='text-lg text-[#a1a1aa] font-bold' htmlFor="tokenSymbol">You're Buying</label>
                        <div className="relative w-full mt-5 flex items-center justify-between">
                            <div
                                onClick={() => setIsBuyingOpen(!isBuyingOpen)}
                                className="hover:border-white/30 cursor-pointer select-none bg-transparent text-sm p-1 md:py-2 md:px-3 border border-[#27272a] rounded w-max min-w-max focus-visible:outline-2 focus-visible:outline-transparent focus-visible:ring-2 focus-visible:ring-[#27272a] outline-none flex items-center justify-between">
                                <div className="flex items-center justify-start gap-2">
                                    <img src={selectedTokenToBuy.image} className="w-7 h-7 md:h-10 md:w-10 rounded-full" />
                                    <h3 className="font-bold text-base">{selectedTokenToBuy.symbol}</h3>
                                </div>
                                {isBuyingOpen ? <ChevronUp /> : <ChevronDown />}
                            </div>
                            <div className="flex flex-col justify-end items-end gap-0">
                                <input className="w-full text-right bg-transparent text-xl md:text-2xl border-none outline-none " placeholder="100.00"
                                    value={outAmount} readOnly />
                                <p className="text-sm text-white-35 ">{otherAmountThreshold}</p>
                            </div>
                        </div>
                    </div>
                    {isBuyingOpen && (
                        <>
                            <div onClick={() => {
                                setIsBuyingOpen(false)
                                setBuyingSearchTerm('')
                            }} className={`${isBuyingOpen ? 'flex' : 'hidden'} fixed inset-0 bg-black/50 z-10 top-0 right-0 bottom-0 left-0 w-full h-full filter backdrop-blur-sm`}>
                            </div>
                            <div className={`${isBuyingOpen ? 'flex' : 'hidden'} flex-col z-20 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] md:w-full max-w-md h-full max-h-fit lg:h-auto rounded-lg bg-[#0d0410] border border-[#27272a] shadow-lg`}>
                                <CircleX className="ms-auto mt-2 me-2 cursor-pointer" onClick={() => {
                                    setIsBuyingOpen(false)
                                    setBuyingSearchTerm('')
                                }} />
                                <div className="flex items-center w-full p-5">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-4 py-2 border border-[#27272a] focus:outline-none bg-transparent"
                                        value={buyingSearchTerm}
                                        onChange={(e) => setBuyingSearchTerm(e.target.value)}
                                    />
                                </div>

                                <ul className="max-h-96 overflow-y-auto">
                                    {filteredBuyingItems.length > 0 ? (
                                        filteredBuyingItems.map((token, index) => (
                                            <li
                                                key={index}
                                                className="px-4 py-2 cursor-pointer flex items-center justify-start gap-2 hover:bg-white/30 hover:text-black"
                                                onClick={() => {
                                                    setIsBuyingOpen(false);
                                                    setBuyingSearchTerm("");
                                                    if (token.mintAddress === selectedTokenToSell.mintAddress) {
                                                        setSelectedTokenToSell(selectedTokenToBuy);
                                                    }
                                                    setSelectedTokenToBuy({
                                                        ...selectedTokenToBuy,
                                                        name: token.name,
                                                        symbol: token.symbol,
                                                        mintAddress: token.mintAddress,
                                                        image: token.image,
                                                        decimals: token.decimals,
                                                        balance: token.balance
                                                    });
                                                }}
                                            >
                                                <img src={token.image} className="w-12 h-12 rounded-full" />
                                                <div className="flex flex-col items-start">
                                                    <h3 className="font-bold text-base">{token.symbol}</h3>
                                                    <p className="text-sm">{token.name}</p>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No results found</li>
                                    )}
                                </ul>
                            </div>
                        </>
                    )}
                    <button onClick={handleSwapSubmit} type='button' className="flex items-center justify-center gap-1 md:gap-2 border text-base bg-white font-bold text-black rounded-lg h-14 py-2 w-full  md:px-10 mx-auto text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 ease-out active:scale-95 hover:opacity-90 cursor-pointer"
                        disabled={
                            !isTokenAvailableForSwap ||
                            sellingAmount <= 0 ||
                            selectedTokenToSell === null ||
                            selectedTokenToSell.balance <= 0 ||
                            (slippageType === SlippageType.Dynamic && dynamicSlippageAmt <= 0) ||
                            (slippageType === SlippageType.Fixed && fixedSlippageAmt <= 0) ||
                            selectedTokenToSell.mintAddress === selectedTokenToBuy.mintAddress
                        }>
                        {selectedTokenToSell.balance <= 0
                            ? `Insufficient ${selectedTokenToSell.symbol}`
                            : 'Enter an amount'}
                    </button>
                </form>
            </section >
        </>
    )
}
export default Swap