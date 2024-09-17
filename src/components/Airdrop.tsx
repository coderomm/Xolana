import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export function Airdrop() {
    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState<number>();
    const wallet = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        async function getBalance() {
            if (wallet.publicKey) {
                const balance = await connection.getBalance(wallet.publicKey);
                document.getElementById("balance").innerHTML = balance / LAMPORTS_PER_SOL;
            }
        }
        getBalance();
    }, [balance])

    const sendAirDropToUser = async () => {
        const activePublicKey = wallet.publicKey;
        try {
            const airdropSignature = await connection.requestAirdrop(
                activePublicKey,
                parseInt(amount) * 1000000000
            );
            console.log('Airdrop successful with signature:', airdropSignature);
            alert('Airdrop sent');
        } catch (error) {
            console.error('Error sending airdrop:', error);
            alert('Failed to send airdrop');
        }
    };

    return (
        <section>
            <input onChange={(e) => setAmount(e.target.value)} type="text" placeholder="Amount in SOL" />
            <button onClick={sendAirDropToUser}>Send Airdrop</button>
            <br />
            <h1 id="balance"></h1>
        </section>
    );
}
