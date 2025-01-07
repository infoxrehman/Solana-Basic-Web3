import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SolanaWalletTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  
  //Make sure to add your Mainnet URL here
  const RPC_URL = "";
  
  const fetchAllTransactions = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError('');
    try {
      const connection = new Connection(RPC_URL);
      const publicKey = new PublicKey(walletAddress);
      let allSignatures = [];
      let lastSignature = null;
      let fetchedAllSignatures = false;

      while (!fetchedAllSignatures) {
        const options = { limit: 100 };
        if (lastSignature) options.before = lastSignature;

        const signatures = await connection.getSignaturesForAddress(publicKey, options);
        allSignatures = allSignatures.concat(signatures);
        if (signatures.length < 100) {
          fetchedAllSignatures = true;
        } else {
          lastSignature = signatures[signatures.length - 1].signature;
        }
      }

      const transactionDetails = await Promise.all(
        allSignatures.map(async ({ signature }) => {
          const transaction = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0
          });
          return transaction;
        })
      );

      setTransactions(transactionDetails
        .filter(tx => tx !== null) // Filter out any null transactions
        .map((transaction) => ({
          signature: transaction.transaction.signatures[0],
          blockTime: transaction.blockTime,
          amount: transaction.meta?.postBalances && transaction.meta?.preBalances ? 
            (transaction.meta.postBalances[0] - transaction.meta.preBalances[0]) / 1e9 : 0,
        })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold ">Solana Wallet Transactions</h1>
      
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={fetchAllTransactions}
          disabled={loading || !walletAddress}
        >
          {loading ? 'Fetching...' : 'Fetch Transactions'}
        </Button>
      </div>

      {error && (
        <div className="text-red-500 mt-2">
          Error: {error}
        </div>
      )}

      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Signature</th>
                <th className="p-2 text-left">Block Time</th>
                <th className="p-2 text-right">Amount (SOL)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                  <td className="p-2 break-all">{transaction.signature}</td>
                  <td className="p-2">
                    {transaction.blockTime ? new Date(transaction.blockTime * 1000).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-2 text-right">{transaction.amount.toFixed(2)} SOL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      </div>
    </div>
  );
};

export default SolanaWalletTransactions;