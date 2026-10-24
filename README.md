# CarrelageArwa — Business Management & POS System

A modern business management and Point of Sale (POS) application designed for **CarrelageArwa**, a Moroccan store specializing in tiles, sanitary equipment, faucets, water heaters, and other construction and bathroom products.

The application aims to centralize sales, inventory, purchases, supplier management, customer records, payments, and financial tracking in one place, with prices and transactions managed in Moroccan dirhams (MAD).

**Repository:** [NadaKryach/CarrelageArwa](https://github.com/NadaKryach/CarrelageArwa)

---

## Table of Contents

- [Overview](#overview)
- [Objectives](#objectives)
- [Features](#features)
- [Product Categories](#product-categories)
- [Inventory Management](#inventory-management)
- [Sales and Point of Sale](#sales-and-point-of-sale)
- [Purchasing and Supplier Management](#purchasing-and-supplier-management)
- [Customer Management](#customer-management)
- [Financial Management](#financial-management)
- [Documents and Printing](#documents-and-printing)
- [User Interface](#user-interface)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Build and Deployment](#build-and-deployment)
- [Data Management and Security](#data-management-and-security)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CarrelageArwa is a business management application intended to simplify the daily operations of a Moroccan retail business specializing in building materials and bathroom equipment.

Managing products sold in different units, monitoring stock, recording customer sales, tracking supplier debts, and calculating financial totals can become complicated when handled manually. This application aims to bring these operations together in a single digital workspace.

The system is designed around the specific needs of a tile and sanitary equipment store, including the relationship between tile boxes, individual tiles, and square metres.

All financial values are intended to be expressed in **Moroccan dirhams (MAD)**.

## Objectives

The main objectives are to:

- Centralize product and inventory information.
- Simplify sales and purchasing operations.
- Track stock quantities and product movements.
- Manage customer and supplier information.
- Monitor supplier payments and outstanding balances.
- Record sales, expenses, and financial transactions.
- Generate professional receipts and invoices.
- Support appropriate units of measurement for tiles and other products.
- Reduce manual calculations and administrative errors.
- Provide an accessible interface for everyday store operations.

## Features

The following sections describe the intended functional scope of the application. Individual features should be verified against the current implementation before being considered production-ready.

### 1. Dashboard

The dashboard serves as the main overview of the business.

Potential indicators include:

- Total sales.
- Total purchases.
- Current inventory value.
- Outstanding customer balances.
- Outstanding supplier balances.
- Recent transactions.
- Low-stock products.
- Sales and financial summaries over a selected period.

### 2. Product and Category Management

The product management module is intended to support:

- Creating new products.
- Viewing product details.
- Editing product information.
- Deleting or archiving products.
- Organizing products by category.
- Recording purchase and selling prices.
- Managing stock quantities and units.
- Searching and filtering the product catalogue.

Each product may contain information such as:

| Field | Description |
|---|---|
| Product name | Name of the item |
| Reference | Unique product identifier |
| Category | Product classification |
| Purchase price | Acquisition cost |
| Selling price | Retail price |
| Quantity | Available stock |
| Unit | Unit of measurement |
| Supplier | Associated supplier |
| Description | Additional product details |

### 3. Inventory Management

Inventory management helps keep track of available products and stock movements.

Intended capabilities include:

- Monitoring current stock.
- Recording incoming stock from purchases.
- Updating stock following sales.
- Correcting inventory discrepancies.
- Identifying low-stock products.
- Maintaining product references and units.
- Reviewing stock movement history.

Inventory quantities should be updated consistently when a sale, purchase, return, or approved stock adjustment is recorded.

### 4. Tile Unit Conversion

Because tiles can be sold by the square metre, by the box, or by the individual tile, the system is intended to support unit conversion.

For a product with known coverage per box:

**Square metres represented by a quantity of boxes**

`Total area (m²) = Number of boxes × Area per box (m²)`

**Number of boxes required for a target area**

`Boxes required = Ceiling(Target area ÷ Area per box)`

For example, if one box covers 1.5 m² and a customer requires 30 m²:

- Required area: 30 m²
- Coverage per box: 1.5 m²
- Required quantity: 20 boxes

The application should store each product's conversion parameters and handle rounding consistently.

Where individual tiles are tracked, the relationship between tiles per box, box coverage, and total stock must be configured for the relevant product.

### 5. Sales and Point of Sale (POS)

The sales module is intended to facilitate daily transactions.

Expected workflows include:

1. Selecting products.
2. Entering quantities and units.
3. Calculating line totals.
4. Applying authorized discounts where supported.
5. Selecting or recording a customer.
6. Recording the payment method and amount.
7. Calculating the remaining balance when applicable.
8. Saving the transaction.
9. Updating stock.
10. Generating a receipt or invoice.

The sales interface should provide clear totals and minimize manual calculations.

### 6. Customer Management

The customer module is intended to centralize customer information.

Possible fields include:

- Customer name.
- Telephone number.
- Address.
- Customer reference.
- Transaction history.
- Outstanding balance.
- Notes.

This information can help the business review previous purchases and track amounts owed by customers.

### 7. Supplier Management

The supplier module is intended to manage supplier information and purchasing relationships.

Potential features include:

- Adding and editing supplier records.
- Recording contact information.
- Associating products with suppliers.
- Recording purchases.
- Tracking payments made to suppliers.
- Monitoring outstanding supplier balances.
- Reviewing purchase history.

### 8. Purchasing Management

The purchasing module is intended to record stock acquisitions.

A purchase record may include:

- Supplier.
- Purchase date.
- Purchased products.
- Quantities and units.
- Unit purchase prices.
- Total purchase amount.
- Amount paid.
- Remaining balance.
- Payment history.

Confirmed purchases should update inventory according to the application's stock-management rules.

### 9. Financial Management

The financial module is intended to provide a consolidated view of business transactions.

Potential capabilities include:

- Recording income and expenses.
- Tracking customer payments.
- Tracking supplier payments.
- Reviewing sales and purchase totals.
- Monitoring outstanding balances.
- Filtering transactions by date.
- Viewing transaction histories.
- Calculating sales and cost summaries.

Financial reports should distinguish revenue, purchase costs, expenses, cash received, and outstanding debts. Sales revenue alone should not be treated as net profit.

### 10. Receipts and Invoices

The application is intended to support printable business documents.

Possible document types include:

- Sales receipts.
- Customer invoices.
- Purchase records.
- Supplier payment receipts.
- Customer payment receipts.

Documents should display relevant information, including the business name, document reference, date, product descriptions, quantities, unit prices, totals, and payment details.

A consistent printing layout should be used across the application, with an A5 format as the intended default where appropriate.

### 11. Search and Filtering

Search and filtering can make daily operations faster by helping users locate:

- Products by name or reference.
- Customers by name or telephone number.
- Suppliers by name.
- Sales by date or reference.
- Purchases by supplier or date.
- Payments and financial transactions.
- Products requiring restocking.

### 12. Developer and Administration Panel

The project may include an administration area for technical configuration and maintenance.

Depending on the implementation, this could support application settings, data inspection, maintenance operations, and diagnostics.

Administrative operations should be protected from unauthorized access and separated from routine sales workflows.

---

## Product Categories

The application is intended for stores selling products in the following categories:

| Category | Examples |
|---|---|
| Carrelage | Floor tiles and wall tiles |
| Sanitaires | Washbasins, toilets, and bathroom fixtures |
| Robinetterie | Faucets, mixers, and shower fittings |
| Chauffe-eau | Water heaters |
| Construction products | Other related building materials |
| Bathroom accessories | Complementary bathroom products |

Categories should be configurable so the catalogue can evolve with the business.

## Technology Stack

The repository includes configuration and source files associated with the following technologies:

- **TypeScript** — typed JavaScript development.
- **Vite** — frontend development server and build tooling.
- **Bun** — indicated by the Bun lockfile and suitable for package management and script execution.
- **Node.js-compatible server tooling** — the repository contains a `server.ts` entry point.

The precise frontend framework, database technology, and additional libraries need to be confirmed from `package.json` and the source files.

## Project Structure

The repository currently includes the following top-level files and directories:

```text
CarrelageArwa/
├── data/              # Data-related files
├── src/               # Application source code
├── .env.example       # Example environment configuration
├── .gitignore         # Git exclusion rules
├── bun.lock           # Bun dependency lockfile
├── index.html         # HTML entry point
├── metadata.json      # Application metadata
├── package.json       # Dependencies and scripts
├── server.ts          # Server entry point
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

The exact contents and responsibilities of individual modules should be confirmed by inspecting the source code.

## Prerequisites

Before running the application, install:

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/)

A compatible Node.js installation may also be necessary depending on the scripts and server runtime configured in the project.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/NadaKryach/CarrelageArwa.git
cd CarrelageArwa
```

### 2. Install dependencies

Using Bun:

```bash
bun install
```

### 3. Configure environment variables

Inspect `.env.example` and create a local `.env` file if required by the application.

Copy only the variables documented by the project, then fill in the appropriate values.

Do not commit passwords, API keys, tokens, or other secrets to the repository.

### 4. Start the application

Check the available scripts in `package.json`:

```bash
bun run
```

Run the development script defined by the project. For example, if the package scripts include `dev`:

```bash
bun run dev
```

The exact commands depend on the scripts currently configured in the repository.

## Environment Configuration

The `.env.example` file provides the starting point for environment configuration.

Environment variables may be used for server configuration, API credentials, database connections, or other services, depending on the implementation.

For security:

- Keep production secrets outside the source code.
- Never publish private credentials.
- Use separate configurations for development and production.
- Validate required variables when the server starts.
- Use secure connection settings for production services.

Do not add variable names that are not actually supported by the application.

## Supabase Database Setup

The server uses Supabase as its only runtime data store. It does not read or write `data/database.json`.

1. In the Supabase Dashboard, open the SQL Editor and run `supabase/migrations/20261024170000_create_app_state.sql`.
2. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in your local `.env` file. Keep the secret key on the server only.
3. Import the existing local data once by running:

```bash
npm run supabase:migrate-data
```

The import command requires the SQL migration to have completed successfully. Keep `data/database.json` as a backup until you have verified the imported data in Supabase.

## Running the Application

A typical development workflow is:

1. Clone the repository.
2. Install dependencies.
3. Configure required environment variables.
4. Start the development server using the configured script.
5. Open the local address printed in the terminal.
6. Test the relevant application modules.

If the frontend and backend use separate processes, start each process according to the scripts and instructions defined by the project.

## Build and Deployment

Before deployment, verify that the application builds successfully and that all required runtime services are available.

If a `build` script exists in `package.json`, run:

```bash
bun run build
```

Deployment requirements depend on the actual architecture, including whether the application uses a separate server, external database, or persistent local storage.

A production deployment should include:

- Secure environment configuration.
- Appropriate access controls.
- Reliable data persistence.
- Regular backups.
- Error logging and monitoring.
- Testing of sales, stock updates, and payment calculations.
- Verification of printing and document generation.

## Data Management and Security

Business applications handle commercially sensitive information, including customer details, supplier records, purchase prices, and financial transactions.

Recommended safeguards include:

- Validating all user inputs.
- Restricting administrative operations.
- Protecting customer and financial information.
- Preventing unauthorized stock or payment changes.
- Maintaining reliable transaction records.
- Backing up business data.
- Testing recovery procedures.
- Avoiding the storage of secrets in source control.

Financial and inventory operations should remain consistent even if an operation fails partway through.

The actual security measures and persistence mechanisms should be documented after reviewing the implementation.

## Future Improvements

Potential enhancements for future versions include:

- Advanced sales analytics.
- Low-stock alerts.
- Exporting reports to PDF, CSV, or Excel.
- Barcode scanning.
- Customer account statements.
- Supplier account statements.
- Detailed profit and expense reports.
- Role-based access control.
- Automatic backups and data restoration.
- Improved stock movement auditing.
- Multi-user support.
- Responsive mobile and tablet interfaces.
- Improved invoice customization.
- More comprehensive validation of tile unit conversions.

These are potential improvements, not a claim that they are already implemented.

## Contributing

Contributions and improvements should follow a structured development process:

1. Review the existing implementation.
2. Identify the relevant module.
3. Make a focused change.
4. Test the affected functionality.
5. Verify that inventory and financial calculations remain consistent.
6. Submit a clear description of the changes.

## License

No license information has been verified for this repository.

Before distributing or reusing the project, add an appropriate `LICENSE` file specifying the permissions and restrictions for its use.

---

**CarrelageArwa — Simplifying store management, one transaction at a time.**
