# Prisma Press Backend

Prisma Press Backend is a premium, modular REST API designed for a modern blogging and content publishing platform. It features robust user authentication, post and comment management, and a Stripe-integrated subscription billing system that unlocks premium content for subscribed readers.

---

## 🚀 Key Features

- **User & Profile Management**: Register and login users, manage roles (`USER`, `ADMIN`, `AUTHOR`), and handle HTTP-only cookie-based JWT authentication.
- **Content Engine**: Full-featured blog posts with categories/tags, view counting, advanced search, filtering, and pagination.
- **Engagement**: Comment system under blog posts with moderation control (`APPROVED`/`REJECT`) by administrators.
- **Premium Subscriptions**: Seamless Stripe billing integration. Users checkout via Stripe hosted pages, and real-time Stripe webhooks update subscription status to grant `ACTIVE` premium access.
- **Security Guards**: Flexible authentication (`auth`) and premium content subscription (`subscriptionGuard`) middlewares.

---

## 🛠️ Technology Stack

- **Framework**: Express 5 (Express.js)
- **Language**: TypeScript (v6.0) with type-safe routing
- **ORM**: Prisma (v7.8) with multi-file schema architecture
- **Database**: PostgreSQL (via Node Postgres `@prisma/adapter-pg`)
- **Payments**: Stripe API & Stripe Webhooks
- **Auth**: JWT (AccessToken & RefreshToken in HTTP-Only cookies) & BcryptJS hashing

---

## 📂 Project Architecture

```
src/
├── config/             # Environment variables and configurations
├── lib/                # Shared library initializers (prisma, stripe)
├── middlewares/        # Express middlewares (auth, globalErrorHandler, notFound, premiumGuard)
├── modules/            # Domain-driven feature modules
│   ├── auth/           # Login, JWT issuing, Token refresh
│   ├── comment/        # Create, moderate (status update), and delete comments
│   ├── post/           # CRUD, search, pagination, view counter
│   ├── premium/        # Access premium-only blog content
│   ├── subscription/   # Stripe checkout session generator and Webhook handler
│   └── user/           # Registration, Profile CRUD, activeStatus/role management
├── utils/              # Helper utilities (catchAsync, sendResponse)
├── app.ts              # Express application setup
└── server.ts           # Server runner
```

### Request Lifecycle Flow

```
Client Request ──> Route ──> Middlewares (auth / premiumGuard) ──> Controller ──> Service ──> Prisma Client ──> PostgreSQL DB
```

---

## 📊 Database Schema (Prisma)

The database is defined using Prisma's multi-file schema feature under `prisma/schema/`:

- **User** (`user.prisma`): Manages authentication credentials, role, status, and relations.
- **Profile** (`profile.prisma`): Connects 1:1 with User, storing avatar and bio info.
- **Post** (`post.prisma`): Holds the blog post content, tag list, view counts, and premium flag.
- **Comment** (`comment.prisma`): Post engagement comments, moderation status, and cascading delete options.
- **Subscription** (`subscription.prisma`): Stores Stripe billing metadata (`stripeCustomerId`, `stripeSubscriptionId`), current period end, and active status.
- **Enums** (`enums.prisma`): ActiveStatus (`ACTIVE`, `BLOCKED`), Role (`USER`, `ADMIN`, `AUTHOR`), and SubscriptionStatus.

---

## 🔄 Comprehensive System Flow Diagram

The diagram below illustrates the comprehensive flow of operations in the system, specifically highlighting the checkout and webhook lifecycle for premium subscription updates:

