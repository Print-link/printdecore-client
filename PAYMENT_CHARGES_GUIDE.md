# Payment Transaction Charges Guide

## How Paystack Transaction Charges Work

### ⚠️ Important: Charges are NOT added to customer payment

**Transaction charges are automatically deducted from the settlement amount, NOT added to what the customer pays.**

**Example:**
- Customer pays: **GHS 100.00**
- Paystack transaction fee: **1.5%** = GHS 1.50
- Subaccount receives: **GHS 98.50** (not GHS 101.50)

The customer always pays the exact amount shown. Charges are handled internally by Paystack.

---

## Charge Bearer Configuration

### 1. Direct Subaccount Payments (Current Implementation)

**For direct subaccount payments, charge bearer is configured in Paystack Dashboard, not in code.**

When you create a subaccount in Paystack, you configure:
- **Percentage charge**: How much the subaccount pays (e.g., 1.5%)
- **Charge bearer**: Who pays the transaction fees

**Current Flow:**
```typescript
// Customer payment - no bearer needed
initializePayment({
  amount: 100, // Customer pays GHS 100
  email: "customer@example.com",
  currency: "GHS",
  subaccount: "ACCT_xxx" // Charge bearer configured in Paystack dashboard
})
```

**Result:**
- Customer pays: **GHS 100.00**
- Paystack deducts fee based on subaccount configuration
- Subaccount receives: **GHS 98.50** (if 1.5% fee, subaccount bears charges)
- OR Subaccount receives: **GHS 100.00** (if main account bears charges)

### 2. Split Payments (For Advanced Use Cases)

When using split payments (created by managers/admin), you can specify charge bearer:

```typescript
// When creating split (manager/admin only)
createSplit({
  name: "Print Job Split",
  type: "percentage",
  currency: "GHS",
  subaccounts: [{ subaccount: "ACCT_xxx", share: 98.5 }],
  bearer_type: "account", // or "subaccount"
  bearer_subaccount: "ACCT_xxx" // Required if bearer_type is "subaccount"
})

// When initializing payment with split
initializePayment({
  amount: 100,
  email: "customer@example.com",
  currency: "GHS",
  split_code: "SPL_xxx", // From created split
  bearer: "account", // Optional override
  bearer_subaccount: "ACCT_xxx" // If bearer is "subaccount"
})
```

---

## Current Implementation

### Frontend (`usePayment.ts`)
- ✅ Uses direct subaccount payments
- ✅ Charge bearer configured in Paystack dashboard per subaccount
- ✅ No code changes needed for charge bearer

### Backend (`paymentController.ts`)
- ✅ Supports direct subaccount payments (charge bearer from Paystack config)
- ✅ Supports split payments with bearer configuration
- ✅ Handles both payment types seamlessly

---

## How to Configure Charge Bearer

### For Direct Subaccount Payments (Current Method)

1. **Go to Paystack Dashboard** → Subaccounts
2. **Select your subaccount** (e.g., `ACCT_np90kk4imvw2wv9`)
3. **Configure charge settings:**
   - **Percentage Charge**: Set the fee percentage (e.g., 1.5%)
   - **Charge Bearer**: Choose who pays:
     - **Account**: Main account pays fees (subaccount receives full amount)
     - **Subaccount**: Subaccount pays fees (fee deducted from their share)

### For Split Payments (If Needed)

Configure when creating the split via `/api/payments/split/create`:

```typescript
{
  bearer_type: "account", // Main account pays
  // OR
  bearer_type: "subaccount", // Subaccount pays
  bearer_subaccount: "ACCT_xxx" // Required if bearer_type is "subaccount"
}
```

---

## Recommendation

**For your marketplace model:**

### Option 1: Subaccount Bears Charges (Recommended)
- Configure in Paystack: Subaccount pays transaction fees
- **Result**: Customer pays GHS 100 → Branch receives GHS 98.50 → Fee deducted from branch
- **Pros**: Transparent, branches account for fees in pricing
- **Cons**: Branches need to factor fees into their prices

### Option 2: Main Account Bears Charges
- Configure in Paystack: Main account pays transaction fees
- **Result**: Customer pays GHS 100 → Branch receives GHS 100 → Platform pays GHS 1.50 fee
- **Pros**: Branches receive full amount, simpler for them
- **Cons**: Platform covers all transaction costs

---

## Summary

**Current Implementation:**
- ✅ Charges are **automatically handled** by Paystack
- ✅ Charges are **deducted from settlement**, NOT added to customer payment
- ✅ Charge bearer is **configured in Paystack dashboard** per subaccount
- ✅ No code changes needed - it just works!

**To change who bears charges:**
1. Go to Paystack Dashboard
2. Edit subaccount settings
3. Change "Charge Bearer" option
4. Save changes

The next payment will use the new charge bearer configuration automatically.

