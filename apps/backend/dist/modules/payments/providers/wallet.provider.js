"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletProvider = void 0;
class WalletProvider {
    async transfer({ fromUserId, toUserId, amount }) {
        // TODO: implement internal ledger transfer
        return { status: "ok", fromUserId, toUserId, amount };
    }
}
exports.WalletProvider = WalletProvider;
