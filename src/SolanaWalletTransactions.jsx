import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const SolanaWalletTransactions = ({ walletAddress }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        //Make sure to add mainnet connection url to make it work
        const connection = new Connection("");
        const publicKey = new PublicKey(walletAddress);
        let allSignatures = [];
        let lastSignature = null;
        let fetchedAllSignatures = false;

         while (!fetchedAllSignatures) {
          const options = { limit: 100 };
          if (lastSignature) options.before = lastSignature;

          const signatures = await connection.getConfirmedSignaturesForAddress2(publicKey, options);
          allSignatures = allSignatures.concat(signatures);
          if (signatures.length < 100) {
            fetchedAllSignatures = true;
          } else {
            lastSignature = signatures[signatures.length - 1].signature;
          }
        }

         const transactionDetails = await Promise.all(
          allSignatures.map(async ({ signature }) => {
            const transaction = await connection.getParsedTransaction(signature, 'confirmed');
            return transaction;
          })
        );

        setTransactions(transactionDetails.map((transaction) => ({
          signature: transaction.transaction.signatures[0],
          blockTime: transaction.blockTime,
          amount:
            (transaction.meta?.postBalances[0] - transaction.meta?.preBalances[0]) / 1e9,
        })));
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [walletAddress]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Solana Wallet Transactions</h1>
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
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
      )}
    </div>
  );
};

export default SolanaWalletTransactions;