export class WalletProvider {
  async transfer({ fromUserId, toUserId, amount }: { fromUserId: string; toUserId: string; amount: number }) {
    // TODO: implement internal ledger transfer
    return { status: "ok", fromUserId, toUserId, amount };
  }
}
