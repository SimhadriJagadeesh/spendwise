# Spendwise — Smart Financial Management & Analytics Platform

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-25_LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Tests-21_Passed-brightgreen)](#testing--verification)

**Spendwise** is an enterprise-grade personal finance and expenditure intelligence web application. It combines deep expense tracking, dynamic budgeting, automated recurring payment schedules, interactive savings goal ledgers, financial calculators, and a restricted **Master Administrator Console** with complete user dossier inspection and platform oversight.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser)"]
        UI["React 18 SPA (Vite + Tailwind CSS)"]
        Router["React Router v6"]
        AuthCtx["Auth Context (JWT State & Roles)"]
        ThemeCtx["Theme Context (Dark / Light)"]
        Charts["Recharts Visualizations"]
    end

    subgraph Gateway ["Security & Network Layer"]
        CORS["CorsConfigurationSource (Port 5173 Allowed)"]
        SecurityFilter["Spring Security Filter Chain"]
        JWTFilter["JwtAuthFilter (Bearer Token Validation)"]
    end

    subgraph Controllers ["REST Controller Layer (/api/v1)"]
        AuthCtrl["AuthController (/auth)"]
        AdminCtrl["AdminController (/admin)"]
        TxCtrl["TransactionController (/transactions)"]
        CatCtrl["CategoryController (/categories)"]
        BudgetCntrl["BudgetController (/budgets)"]
        GoalCtrl["SavingsGoalController (/goals)"]
        RecurCtrl["RecurringTransactionController (/recurring)"]
        AnalytCtrl["AnalyticsController (/analytics)"]
    end

    subgraph Services ["Business Service Layer"]
        AuthSvc["AuthService"]
        AdminSvc["Admin Oversight & Stats"]
        TxSvc["TransactionService"]
        CatSvc["CategoryService"]
        BudgetSvc["BudgetService"]
        GoalSvc["SavingsGoalService"]
        RecurSvc["RecurringTransactionService"]
        DateCalc["RecurringDateCalculator"]
    end

    subgraph DataAccess ["Data Persistence Layer (JPA / Hibernate)"]
        Repo["Spring Data Repositories (Per-User Scoped)"]
        subgraph DB ["Database Storage"]
            MySQL[("MySQL 8.0 / H2 File Storage")]
        end
    end

    UI --> Router
    Router --> AuthCtx
    Router --> ThemeCtx
    UI --> Charts

    UI -- "HTTPS / JSON REST API" --> CORS
    CORS --> SecurityFilter
    SecurityFilter --> JWTFilter
    JWTFilter --> Controllers

    AuthCtrl --> AuthSvc
    AdminCtrl --> AdminSvc
    TxCtrl --> TxSvc
    CatCtrl --> CatSvc
    BudgetCntrl --> BudgetSvc
    GoalCtrl --> GoalSvc
    RecurCtrl --> RecurSvc
    RecurCtrl --> DateCalc

    AuthSvc --> Repo
    AdminSvc --> Repo
    TxSvc --> Repo
    CatSvc --> Repo
    BudgetSvc --> Repo
    GoalSvc --> Repo
    RecurSvc --> Repo

    Repo --> DB
```

---

## 🔄 User Authentication & Navigation Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (User / Admin)
    participant Front as Frontend (React App)
    participant API as AuthController (/api/v1/auth)
    participant JWT as JwtAuthFilter & JwtUtil
    participant SEC as Spring Security Context
    participant DB as MySQL Database

    Note over User,Front: 1. Registration / Sign-In
    User->>Front: Enters credentials (email/username + password)
    Front->>API: POST /api/v1/auth/login
    API->>DB: Query User by Username or Email
    DB-->>API: User Record with BCrypt Hash
    API->>API: PasswordEncoder.matches(plainPassword, passwordHash)
    
    alt Invalid Credentials
        API-->>Front: 401 Unauthorized ("Invalid credentials")
        Front-->>User: Displays error notification
    else Valid Credentials
        API->>JWT: generateToken(username, role)
        JWT-->>API: Signed HS256 JWT Token
        API-->>Front: 200 OK { token, username, role, email }
        Front->>Front: Store token & role in localStorage
        
        alt Role == ADMIN
            Front-->>User: Redirect to /admin (Admin Oversight Console)
        else Role == USER
            Front-->>User: Redirect to /dashboard (Personal Finance Hub)
        end
    end

    Note over User,Front: 2. Authenticated API Requests
    User->>Front: Interacts with Transactions / Budgets
    Front->>JWT: Request with Header: "Authorization: Bearer <token>"
    JWT->>JWT: Verify HS256 Signature & Expiration
    JWT->>SEC: Set Authentication Token (Principal = username)
    SEC->>DB: Service executes query filtered by Principal
    DB-->>Front: Return isolated, user-scoped data
```

