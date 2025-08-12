#!/bin/bash

# Script to fix enum usage in auth.service.ts
# This replaces all enum references with constants

cd /home/rigz/projects/gatenjia

# Replace UserStatus.INACTIVE with USER_STATUSES.INACTIVE
sed -i 's/UserStatus\.INACTIVE/USER_STATUSES.INACTIVE/g' apps/backend/src/modules/auth/auth.service.ts

# Replace UserStatus.SUSPENDED with USER_STATUSES.SUSPENDED
sed -i 's/UserStatus\.SUSPENDED/USER_STATUSES.SUSPENDED/g' apps/backend/src/modules/auth/auth.service.ts

# Replace UserRole.ADMIN with USER_ROLES.ADMIN
sed -i 's/UserRole\.ADMIN/USER_ROLES.ADMIN/g' apps/backend/src/modules/auth/auth.service.ts

# Replace UserStatus.ACTIVE with USER_STATUSES.ACTIVE
sed -i 's/UserStatus\.ACTIVE/USER_STATUSES.ACTIVE/g' apps/backend/src/modules/auth/auth.service.ts

# Replace UserStatus.PENDING_VERIFICATION with USER_STATUSES.PENDING_VERIFICATION
sed -i 's/UserStatus\.PENDING_VERIFICATION/USER_STATUSES.PENDING_VERIFICATION/g' apps/backend/src/modules/auth/auth.service.ts

echo "Enum usage fixed in auth.service.ts"
