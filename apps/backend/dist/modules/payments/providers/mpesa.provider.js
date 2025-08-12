"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaProvider = void 0;
class MpesaProvider {
    async initiatePayment({ amount, phoneNumber }) {
        // TODO: implement Daraja API call
        return { status: "pending", provider: "mpesa", amount, phoneNumber };
    }
}
exports.MpesaProvider = MpesaProvider;
