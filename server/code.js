const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
} = require("@solana/spl-token");
const Base58 = require('bs58').default;  // You'll need to install this: npm install bs58
console.log("BS58 module:", Base58);
async function mintXSOLToSender(
    connection,
    senderPublicKey,
    base58PrivateKey,  // Changed to accept base58 private key
    xsolanaMintAddress,
    solAmountLamports
) {
    try {
        // Convert base58 private key to Keypair
        const decodedKey = Base58.decode(base58PrivateKey);
        
        const myWallet = Keypair.fromSecretKey(decodedKey);

        // Create PublicKey objects
        const senderPubKey = new PublicKey(senderPublicKey);
        const mintPubKey = new PublicKey(xsolanaMintAddress);

        // Get the sender's ATA for your XSOL token
        const senderATA = await getAssociatedTokenAddress(
            mintPubKey,
            senderPubKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        // Check if the sender's ATA exists
        const ataInfo = await connection.getAccountInfo(senderATA);

        // Create a new transaction
        const transaction = new Transaction();

        // If ATA doesn't exist, add instruction to create it
        if (!ataInfo) {
            console.log("Creating new Associated Token Account for sender...");
            const createAtaInstruction = createAssociatedTokenAccountInstruction(
                myWallet.publicKey,  // payer
                senderATA,          // ata
                senderPubKey,       // owner
                mintPubKey,         // mint
                TOKEN_2022_PROGRAM_ID
            );
            transaction.add(createAtaInstruction);
        }

        // Calculate XSOL amount to mint (1:1 ratio for simplicity)
        const xsolAmount = solAmountLamports;

        // Add instruction to mint tokens to the sender's ATA
        const mintToInstruction = createMintToInstruction(
            mintPubKey,         // mint
            senderATA,          // destination
            myWallet.publicKey, // authority
            xsolAmount,         // amount
            [],                 // multiSigners
            TOKEN_2022_PROGRAM_ID
        );
        transaction.add(mintToInstruction);

        // Send and confirm transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [myWallet]
        );

        console.log("Transaction successful!");
        console.log("Signature:", signature);
        return signature;

    } catch (error) {
        console.error("Error in mintXSOLToSender:", error);
        throw error;
    }
}

// Example usage:
async function main() {
    // Initialize connection to Solana network (use mainnet-beta for production)
    const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
    );

    // Your private key from Phantom
    const MY_PRIVATE_KEY = '26AqNiVwVuCUSHDJ2CMbVC3Z3K7piEKuVkyvHdjBYhipxdbKSM2qDBV1zwj27ozQ1sC3Q6yadtERZ4KfsVXwH2YV';

    // Other parameters to be filled
    const SENDER_PUBLIC_KEY = "BHsXKwgUEct5uhxY3TGHFrcJrB5cYWE2sXH8TektLvpV";
    const XSOLANA_MINT_ADDRESS = "6KmMqmzaQLWU5EUDjMpaougyEFMhfVfjFoctupz9iczc";
    const SOL_AMOUNT_RECEIVED = 1000000000; // 1 SOL in lamports

    try {
        const signature = await mintXSOLToSender(
            connection,
            SENDER_PUBLIC_KEY,
            MY_PRIVATE_KEY,
            XSOLANA_MINT_ADDRESS,
            SOL_AMOUNT_RECEIVED
        );
        console.log("XSOL minted successfully!", signature);
    } catch (error) {
        console.error("Failed to mint XSOL:", error);
    }
}

// Execute the main function
main();