---

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : "owns"
    USERS ||--o{ TRANSACTIONS : "records"
    USERS ||--o{ BUDGETS : "defines"
    USERS ||--o{ SAVINGS_GOALS : "creates"
    USERS ||--o{ RECURRING_TRANSACTIONS : "schedules"
    SAVINGS_GOALS ||--o{ GOAL_CONTRIBUTIONS : "accumulates"
    CATEGORIES ||--o{ TRANSACTIONS : "classifies"
    CATEGORIES ||--o{ BUDGETS : "scoped_to"
    CATEGORIES ||--o{ RECURRING_TRANSACTIONS : "assigns"

    USERS {
        bigint id PK
        varchar username UK "Case-insensitive unique"
        varchar email UK "Case-insensitive unique"
        varchar password_hash "BCrypt encoded, @JsonIgnore"
        varchar role "USER or ADMIN"
        boolean enabled "Account active flag"
        timestamp created_at
    }

    CATEGORIES {
        bigint id PK
        bigint user_id FK
        varchar name "e.g. Groceries, Shopping"
        varchar type "INCOME or EXPENSE"
        varchar color "6-digit hex color"
    }

    TRANSACTIONS {
        bigint id PK
        bigint user_id FK
        bigint category_id FK "Nullable on category deletion"
        decimal amount "Positive currency amount"
        varchar type "INCOME, EXPENSE, TRANSFER"
        varchar currency "ISO 4217, e.g. USD, EUR, INR"
        date transaction_date
        varchar description
        timestamp created_at
    }

    BUDGETS {
        bigint id PK
        bigint user_id FK
        bigint category_id FK
        varchar period "MONTHLY or YEARLY"
        varchar month "YYYY-MM format"
        decimal amount "Spending limit"
        varchar currency
    }

    SAVINGS_GOALS {
        bigint id PK
        bigint user_id FK
        varchar name
        decimal target_amount
        decimal current_amount
        varchar currency
        date deadline
        boolean completed
        timestamp created_at
    }

    GOAL_CONTRIBUTIONS {
        bigint id PK
        bigint goal_id FK
        decimal amount
        date contribution_date
        varchar notes
    }

    RECURRING_TRANSACTIONS {
        bigint id PK
        bigint user_id FK
        bigint category_id FK
        varchar name
        decimal amount
        varchar type
        varchar frequency "DAILY, WEEKLY, MONTHLY, YEARLY"
        int interval_count
        date next_payment_date
        boolean active
    }
```

---

## 🚀 Key Features

### 1. 💳 Intelligent Transaction Engine
- **Preset Categories & Quick Chips**: One-click quick adds for **Groceries 🛒**, **Shopping 🛍️**, **Dining & Food 🍔**, **Transportation 🚗**, **Bills & Utilities ⚡**, **Salary 💼**, **Investments 📈**, and more.
- **Advanced Filtering**: Full-text keyword search, type filter (`INCOME`, `EXPENSE`, `TRANSFER`), currency selection, date-range picker, and custom sorting (`amount`, `transactionDate`, `createdAt`).
- **CSV Data Export**: Secure CSV export with formula injection sanitization.

### 2. 🛡️ Master Administrator Console (`/admin`)
- **Restricted Access Portal**: Clean, dedicated administrator login page (`/admin/login`) with no registration link and interactive password visibility toggle.
- **Platform Analytics**: Real-time aggregate telemetry of total users, total transactions, system volume, active budgets, and savings goals.
- **Deep User Dossiers**: Interactive modal to inspect individual user profiles, creation dates, enabled/disabled status, and associated records.
- **User Moderation**: Immediate account enable/disable suspension toggle and deletion safety controls.

### 3. 🧮 Comprehensive Financial Calculators Suite
- **SIP (Systematic Investment Plan) Calculator**: Compound returns, total wealth accumulation, and invested vs. earned breakdown.
- **Loan EMI Calculator**: Monthly installment calculation, total interest payable, and amortization schedule summary.
- **Compound Interest Calculator**: Compounding frequency modeling (monthly, quarterly, annually) with inflation adjustment.
- **Emergency Fund Planner**: Calculates essential survival safety net based on monthly expenses and dependency buffers.
- **Retirement Wealth Planner**: Future value of retirement nest-egg factoring annual savings, expected ROI, and years to retirement.

### 4. 📊 Visual Analytics & Reports
- **Cash Flow Trends**: Interactive bar and area charts powered by **Recharts** displaying monthly Income vs. Expense trajectories.
- **Category Spending Distribution**: Responsive donut charts visualizing expenditure proportions with custom category color palettes.
- **Budget Health Tracking**: Real-time spending progress bars warning when spending approaches 80% or exceeds 100% of limits.

### 5. 🎯 Savings Goals & Ledgers
- Set milestone targets with deadlines and target amounts.
- Atomic contribution transactions with automated status transitions (`completed = true` upon reaching 100%).

### 6. 🔁 Recurring Subscriptions & Schedules
- Automatic interval calculators for daily, weekly, monthly, and yearly recurring obligations.
- One-click advance payment progression and active/paused state toggling.

### 7. 🎨 UI/UX Excellence & Theming
- **Dual Theme Support**: Persistent Dark & Light modes with smooth transitions.
- **Eye Password Toggle**: Accessible show/hide visibility toggles on both user and administrator authentication pages.
- **Currency Flexibility**: Multi-currency support across USD ($), EUR (€), GBP (£), INR (₹), JPY (¥), CAD ($), and AUD ($).

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Backend Framework** | **Spring Boot 3.3.4** | Robust REST API microservice architecture |
| **Language** | **Java 25 (LTS)** | Strongly typed, high-performance runtime |
| **Security** | **Spring Security 6 + JJWT** | Stateless HS256 JWT authentication & role-based authorization |
| **ORM / Persistence** | **Spring Data JPA & Hibernate 6** | Declarative repositories, atomic transactions, schema validation |
| **Migration** | **Flyway** | Versioned database migrations |
| **Database** | **MySQL 8.0 & H2 Database** | Production MySQL persistence with zero-config H2 file fallback |
| **Frontend Framework**| **React 18.3** | Component-driven reactive user interface |
| **Build Tool** | **Vite 5.4** | Ultra-fast HMR and optimized production bundling |
| **Styling** | **Tailwind CSS 3.4** | Modern utility-first responsive styling |
| **Visualization** | **Recharts 2.12** | Declarative, SVG-based responsive financial charts |
| **Routing** | **React Router DOM 6.26** | Single-page application route management & protected route guards |

---

## ⚙️ Local Development & Setup

### Prerequisites
- **JDK 17+** (JDK 25 recommended)
- **Node.js 18+** & `npm`
- **Maven 3.8+**
- **MySQL 8.0** (optional; the app runs automatically with embedded persistent file storage)

### 1. Environment Configuration

Copy the example environment template:
```powershell
Copy-Item .env.example .env
```

Default environment variables:
```properties
DB_URL=jdbc:mysql://localhost:3306/spendwise?useSSL=false&serverTimezone=UTC
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=c3BlbmR3aXNlLXNlY3VyZS1qd3Qta2V5LWF0LWxlYXN0LTMyLWNoYXJzIQ==
JWT_EXPIRATION_MS=86400000
FRONTEND_URL=http://localhost:5173
```

### 2. Running the Backend

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```
*The backend starts at `http://localhost:8080` with API endpoints accessible under `/api/v1`.*

### 3. Running the Frontend

```powershell
cd frontend
npm install
npm run dev
```
*The frontend starts at `http://localhost:5173`.*

---

## 🧪 Testing & Verification

The project includes automated test coverage for core business logic, transaction calculations, and export formatting:

```powershell
# Backend test suite (21 unit & integration tests)
cd backend
mvn clean test

# Frontend linting & build verification
cd frontend
npm run lint
npm run build
```

**Verification Results:**
- ✅ **Backend Compilation**: `BUILD SUCCESS` (62 files, 0 errors, 0 warnings).
- ✅ **Backend Unit Tests**: 21 / 21 tests passed (0 failures, 0 errors).
- ✅ **Frontend Lint**: 0 warnings, 0 errors.
- ✅ **Frontend Production Bundle**: Built cleanly in 2.03s.

---

## 🔒 Security Model

- **Credential Isolation**: User passwords are encrypted using **BCrypt** with salted hashing. User password hashes are annotated with `@JsonIgnore` and never serialized across API responses.
- **Tenant Isolation**: Every database query explicitly checks the authenticated principal (`user.username`). No endpoint permits passing arbitrary user IDs to access private transactions.
- **Formula Injection Mitigation**: CSV export outputs escape leading symbols (`=`, `+`, `-`, `@`) with apostrophes to protect against spreadsheet formula execution vulnerabilities.
- **CORS Protection**: Restricted to the configured `FRONTEND_URL` with explicit methods and allowed headers.

---

## 📄 License
This project is licensed under the MIT License.
