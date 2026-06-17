# Transaction Data Validation and Processing Platform

An end-to-end web-based platform for uploading, validating, chunking, and downloading transaction CSV data.

## Features
- **Frontend**: Built with React, TypeScript, and Tailwind CSS v4. Features a responsive file upload zone, live upload progress, and a dynamic dashboard for viewing validation statistics.
- **Backend**: Built with Node.js and Express. Parses CSV streams efficiently, performs row-level logic checks, generates chunked CSV files, and bundles them into a ZIP archive.
- **Validation**: Comprehensive rules mapping spanning missing required fields, country-specific phone formatting, date and time format verification, calculated amount precision tolerance checks, and duplicate unique-key detection.
- **Download Actions**: Seamless download interface for retrieving Cleaned data, Error summaries, and complete ZIP packages.

## Live Application
**Hosted Product URL:** [https://xeno-u5jd-git-main-devdarsh1104s-projects.vercel.app/](https://xeno-u5jd-git-main-devdarsh1104s-projects.vercel.app/)

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Axios, Lucide React
- Backend: Node.js, Express, TypeScript, Multer, Papaparse, Archiver

## Validation Rules
The system validates rows based on the following configurations (which can be customized in `shared/validation-config.ts`):
1. **Order Level**: `order_id` is required and checked for duplicates. `customer_name` is required.
2. **Product Level**: `product_id` and `product_name` required. `quantity` must be positive int. `unit_price` must be `≥ 0`. `quantity * unit_price` must equal `total_amount` (with a `0.01` tolerance allowed).
3. **Payment**: Allowed modes (`CASH`, `CARD`, `UPI`, `BANK_TRANSFER`, `WALLET`), allowed statuses (`PAID`, `PENDING`, `FAILED`, `REFUNDED`). `transaction_id` is required when `PAID` and checked for duplicates.
4. **Phone validation**: Matches specific rules based on `country_code` (e.g. `SG` = 8 digits, `IN` = 10 digits). Unknown countries are rejected. Spaces and brackets are cleaned beforehand.
5. **Dates & Times**: Enforces allowed formats `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`. Validates against true calendar limits (e.g., February 31st is rejected). Time enforces `HH:mm` or `HH:mm:ss` (24-hour).

## Project Setup & Running Locally

### 1. Install Dependencies
Open two terminal windows (one for server, one for client):

**Backend (Server)**
```bash
cd server
npm install
```

**Frontend (Client)**
```bash
cd client
npm install
```

### 2. Start the Application

**Run the Backend (Port 5001)**
```bash
cd server
npm run dev
```

**Run the Frontend (Port 5173)**
```bash
cd client
npm run dev
```

### 3. Run Automated Tests
```bash
cd server
npm run test
```

## Submission Write-up
**Approach**: I designed a completely separated frontend and backend system to emulate real-world production environments where large CSV parsing is deferred to server instances. The validator is entirely self-contained, using TypeScript strictly for type safety and utilizing simple array-based validations to quickly classify valid rows, catch duplicate keys incrementally, and cleanly chunk files into downloadable zip archives using native Node streams.
**Tradeoffs**: In this simple local deployment, the backend reads the uploaded file entirely into memory and parses it synchronously before streaming out chunks. In a true multi-gigabyte production setting, we would replace the synchronous array validation with a queue-based or streaming approach (e.g., streaming chunks to S3 while verifying against a Redis duplicate-cache) to prevent V8 memory limits from maxing out.
**What was not built**: As instructed, no cloud storage (like AWS S3), queueing systems (like BullMQ), or persistent SQL databases were utilized, opting instead for local temporary storage `uploads/` with automated interval cleanup for simplicity and deployability.
