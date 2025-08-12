"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoProvider = void 0;
class CryptoProvider {
    async initiatePayment({ amount, currency }) {
        // TODO: integrate Coinbase Commerce / BitPay here
        return { status: "pending", provider: "crypto", amount, currency };
    }
}
exports.CryptoProvider = CryptoProvider;