```mermaid
sequenceDiagram
    autonumber
    actor User as Subscribed Client
    participant FE as Frontend App
    participant BE as Express Backend
    participant DB as Prisma/PostgreSQL
    participant Stripe as Stripe API

    %% Registration & Profile Creation
    Note over User, DB: 1. User Registration & Setup
    User->>FE: Fill Registration Form
    FE->>BE: POST /api/users/register
    BE->>DB: Prisma Transaction (Create User + Profile)
    DB-->>BE: Success
    BE-->>FE: Return Registered User Data

    %% Stripe Checkout Creation
    Note over User, DB: 2. Initiating Premium Subscription
    User->>FE: Click "Subscribe to Premium"
    FE->>BE: POST /api/subscription/checkout-session (JWT Cookie)
    BE->>BE: Retrieve User ID via auth() middleware
    BE->>DB: Fetch User + Subscription info
    alt No Existing Stripe Customer
        BE->>Stripe: Create Stripe Customer
        Stripe-->>BE: Return Customer ID
    else Existing Stripe Customer
        BE->>BE: Reuse Existing Customer ID
    end
    BE->>Stripe: Create checkout.sessions (Price, Metadata: { userId })
    Stripe-->>BE: Return Checkout Session URL
    BE-->>FE: Return { paymentUrl: ... }
    FE->>User: Redirect to Stripe Hosted Page
    User->>Stripe: Complete Payment & Card Authentication

    %% Webhook Processing
    Note over User, DB: 3. Stripe Webhook Processing (Asynchronous)
    Stripe->>BE: POST /api/subscription/webhook (Event: checkout.session.completed)
    BE->>BE: Verify Webhook Signature (endpointSecret)
    BE->>BE: Extract metadata.userId, customerId, subscriptionId
    BE->>Stripe: Retrieve Subscription Details (retrieve subscriptionId)
    Stripe-->>BE: Return Subscription Details (current_period_end)
    BE->>DB: prisma.subscription.upsert (userID: userId, ACTIVE status)
    DB-->>BE: DB Record Saved/Updated
    BE-->>Stripe: Respond HTTP 200 OK

    %% Accessing Premium Content
    Note over User, DB: 4. Accessing Premium Content
    User->>FE: Visit Premium Article list
    FE->>BE: GET /api/premium (JWT Cookie)
    BE->>BE: Run auth() & subscriptionGuard()
    BE->>DB: Query User Subscription status
    DB-->>BE: Subscription status is ACTIVE
    BE->>DB: Fetch Posts where isPremium = true
    DB-->>BE: Return Premium Posts
    BE-->>FE: Return 200 OK with articles
    FE->>User: Render premium articles
```

---

## ⚡ API Endpoints

### Authentication & Users

- `POST /api/auth/login` - Authenticate user and issue tokens (cookies).
- `POST /api/users/register` - Create user and profile.
- `GET /api/users/me` - Retrieve current logged-in user profile.
- `GET /api/users` - Fetch all users (Admin only).
- `PATCH /api/users/:id/status` - Block or unblock a user (Admin only).
- `PATCH /api/users/:id/role` - Update user role (Admin only).

### Posts

- `GET /api/posts` - Retrieve public blog posts (supports pagination, search, sorting, tag filters).
- `GET /api/posts/my-posts` - Retrieve posts authored by the logged-in user.
- `GET /api/posts/:id` - Fetch single post detail (automatically increments view count).
- `POST /api/posts` - Create a new post.
- `PUT /api/posts/:id` - Update post details (Author validation).
- `DELETE /api/posts/:id` - Delete post.

### Comments

- `GET /api/comments?postId=...` - Fetch comments for a post.
- `POST /api/comments` - Post a new comment.
- `PATCH /api/comments/:id/status` - Moderate comment status (Admin only).
- `DELETE /api/comments/:id` - Delete a comment.

### Subscriptions & Premium

- `POST /api/subscription/checkout-session` - Generates Stripe payment session URL.
- `POST /api/subscription/webhook` - Stripe webhook receiver (processes `checkout.session.completed` events).
- `GET /api/premium` - Retrieve premium articles (Requires active subscription).

---

## ⚙️ Setup & Local Development

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- Stripe CLI (for webhook testing)

### 2. Environment Configuration

Create a `.env` file in the root of the project with reference to `.env.example`:

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
JWT_ACCESS_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="30d"
NODE_ENV="development"
APP_URL="http://localhost:3000"

STRIPE_API_KEY="sk_test_..."
STRIPE_PRODUCT_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Installation

```bash
npm install
```

### 4. Database Setup

Prisma uses schema files from `prisma/schema`. Generate client and push schemas to the database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application

To run the server in development mode with hot-reloading:

```bash
npm run dev
```

To run the Stripe Webhook listener locally:

```bash
# Log in to Stripe
stripe login

# Forward webhook traffic to the local webhook endpoint
npm run stripe:webhook
```

This command forwards Stripe events directly to your endpoint, giving you the `whsec_...` signature value for your `.env` configuration.
