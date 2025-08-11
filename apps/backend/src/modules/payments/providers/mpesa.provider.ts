export class MpesaProvider {
  async initiatePayment({ amount, phoneNumber }: { amount: number; phoneNumber: string }) {
    // TODO: implement Daraja API call
    return { status: "pending", provider: "mpesa", amount, phoneNumber };
  }
}
