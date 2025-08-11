export class CryptoProvider {
  async initiatePayment({ amount, currency }: { amount: number; currency: string }) {
    // TODO: integrate Coinbase Commerce / BitPay here
    return { status: "pending", provider: "crypto", amount, currency };
  }
}
