#  Blood Donation & Emergency Assistance Platform — Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2-blue.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v7.0-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.9-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-4169E1.svg)](https://www.postgresql.org/)
[![bKash](https://img.shields.io/badge/bKash-Payment%20Gateway-e2136e.svg)](https://developer.bka.sh/)

A robust, enterprise-ready RESTful API backend for a **Blood Donation & Emergency Assistance Platform**. This system connects patients and hospitals in urgent need of blood with voluntary donors, provides compatible donor matching algorithms, supports monetary donations via **bKash Payment Gateway**, and features an extensive **Admin Management Dashboard**.

---

##  Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Structure](#-project-architecture--structure)
- [Prerequisites](#-prerequisites)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Variables Guide](#-environment-variables-guide)
- [Database Seeding](#-database-seeding)
- [API Documentation](#-api-documentation)
  - [Authentication (`/api/v1/auth`)](#1-authentication-apiv1auth)
  - [User & Donor Profile (`/api/v1/users`)](#2-user--donor-profile-apiv1users)
  - [Blood Requests (`/api/v1/blood-requests`)](#3-blood-requests-apiv1blood-requests)
  - [Payments & Donations (`/api/v1/payments`)](#4-payments--donations-apiv1payments)
  - [Admin & Analytics (`/api/v1/admin`)](#5-admin--analytics-apiv1admin)
- [Docker & Deployment](#-docker--deployment)
- [Postman Collection](#-postman-collection)
- [License](#-license)

---

##  Features

###  Authentication & Security
- **Multi-Method Login**: Support for traditional Email/Password and **Google OAuth 2.0 Single Sign-On**.
- **Email Verification**: OTP-based email verification using **Nodemailer** & dynamic **EJS HTML templates**.
- **JWT Authentication & Token Rotation**: Dual-token architecture with HTTP-only cookies and Authorization Bearer header support.
- **Password Reset Flow**: Secure OTP verification for forgotten password reset workflows.
- **Role-Based Access Control (RBAC)**: Fine-grained authorization guards supporting `PATIENT`, `DONOR`, `ADMIN`, and `SUPER_ADMIN`.

###  Donor Management & Matching
- **Donor Registration & Availability**: Donors can update availability status, blood group, last donation date, and location.
- **Eligible Donor Search**: Advanced search & filtering API based on blood compatibility, location (city, district), and availability.
- **Cloudinary Image Upload**: Profile photo uploads powered by **Multer** middleware and **Cloudinary** cloud storage.

### Emergency Blood Requests & Workflow
- **Request Creation**: Patients and admins can log urgent blood requests with required units, hospital details, and urgency levels.
- **Donor Compatibility Engine**: Automatic matching of active requests with compatible donors.
- **Request Lifecycle**: Complete workflow management from creation (`PENDING`), donor acceptance (`ACCEPTED`), to completion (`COMPLETED`) or cancellation.

###  Monetary Donations & bKash Integration
- **bKash Payment Gateway**: Complete integration with bKash Tokenized Payment API.
- **Payment Lifecycle**: Payment initiation, automated bKash callback handling, status query endpoints, and webhooks.
- **Transaction History**: User donation tracking and receipt details.

###  Admin Management & Analytics
- **System Dashboard Stats**: Overview of overall platform activity, user counts, donation stats, and financial metrics.
- **User Management**: Admin tools to view all accounts, change user roles, and suspend/block users.
- **Audit Logging**: Security log tracking for critical administrative and system events.

---

##  Tech Stack

| Domain | Technology |
|---|---|
| **Runtime Environment** | Node.js (v20+) |
| **Framework** | Express 5 |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma 7 |
| **Caching / Sessions** | Redis |
| **Authentication** | JSON Web Token (JWT), bcryptjs, Google Auth Library |
| **Payment Gateway** | bKash Tokenized API (Sandbox & Production) |
| **File Storage** | Cloudinary (via Multer) |
| **Email Service** | Nodemailer with EJS Templating |
| **Validation & Linting** | Zod Schema Validation, Biome JS |
| **Containerization** | Docker, Multi-Stage Dockerfile, Nixpacks |

---

##  Project Architecture & Structure

```
blood-donation-backend/
├── prisma/
│   ├── schema/                      # Modular Prisma schemas
│   │   ├── schema.prisma            # Datasource & generator setup
│   │   ├── user.prisma              # Base User entity
│   │   ├── donor.prisma             # Donor profile schema
│   │   ├── patient.prisma           # Patient profile schema
│   │   ├── blood_request.prisma     # Blood request workflow models
│   │   ├── payment.prisma           # Payment transaction models
│   │   ├── audit.prisma             # Audit logging model
│   │   └── enums.prisma             # Role, BloodGroup, Status enums
│   └── migrations/                  # Database SQL migration files
├── src/
│   ├── server.ts                    # Entrypoint: Database connection & server start
│   ├── app.ts                       # Express application setup, middlewares, routes
│   └── app/
│       ├── config/                  # Centralized environment configurations
│       ├── lib/                     # Third-party wrappers (Prisma client, Multer, etc.)
│       ├── middleware/              # Auth guards, request validators, global error handlers
│       ├── utils/                   # JWT helpers, seed scripts, response wrappers
│       └── module/                  # Feature Modules (Routes, Controllers, Services, Validations)
│           ├── admin/
│           ├── auth/
│           ├── bloodRequest/
│           ├── file/
│           ├── payment/
│           └── user/
├── Blood_Donation_Platform.postman_collection.json  # Exported Postman API collection
├── Dockerfile                       # Multi-stage production build container
├── docker-entrypoint.sh             # Startup script running Prisma migrations
└── package.json
```

---

##  Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: `v20.x` or higher
- **npm** / **yarn** / **pnpm**
- **PostgreSQL**: `v14` or higher
- **Redis**: `v6` or higher (Optional, for caching features)

---

##  Getting Started & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/rabbiWD/Blood-Donation-Platform-Server.git
cd Blood-Donation-Platform-Server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to create your own `.env` file:
```bash
cp .env.example .env
```
Fill in your database URL and required secret keys in `.env` (refer to the [Environment Variables Guide](#-environment-variables-guide)).

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

### 5. Run Database Migrations
```bash
npm run prisma:migrate
```
*For local development development schema sync:*
```bash
npx prisma db push --schema=prisma/schema
```

### 6. Start the Server

- **Development Mode** (with live reload):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm run build
  npm run start
  ```

Server will start on `http://localhost:5000` (or specified `PORT`).

---

##  Environment Variables Guide

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `PORT` | HTTP Port for the application server | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/blood_donation_db` |
| `FRONTEND_URL` | Client Web App URL (CORS allowed origin) | `http://localhost:3000` |
| `BACKEND_URL` | Public Server URL | `http://localhost:5000` |
| `JWT_ACCESS_SECRET` | Secret key for signing Access Tokens | `your_access_secret_key` |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | `your_refresh_secret_key` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `BCRYPT_SALT_ROUNDS` | Hash salt rounds for passwords | `10` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google login | `your-google-client-id` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name for media | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your-api-secret` |
| `BKASH_BASE_URL` | bKash API Endpoint | `https://tokenized.sandbox.bka.sh/v1.2.0-beta` |
| `BKASH_APP_KEY` | bKash App Key | `your-bkash-app-key` |
| `BKASH_APP_SECRET` | bKash App Secret | `your-bkash-app-secret` |
| `BKASH_USERNAME` | bKash Merchant Username | `your-bkash-username` |
| `BKASH_PASSWORD` | bKash Merchant Password | `your-bkash-password` |
| `SMTP_USER` | SMTP Username for email delivery | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP App Password | `your-app-password` |

---

##  Database Seeding

The application features automated seed utilities in `src/app/utils/seed.ts` for quick developer onboarding and testing.

### Default Seeded Accounts:
- **Super Admin Account**:
  - Email: Defined by `SUPER_ADMIN_EMAIL` (default: `superadmin@gmail.com`)
  - Password: Defined by `SUPER_ADMIN_PASSWORD` (default: `Super@admin12345`)
- **Tester Admin Account**:
  - Email: `admin@blooddonation.com`
  - Password: `Admin@123456`
- **Demo Donor Account**:
  - Email: `donor@blooddonation.com`
  - Password: `Donor@123456`
  - Blood Group: `O_POSITIVE` | Location: `Dhaka`

---

##  API Documentation

### Base URL: `http://localhost:5000/api/v1`

---

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new User / Patient / Donor account |
| `POST` | `/auth/verify-email` | Public | Verify user account with OTP received via email |
| `POST` | `/auth/login` | Public | User login with email and password |
| `POST` | `/auth/google` | Public | Authenticate/Register user via Google OAuth Token |
| `GET` | `/auth/me` | Logged In Users | Get currently logged in user profile & permissions |
| `POST` | `/auth/refresh-token` | Public | Generate a new Access Token using Refresh Token |
| `POST` | `/auth/forgot-password` | Public | Send password reset OTP to user email |
| `POST` | `/auth/reset-password` | Public | Reset password using OTP |

---

### 2. User & Donor Profile (`/api/v1/users`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `PATCH` | `/users/me` | All Roles | Update personal account profile details |
| `PATCH` | `/users/donor-profile` | Donor, Admin, Super Admin | Update donor availability, blood group & contact info |
| `GET` | `/users/donors` | All Logged In Roles | Search and filter active, eligible blood donors |
| `PATCH` | `/users/profile-image` | All Roles | Upload or update profile picture via Cloudinary |

---

### 3. Blood Requests (`/api/v1/blood-requests`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/blood-requests` | Patient, Admin, Super Admin | Create an urgent emergency blood request |
| `GET` | `/blood-requests` | Public | List all active blood requests with filter options |
| `GET` | `/blood-requests/my-requests` | Patient, Admin, Super Admin | View requests posted by the logged-in user |
| `GET` | `/blood-requests/compatible-requests` | Donor, Admin, Super Admin | View requests compatible with logged-in donor's blood group |
| `GET` | `/blood-requests/:id` | Public | Fetch detailed information of a specific request |
| `PATCH` | `/blood-requests/:id` | Patient, Admin, Super Admin | Update details of an existing blood request |
| `DELETE` | `/blood-requests/:id` | Patient, Admin, Super Admin | Delete/Cancel a blood request |
| `POST` | `/blood-requests/:id/accept` | Donor, Admin, Super Admin | Donor accepts an emergency blood request |
| `PATCH` | `/blood-requests/:id/complete` | Patient, Admin, Super Admin | Mark blood donation process as successfully completed |

---

### 4. Payments & Donations (`/api/v1/payments`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/payments/initiate` | All Logged In Roles | Initiate a monetary donation via bKash gateway |
| `GET` | `/payments/bkash/callback` | Public | bKash server callback handler URL |
| `GET` | `/payments/bkash/query/:paymentId` | All Logged In Roles | Check payment status from bKash gateway |
| `POST` | `/payments/webhook` | Public | Webhook listener for payment execution notifications |
| `GET` | `/payments/history` | All Logged In Roles | View logged-in user's payment transaction history |
| `GET` | `/payments/:id` | All Logged In Roles | Retrieve receipt details for a specific payment |

---

### 5. Admin & Analytics (`/api/v1/admin`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin, Super Admin | Fetch list of all system users with search & pagination |
| `PATCH` | `/admin/users/:id/status` | Admin, Super Admin | Update user status (`ACTIVE`, `BLOCKED`, `SUSPENDED`) |
| `PATCH` | `/admin/users/:id/role` | Admin, Super Admin | Change user role (`PATIENT`, `DONOR`, `ADMIN`, `SUPER_ADMIN`) |
| `GET` | `/admin/dashboard-stats` | Admin, Super Admin | Retrieve platform analytics summary & metrics |
| `GET` | `/admin/audit-logs` | Admin, Super Admin | View platform security and audit logs |

---

##  Docker & Deployment

### Run with Docker

1. **Build Docker Image**:
   ```bash
   docker build -t blood-donation-backend .
   ```

2. **Run Docker Container**:
   ```bash
   docker run -p 5000:5000 --env-file .env blood-donation-backend
   ```

### Deploying to Cloud Services (Railway / Render / VPS)
- This project includes ready-to-use deployment scripts and configurations:
  - **`railway.json`**: Preconfigured for seamless Railway deployment using Dockerfile builder.
  - **`nixpacks.toml`**: Optimized configuration for Nixpacks environments.
  - **`docker-entrypoint.sh`**: Ensures automatic database migrations on container launch.

---

