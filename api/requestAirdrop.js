import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { publicKey } = req.body;
  const lamports = 1000000000; // Number of lamports to airdrop, e.g., equivalent to 1 SOL

  try {
    const response = await axios.post(process.env.VITE_API_URL, {
      jsonrpc: "2.0",
      method: "requestAirdrop",
      params: [publicKey, lamports],
      id: uuidv4,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      res.status(200).json({ message: 'Airdrop successful' });
    } else {
      res.status(500).json({ error: 'Failed to airdrop SOL' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}