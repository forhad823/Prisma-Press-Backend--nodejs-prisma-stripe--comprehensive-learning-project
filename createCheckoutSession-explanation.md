## Purpose of `createCheckoutSession()`

This function creates a **Stripe Checkout page** for a user to purchase a **subscription**.

When everything succeeds, it returns the **payment URL** that the frontend can redirect the user to.

---

## Step-by-step explanation

### Step 1: Start a database transaction

```ts
const transactionResult = await prisma.$transaction(async (tx) => {
```

A Prisma transaction begins.

- `tx` is a transaction-specific Prisma client.
- If something inside this callback fails, the database changes made through `tx` are rolled back.

> **Note:** In this code, there aren't any database writes (`create`, `update`, etc.). So the transaction doesn't provide much benefit here, although it would if you later save subscription-related data.

---

### Step 2: Find the user

```ts
const user = await tx.user.findUniqueOrThrow({
  where: { id: userId },
  include: {
    subscription: true,
  },
});
```

It looks up the user by their ID.

It also fetches the user's subscription.

Example result:

```ts
{
  id: "u123",
  name: "Forhad",
  email: "forhad@gmail.com",
  subscription: {
    stripeCustomerId: "cus_ABC123"
  }
}
```

Without

```ts
include: {
  subscription: true,
}
```

`user.subscription` would be `undefined` because Prisma does **not** automatically load related tables.

---

### Step 3: Check whether the user already has a Stripe customer

```ts
let stripeCustomerId = user.subscription?.stripeCustomerId;
```

Two possibilities exist.

#### Existing subscriber

```text
subscription
    ↓
stripeCustomerId exists
```

Reuse the existing Stripe customer.

---

#### New subscriber

If

```ts
stripeCustomerId;
```

is missing:

```ts
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: {
    userId: user.id,
  },
});
```

Stripe creates a new customer.

Example:

```
Customer ID:
cus_XYZ987
```

Then

```ts
stripeCustomerId = customer.id;
```

stores that ID for later use.

---

### Step 4: Create the Checkout Session

```ts
const session = await stripe.checkout.sessions.create(...)
```

This tells Stripe:

- Which product is being purchased

```ts
price: config.product_price_id;
```

- Quantity

```ts
quantity: 1;
```

- Payment type

```ts
mode: "subscription";
```

- Which customer is paying

```ts
customer: stripeCustomerId;
```

- Accepted payment method

```ts
payment_method_types: ["card"];
```

- Where to go after success

```ts
success_url;
```

- Where to go after cancel

```ts
cancel_url;
```

Stripe responds with something like

```text
https://checkout.stripe.com/c/pay/cs_test_...
```

---

### Step 5: Return the Checkout URL

```ts
return session.url;
```

The transaction callback returns the Stripe Checkout URL.

Then

```ts
return {
  paymentUrl: transactionResult,
};
```

returns

```ts
{
  paymentUrl: "https://checkout.stripe.com/...";
}
```

The frontend can redirect the user there.

---

# Flow of execution (Text Diagram)

```text
Client
   │
   │ calls createCheckoutSession(userId)
   ▼
Start Prisma Transaction
   │
   ▼
Find user + subscription
   │
   ▼
Does Stripe Customer ID exist?
   │
   ├────────────── Yes ──────────────┐
   │                                 │
   │                                 ▼
   │                      Use existing customer
   │
   └────────────── No ───────────────►
                                     │
                                     ▼
                         Create Stripe Customer
                                     │
                                     ▼
                     Get new stripeCustomerId
                                     │
                                     ▼
                  Create Stripe Checkout Session
                                     │
                                     ▼
                 Stripe returns Checkout URL
                                     │
                                     ▼
                 Return session.url from transaction
                                     │
                                     ▼
Return

{
  paymentUrl: "https://checkout.stripe.com/..."
}
                                     │
                                     ▼
Frontend redirects user to Stripe Checkout
```

---

## Overall summary

```text
1. Receive a user ID.
        │
2. Load the user and subscription from the database.
        │
3. Check whether the user already has a Stripe Customer.
        │
        ├── Yes → Reuse it.
        │
        └── No → Create a new Stripe Customer.
        │
4. Create a Stripe Checkout Session for a subscription.
        │
5. Get the Checkout URL from Stripe.
        │
6. Return that URL to the frontend.
        │
7. Frontend redirects the user to Stripe's hosted payment page.
```

In short, **this function acts as the bridge between your application and Stripe**: it identifies the user, ensures they have a Stripe customer account, creates a subscription checkout session, and returns the URL where the user can securely complete the payment.
