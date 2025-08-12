#!/bin/bash

# Script to fix all enum usage across all services
cd /home/rigz/projects/gatenjia

echo "Fixing enum usage in all services..."

# Fix wallet.service.ts
echo "Fixing wallet.service.ts..."
sed -i 's/TransactionType\.CREDIT/TRANSACTION_TYPES.CREDIT/g' apps/backend/src/modules/auth/wallet.service.ts
sed -i 's/TransactionType\.DEBIT/TRANSACTION_TYPES.DEBIT/g' apps/backend/src/modules/auth/wallet.service.ts
sed -i 's/TransactionType\.TRANSFER/TRANSACTION_TYPES.TRANSFER/g' apps/backend/src/modules/auth/wallet.service.ts
sed -i 's/TransactionStatus\.COMPLETED/TRANSACTION_STATUSES.COMPLETED/g' apps/backend/src/modules/auth/wallet.service.ts

# Fix payment.service.ts
echo "Fixing payment.service.ts..."
sed -i 's/TransactionType\.CREDIT/TRANSACTION_TYPES.CREDIT/g' apps/backend/src/services/payment.service.ts
sed -i 's/TransactionStatus\.COMPLETED/TRANSACTION_STATUSES.COMPLETED/g' apps/backend/src/services/payment.service.ts

# Add imports to wallet.service.ts
echo "Adding imports to wallet.service.ts..."
if ! grep -q "TRANSACTION_TYPES" apps/backend/src/modules/auth/wallet.service.ts; then
  sed -i '1s/^/import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from ".\/auth.constants";\n/' apps/backend/src/modules/auth/wallet.service.ts
fi

# Add imports to payment.service.ts
echo "Adding imports to payment.service.ts..."
if ! grep -q "TRANSACTION_TYPES" apps/backend/src/services/payment.service.ts; then
  sed -i '1s/^/import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from "..\/modules\/auth\/auth.constants";\n/' apps/backend/src/services/payment.service.ts
fi

echo "All enum usage fixed!"
