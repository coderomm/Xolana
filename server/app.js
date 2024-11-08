require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');
const { PublicKey, Transaction, sendAndConfirmTransaction, Connection, Keypair, SystemProgram, LAMPORTS_PER_SOL, } = require("@solana/web3.js")
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const bs58 = require('bs58').default;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://xolana.vercel.app',
    credentials: true
}));

app.use(express.json());

const wss = new WebSocketServer({ server  });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established from:', req.headers.origin);

    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

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

app.post('/helius', async (req, res) => {
    const connection = new Connection(`${process.env.RPC_API}`);

    try {
        const accountToTrack = process.env.STAKE_POOL_ADDRESS;
        const [transaction] = req.body;
        console.log('req.body(transaction) - ', transaction);

        const isStakeTransaction = transaction.nativeTransfers?.some(
            transfer => transfer.toUserAccount === accountToTrack
        );

        if (!isStakeTransaction) {
            // wss.clients.forEach((client) => {
            //     if (client.readyState === WebSocket.OPEN) {
            //         client.send(JSON.stringify({ type: 'not-a-stake-transaction' }));
            //     }
            // });
            return res.json({ message: 'Not a stake transaction' });
        }

        const incomingTx = transaction.nativeTransfers.find(
            t => t.toUserAccount === accountToTrack
        );

        // wss.clients.forEach((client) => {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify({ type: 'log', message: `Tx - ${incomingTx?.description}` }));
        //     }
        // });

        const decodedKey = bs58.decode(process.env.BASE58_PRIVATE_KEY);
        const myWallet = Keypair.fromSecretKey(decodedKey);
        const senderPubKey = new PublicKey(incomingTx.fromUserAccount);
        const xsolAmount = incomingTx.amount;
        const mintPubKey = new PublicKey(process.env.XSOLANA_MINT_ADDRESS);

        if (transaction.type === 'TRANSFER') {
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
                // wss.clients.forEach((client) => {
                //     if (client.readyState === WebSocket.OPEN) {
                //         client.send(JSON.stringify({ type: 'log', message: 'Creating new ATA for you...' }));
                //     }
                // });
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
            // wss.clients.forEach((client) => {
            //     if (client.readyState === WebSocket.OPEN) {
            //         client.send(JSON.stringify({ type: 'stake-processed-successfully', signature }));
            //     }
            // });
            res.status(200).json({ message: 'Stake processed successfully', signature: signature });
        } else {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'transaction-processed' }));
                }
            });
            res.status(200).json({ message: 'Transaction processed in else' });
        }
    } catch (error) {
        console.error('Error processing stake:', error);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'error-processing-stake', error: error.toString() }));
            }
        });
        res.status(500).json({ error: 'Failed to process stake' });
    }
})

// app.on('upgrade', (request, socket, head) => {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit('connection', ws, request);
//     });
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
