export class StripeProvider {
  async initiatePayment({ amount, currency }: { amount: number; currency: string }) {
    // TODO: integrate Stripe SDK here
    return { status: "pending", provider: "stripe", amount, currency };
  }
}
