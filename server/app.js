require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');
const { PublicKey, Transaction, sendAndConfirmTransaction, Connection, Keypair, SystemProgram, LAMPORTS_PER_SOL, } = require("@solana/web3.js")
const app = express();
const PORT = process.env.PORT || 5000;
const bs58 = require('bs58').default;
// app.use(cors({
//     origin: process.env.VITE_FRONTEND_URL,
//     credentials: true
// }));

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

const airdropLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minutes
    max: 1,  // Limit each IP to 1 request per window (5 minutes)
    message: 'Too many requests from this IP, please try again after 5 minutes',
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

app.get('/', async (req, res) => {
    res.status(200).json({ message: 'Airdrop successful' });
});

app.post('/request-airdrop', airdropLimiter, async (req, res) => {
    const { publicKey } = req.body;
    const lamports = 5000000000;
    try {
        const response = await axios.post(process.env.VITE_API_URL, {
            jsonrpc: "2.0",
            method: "requestAirdrop",
            params: [publicKey, lamports],
            id: v4(),
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.status === 200) {
            res.status(200).json({ message: 'Airdrop successful' });
        } else {
            res.status(500).json({ error: 'Failed to airdrop SOL' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to initiate staking
app.post('/stake', async (req, res) => {
    const { senderPublicKey, amount } = req.body;
    const connection = new Connection(process.env.RPC_API);

    try {
        const { blockhash } = await connection.getLatestBlockhash('finalized');

        const transaction = new Transaction({
            feePayer: new PublicKey(senderPublicKey),
            recentBlockhash: blockhash,
        });

        // Add transfer instruction
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(senderPublicKey),
                toPubkey: new PublicKey(process.env.STAKE_POOL_ADDRESS),
                lamports: amount * LAMPORTS_PER_SOL
            })
        );

        // Return the transaction for signing
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        });

        res.json({
            transaction: serializedTransaction.toString('base64'),
            message: 'Transaction created successfully'
        });
    } catch (error) {
        console.error('Error creating stake transaction:', error);
        res.status(500).json({ error: 'Failed to create stake transaction' });
    }
});

// Helius webhook endpoint
app.post('/helius', async (req, res) => {

    const heliusRes = {
        "description": "5DxD5ViWjvRZEkxQEaJHZw2sBsso6xoXx3wGFNKgXUzE sold Fox #7637 to CKs1E69a2e9TmH4mKKLrXFF8kD3ZnwKjoEuXa6sz9WqX for 72 SOL on MAGIC_EDEN.",
        "feePayer": "CKs1E69a2e9TmH4mKKLrXFF8kD3ZnwKjoEuXa6sz9WqX",
        "signature": "5nNtjezQMYBHvgSQmoRmJPiXGsPAWmJPoGSa64xanqrauogiVzFyGQhKeFataHGXq51jR2hjbzNTkPUpP787HAmL",
        "tokenTransfers": [
            {
                "fromTokenAccount": "25DTUAd1roBFoUQaxJQByL6Qy2cKQCBp4bK9sgfy9UiM",
                "fromUserAccount": "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix",
                "mint": "FdsNQE5EeCe57tbEYCRV1JwW5dzNCof7MUTaGWhmzYqu",
                "toTokenAccount": "DTYuh7gAGGZg2okM7hdFfU1yMY9LUemCiPyD5Z5GCs6Z",
                "toUserAccount": "CKs1E69a2e9TmH4mKKLrXFF8kD3ZnwKjoEuXa6sz9WqX",
                "tokenAmount": 1,
                "tokenStandard": "NonFungible"
            }
        ],
        "type": "NFT_SALE"
    }
    const connection = new Connection(`${process.env.RPC_API}`);

    try {
        console.log('req.body - ', req.body)
        const accountToTrack = process.env.STAKE_POOL_ADDRESS;
        const transaction = req.body;
        const isStakeTransaction = transaction.nativeTransfers?.some(
            transfer => transfer.toUserAccount === accountToTrack
        );

        if (!isStakeTransaction) {
            return res.json({ message: 'Not a stake transaction' });
        }

        const incomingTx = transaction.nativeTransfers.find(
            t => t.toUserAccount === accountToTrack
        );
        console.log('incomingTx description - ', incomingTx.description)

        const decodedKey = bs58.decode(process.env.BASE58_PRIVATE_KEY);
        const myWallet = Keypair.fromSecretKey(decodedKey);
        const senderPubKey = new PublicKey(incomingTx.fromUserAccount);
        const xsolAmount = incomingTx.amount;
        const mintPubKey = new PublicKey(process.env.XSOLANA_MINT_ADDRESS);

        console.log('incomingTx req type - ', incomingTx.type)
        const type = 'received_native_sol';

        if (type === "received_native_sol") {
            const senderATA = await getAssociatedTokenAddress(
                mintPubKey,
                senderPubKey,
                false,
                TOKEN_2022_PROGRAM_ID
            );
            const ataInfo = await connection.getAccountInfo(senderATA);
            const mintTx = new Transaction();
            const { blockhash } = await connection.getLatestBlockhash('finalized');
            mintTx.recentBlockhash = blockhash;

            if (!ataInfo) {
                console.log("Creating new ata for sender...");
                const createAtaInstruction = createAssociatedTokenAccountInstruction(
                    myWallet.publicKey,
                    senderATA,
                    senderPubKey,
                    mintPubKey,
                    TOKEN_2022_PROGRAM_ID
                );
                mintTx.add(createAtaInstruction);
            }

            const mintToInstruction = createMintToInstruction(
                mintPubKey,
                senderATA,
                myWallet.publicKey,
                xsolAmount,
                [],
                TOKEN_2022_PROGRAM_ID
            )
            mintTx.add(mintToInstruction)

            const signature = await sendAndConfirmTransaction(connection, mintTx, [myWallet]);
            console.log("Transaction successful!");
            console.log("Signature - ", signature);
            res.status(200).json({ message: 'Stake processed successfully', signature: signature });
        } else {
            res.status(200).json({ message: 'Transaction processed' });
        }
    } catch (error) {
        console.error('Error processing stake:', error);
        res.status(500).json({ error: 'Failed to process stake' });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
