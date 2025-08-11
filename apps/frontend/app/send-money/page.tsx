"use client";
import { useState } from "react";

export default function SendMoneyPage() {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Would send ${amount} to ${recipient} (stub)`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Send Money</h2>
      <input placeholder="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
}
