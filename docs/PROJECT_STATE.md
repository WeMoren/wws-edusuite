# WWS-EduSuite PROJECT STATE

> Living project handoff document. Update this file at major checkpoints so WWS-EduSuite can continue cleanly across ChatGPT conversations.

## 1. PROJECT IDENTITY

**Product:** WWS-EduSuite  
**Company / Brand:** WEMOREN WEB SERVICES  
**Product type:** School management SaaS  
**Goal:** Build a production-ready, sellable school management platform.

### Stack

**Frontend**
- Vite + React
- React Router
- Plain CSS
- No Tailwind
- Arrow-function components preferred

**Backend**
- Node.js + Express
- PostgreSQL
- JavaScript / ES modules
- JWT authentication
- Argon2id password hashing
- HttpOnly cookies
- Paystack for WWS-EduSuite subscription payments

**Repository**
- Root: `C:/Users/USER/Desktop/WWS-EduSuite`
- Frontend: `client`
- Backend: `server`
- Git branch: `master`
- Remote: `origin`
- Preferred push: `git push -u origin master`

## 2. DEVELOPMENT WORKING STYLE

- Work sequentially and cleanly.
- Prefer exact-file edits.
- Test meaningful changes before moving on.
- Avoid unnecessary redesigns or architecture changes.
- Use `NotificationDialog` / `ConfirmDialog`, not browser alert/confirm/prompt.
- Temporary `localStorage` is acceptable during frontend testing.
- Before frontend-backend integration, audit and remove temporary localStorage/demo truth sources.
- Commit meaningful milestones to Git.
- In a new ChatGPT conversation, use this file as the primary handoff.

## 3. BACKEND STATUS

Completed:
- Express setup
- PostgreSQL connection
- Environment configuration
- Git ignore
- Authentication
- Authorization
- School registration
- User registration
- Subscription data model/API
- Subscription lifecycle service
- Student CRUD
- Academic Session CRUD
- Academic Level CRUD
- Class CRUD
- Section CRUD
- Student Enrollment CRUD

Runtime:
- Express: port `5000`
- PostgreSQL DB: `wws_edusuite`
- PostgreSQL port: `5432`
- Development PostgreSQL version: 18.x

Key packages:
- express
- pg
- dotenv
- argon2
- cookie-parser
- cors
- jsonwebtoken
- nodemon

## 4. DATABASE MIGRATIONS 001–016

### 001 — `schools`
Tenant table. Key fields:
- `id UUID PRIMARY KEY`
- `name`
- `slug` unique
- `email` unique
- `phone`
- `address`
- `logo_url`
- `status` (`active`, `suspended`)
- timestamps

### 002 — `users`
School-scoped users. Key fields:
- `id`
- `school_id`
- first/last name
- email
- password hash
- status
- timestamps

Constraint:
`UNIQUE (school_id, email)`

### 003 — `roles`
Global role catalogue:
- `id`
- `name` unique
- `description`

### 004 — `user_roles`
Many-to-many `users ↔ roles`.
Primary key: `(user_id, role_id)`.

### 005 — `permissions`
Permission catalogue:
- `resource`
- `action`
- `description`

Constraint:
`UNIQUE (resource, action)`

### 006 — permission seeds
Existing resources:
- students
- teachers
- classes
- sections
- academicSetup
- attendance
- results
- accountant
- settings

Results also has `download`.

### 007 — `role_permissions`
Many-to-many `roles ↔ permissions`.
Primary key: `(role_id, permission_id)`.

### 008 — role/permission assignments
- **Admin:** full access to current modules.
- **Exam Officer:** student/academic read access plus results view/create/edit/download.
- **Teacher:** student/academic read access plus attendance view/create/edit.
- **Accountant:** accountant view/create/edit/delete.

Existing financial-related permission resource is `accountant`.

### 009 — subscription billing
Creates:
- `subscription_plans`
- `subscriptions`
- `subscription_payments`

IMPORTANT: WWS-EduSuite subscription payments are separate from school/student fee payments. Never reuse `subscription_payments` for school fees.

### 010 — `academic_sessions`
Key fields:
- `id`
- `school_id`
- `name`
- `start_date`
- `end_date`
- `is_current`

Constraints:
- unique session name per school
- only one current session per school
- valid date range

### 011 — `academic_levels`
Key fields:
- `id`
- `school_id`
- `name`
- `category`
- `display_order`

Level name unique per school.

### 012 — `classes`
Key fields:
- `school_id`
- `academic_session_id`
- `academic_level_id`
- `name`

A class belongs to one school, session, and academic level.

Unique:
`school + session + academic level + name`

### 013 — `sections`
Key fields:
- `school_id`
- `class_id`
- `name`
- `class_teacher_id`
- `room`
- `capacity`

A section belongs to a class.

### 014 — `students`
Key fields:
- `id`
- `school_id`
- `admission_no`
- first/middle/last name
- gender
- date of birth
- phone
- email
- address
- status
- timestamps

Admission number unique per school.

### 015 — `student_enrollments`
Key fields:
- `school_id`
- `student_id`
- `academic_session_id`
- `class_id`
- `section_id`
- `status`
- `enrolled_at`
- timestamps

Constraint:
`UNIQUE (student_id, academic_session_id)`

Academic level is derived through:
`student_enrollments.class_id → classes.academic_level_id`

Do not duplicate `academic_level_id` unnecessarily.

### 016 — `teachers`
Key fields:
- `school_id`
- `user_id`
- `staff_id`
- `subject`
- `gender`
- timestamps

Teacher user and staff IDs are unique per school.

## 5. IMPORTANT RELATIONSHIPS

Tenant:
`schools → school-owned records`

Academic:
`schools → academic_sessions → classes → sections`

Level:
`classes → academic_levels`

Student:
`schools → students → student_enrollments → academic_sessions/classes/sections`

Academic level for an enrollment:
`student_enrollments.class_id → classes.academic_level_id`

## 6. SUBSCRIPTION BUSINESS RULES

Locked:
- ₦1,200 per active/enrolled student/year
- ₦60,000 minimum annual subscription
- 30-day free trial
- No setup fee
- Trial has full access and no student limit
- After trial expiration without payment, access becomes restricted
- Data retained
- Reactivation through Paystack
- Only WWS-EduSuite subscription payments are processed by the app

## 7. SCHOOL/STUDENT FEE ACCOUNTING RULES

Locked:
- WWS-EduSuite does **not** process school/student fee payments.
- Schools choose their own payment channels: cash, transfer, POS, cheque, USSD, external platforms, etc.
- Accountant records every payment received in WWS-EduSuite.
- WWS-EduSuite records the accounting fact, updates the student balance, and generates a receipt.

## 8. FINANCIAL SYSTEM ARCHITECTURE

Approved lean model:

`Fee Structure → Student Financial Account → Payments → Balance → Receipt`

Do not add unnecessary financial subsystems.

## 9. FEE STRUCTURE RULES

A fee structure belongs to:

`School + Academic Session + Term + Academic Level`

Example:
- Tuition — ₦150,000
- Sports — ₦20,000
- Development — ₦50,000
- ICT — ₦30,000
- Other — ₦100,000
- Total — ₦350,000

The school defines individual components. The system calculates total from the items. Total is not manually entered as an independent value.

## 10. FEE STRUCTURE HISTORY / VERSIONING

Locked:
- Fee structures are historical/versioned.
- Never silently overwrite a structure already used for student financial records.
- Existing financial records retain the historical structure/version.
- New eligible students use the current applicable structure.
- Unused structures may be corrected.
- Financial history must remain stable.

## 11. STUDENT FINANCIAL ACCOUNT RULES

When a student is enrolled:
- If an applicable fee structure exists for that enrollment's session + term + academic level, the system can create the student's financial account.
- If no applicable structure exists, do not invent an amount.
- If a structure is created later, a controlled action can generate accounts for eligible existing students.

## 12. PAYMENT ALLOCATION

Locked:
Payments reduce the student's **overall balance**.

Example:
- Total due: ₦180,000
- Payment: ₦100,000
- Outstanding: ₦80,000

No component-level payment allocation for now.

## 13. STUDENT ADJUSTMENTS

Currently **not implemented**.

Do not add separate scholarship, discount, waiver, or adjustment subsystems unless explicitly reopened.

## 14. SPECIAL STUDENT FEE ARRANGEMENTS

Not modeled. School-specific arrangements remain the school's operational responsibility.

## 15. CLASS/SECTION TRANSFERS AND PROMOTIONS

Do not build special financial rules for these at this stage. Financial records work from existing enrollment/account data.

## 16. RECEIPTS

Eventually show:
- receipt number
- date
- student
- gender
- admission number
- class
- fee purpose
- fee breakdown
- total due
- amount paid
- outstanding balance
- payment method
- payment reference
- description
- accounting authorization

## 17. DOCUMENT AUTHORIZATION

Centralized School Officials / Document Authorization is the source of truth.

**Results**
- Principal
- Exam Officer

Digital assets optional; physical signature/stamp spaces always available.

**Payment receipts**
- Principal
- Accounting Officer

Digital assets optional; physical signature/stamp spaces always available.

## 18. RESULTS RULES

Locked:
- Per-term student position
- Class position
- Academic-level position
- Class position spans the whole class, including sections
- Academic-level position spans all combinations in that level
- Third-term session overall uses Term 1 + Term 2 + Term 3 average
- Attendance percentage on results
- SS2/SS3 use selected subject combinations
- Unoffered subjects do not count as zero
- Unoffered subjects do not enter the denominator
- Unoffered subject cells display hyphens and are not editable
- SS1 remains level-wide
- Competition ranking for ties

Results currently work with stable level IDs rather than level-name string checks. Previous issue involved names such as `SS 2` / `SS 3`.

Tested behavior:
- combinations work
- unoffered subjects excluded
- totals/averages/rankings correct
- PDFs work
- result authorization included

## 19. FRONTEND STATUS

Completed / near-complete:
- Dashboard
- Attendance
- Results
- Academic Setup
- Accountant payments
- Accountant expenses
- Payment receipt
- Settings
- Staff login
- Role-based sidebar
- Landing page
- WWS logo

Library currently held.

## 20. FRONTEND AUTH

Desired production login:
- email
- password
- “Welcome back”
- “Register your school”

No school ID field and no role dropdown.

Backend should return school ID, role, and JWT/session information.

Development accounts:
- `admin@wwstestschool.com`
- `teacher@wwstestschool.com`
- `accountant@wwstestschool.com`
- `examofficer@wwstestschool.com`

Role-based sidebar filtering works.

## 21. SETTINGS / DOCUMENT AUTHORIZATION

Current officials:
- Principal
- Exam Officer
- Accounting Officer

Each stores:
- name
- title
- signature
- stamp

Frontend currently stores uploaded image assets as data URLs for testing.

## 22. ACCOUNTANT / RECEIPT FRONTEND

Receipt currently includes:
- receipt number
- date
- student
- gender
- admission number
- class
- amount paid
- payment method
- description

Receipt authorization:
- Principal
- Accounting Officer

Previous class-undefined bug was fixed by passing class name from `StudentTable` into `PaymentReceipt`.

## 23. FRONTEND LOCALSTORAGE

Temporary localStorage/demo truth sources remain during testing.

Known areas:
- AuthContext / currentUser
- Settings / schoolProfile
- document authorization
- module persistence

Before backend integration:
1. Audit localStorage usage.
2. Identify demo truth sources.
3. Replace them with backend/API state.
4. Remove temporary/demo fallbacks where appropriate.

## 24. GIT CHECKPOINTS

Important historical commits:
- `fec7d9a` — Connectd backend to PostgreSQL
- `78cf9ff` — configured environment variable
- `56daf31` — chore: add gitignore
- `8121056` — added WWS-EduSuite logo
- `f939194` — Completed landing page
- `c11e364` — Support multi-combination senior secondary results

## 25. CURRENT FINANCIAL DEVELOPMENT POSITION

### Completed
- Existing migrations 001–016 inspected.
- Financial architecture agreed.
- Financial business rules agreed.
- No financial migration created yet.

### Current task
**Migration 017 — Fee Structures**

Planned tables:
- `fee_structures`
- `fee_structure_items`

Fee structure association:
- school
- academic session
- term
- academic level
- version/history information

Fee structure item:
- name
- amount
- description

Total is calculated from items.

### Schema item still to verify
The 001–016 migration contents reviewed in the working conversation did **not show a `terms` table**.

Before creating Migration 017, identify the actual existing term table/schema. Do not invent a `terms` table or foreign key.

## 26. NEXT BUILD SEQUENCE

1. Migration 017 — Fee Structures + Fee Structure Items
2. Migration 018 — Student Financial Accounts
3. Migration 019 — Payments
4. Financial service/API layer
5. Fee Structure backend endpoints
6. Student Financial Account endpoints
7. Payment recording endpoints
8. Receipt generation/API
9. Frontend financial module
10. Backend/frontend integration
11. Financial testing
12. Paystack remains separate for WWS-EduSuite subscription billing

Build and test each stage incrementally.

## 27. CHAT HANDOFF PROTOCOL

For a new conversation, attach this file and say:

> “Buddy, continue WWS-EduSuite from this PROJECT_STATE.md. Follow the locked decisions and continue from CURRENT FINANCIAL DEVELOPMENT POSITION.”

The assistant should:
- read the state first
- respect locked decisions
- avoid re-asking settled questions
- inspect actual project files when exact implementation details are required
- update this file at major checkpoints

## 28. LAST UPDATED

**Milestone:** Financial system — pre-Migration 017  
**Next concrete action:** Identify the existing terms schema, then create Migration 017.


# 🔥 LATEST BACKEND CHECKPOINT — SEPTEMBER 17, 2026

## Financial Database Foundation — COMPLETE

The financial database foundation has now been implemented, applied to PostgreSQL, verified, committed, and pushed to GitHub.

### Migrations completed

```text
017_create_terms.sql
018_create_fee_structures.sql
019_create_student_financial_accounts.sql
020_create_payments.sql
```

### PostgreSQL verification

The database `wws_edusuite` now contains **21 tables**, including:

```text
terms
fee_structures
fee_structure_items
student_financial_accounts
payments
```

### Financial relationship

```text
School
  │
  └── Academic Session
        ├── Terms
        ├── Classes
        │     └── Sections
        │
        └── Academic Levels
              │
              └── Fee Structure
                    │
                    └── Fee Structure Items
                          │
                          ↓
                    Student Enrollment
                          │
                          ↓
                 Financial Account
                          │
                          ↓
                       Payments
```

### Migration 017 — Terms

`terms` contains:

* `id`
* `school_id`
* `academic_session_id`
* `name`
* `display_order`
* `start_date`
* `end_date`
* `is_current`
* timestamps

Constraints include:

* unique term name within an academic session
* only one current term per academic session
* positive display order
* valid term dates

Terms are database records. **Do not hardcode term names in the application.**

### Migration 018 — Fee Structures

`fee_structures` is tied to:

* school
* academic session
* term
* academic level

`fee_structure_items` stores individual fee components and amounts.

The total fee is calculated from fee structure items rather than stored as a second independent source of truth.

Fee structures are intended to be historical/versioned. Used financial records must retain the applicable historical amount.

### Migration 019 — Student Financial Accounts

`student_financial_accounts` connects:

```text
Student
Enrollment
Academic Session
Term
Fee Structure
```

and stores:

* `total_due`
* `total_paid`
* `status`

Statuses:

```text
unpaid
partially_paid
paid
```

Outstanding balance is derived as:

```text
total_due - total_paid
```

It is intentionally not stored separately.

A unique constraint prevents duplicate financial accounts for the same:

```text
student + enrollment + term
```

The account should only be created when an applicable fee structure exists. The application must never invent a fee amount when no applicable structure exists.

### Migration 020 — Payments

`payments` records school payment transactions.

It contains:

* student
* financial account
* amount
* payment date
* payment method
* reference
* description
* school ownership
* timestamps

Supported database payment-method values currently defined by the migration:

```text
cash
transfer
pos
cheque
ussd
other
```

WWS-EduSuite records school payments; it does not process school/student fee payments through its own gateway.

The eventual workflow is:

```text
Fee Structure
      ↓
Financial Account
      ↓
Payment
      ↓
Balance Update
      ↓
Receipt
```

Payment and receipt remain separate concepts. A payment is the accounting transaction; a receipt is the document generated from that transaction.

## Important integrity decision

`payments` contains both `student_id` and `financial_account_id`.

The database does not currently enforce that both references belong to the same student/school through a composite foreign key.

This was intentionally left aligned with the existing project schema pattern rather than introducing a new composite-FK architecture.

The Payments service must therefore validate that:

```text
payment.student_id
        ↓
belongs to
        ↓
financial_account.student_id
```

and that both belong to the authenticated school before creating a payment.

Do not silently redesign the schema unless a concrete architectural conflict is identified and discussed first.

---

# Git Checkpoint

Financial migrations were committed as a single milestone and pushed successfully.

Current Git state:

```text
Branch: master
Remote: origin/master
Status: up to date with origin/master
```

The only remaining working-tree change is an unrelated frontend deletion:

```text
../client/AdminLogin.js
```

This deletion is **unstaged and has not been included in the financial backend commit**.

Do not modify or commit that deletion as part of the backend financial work unless explicitly addressed.

---

# 🚀 NEXT BACKEND PHASE

The financial database foundation is complete.

Next phase is the **Financial Backend API**, following the existing backend architecture rather than introducing a new structure.

Recommended implementation sequence:

```text
1. Fee Structures API
        ↓
2. Student Financial Accounts service/API
        ↓
3. Payments API
        ↓
4. Payment/account balance logic
        ↓
5. Receipt generation and authorization
```

Before creating new financial controllers/routes/services, inspect the existing Student, Enrollment, Teacher, Academic Session, Academic Level, Class, and Section backend implementations and mirror their established project structure.

Do not invent a second backend architecture.

## Current development rule

Follow the existing project/schema pattern by default.

If a stronger architectural approach is genuinely needed, explicitly flag the conflict before deviating and explain the tradeoff.

**No hardcoded application business truth.**

Database-backed values such as schools, sessions, terms, academic levels, fee structures, fee items, students, enrollments, and payments must ultimately come from the backend/database.

Temporary frontend `localStorage`/demo truth remains acceptable only until frontend-backend integration. Before integration, audit and replace those demo/localStorage sources with backend/API state.


# 🔥 LATEST BACKEND CHECKPOINT — SEPTEMBER 19, 2026

## Financial System Backend — Migrations 017–023

The financial system backend foundation and School Officials document-authorization foundation have now been implemented, applied to PostgreSQL, tested through the API, and verified successfully.

### Database migrations completed

```text
017_create_terms.sql
018_create_fee_structures.sql
019_create_student_financial_accounts.sql
020_create_payments.sql
021_create_school_officials.sql
022_add_settings_permissions.sql
023_add_admin_settings_permissions.sql





# WWS-EduSuite — Current Project State

## Backend — Financial Module Progress

The WWS-EduSuite backend financial foundation has now progressed through **Migration 025**.

### Completed Database Migrations

* **001–016** — Core school, authentication, academic, student, teacher, class, section, and enrollment foundation
* **017** — Terms
* **018** — Fee Structures and Fee Structure Items
* **019** — Student Financial Accounts
* **020** — Payments
* **021** — School Officials
* **022–023** — Settings and permissions
* **024** — Payment Receipts
* **025** — Expenses and Expense Categories
---

## Financial Architecture

The financial workflow is:

```text
Fee Structure
      ↓
Student Financial Account
      ↓
Payments
      ↓
Balance
      ↓
Payment Receipt
```

### Fee Structures

Fee structures belong to:

* School
* Academic Session
* Term
* Academic Level

Fee structure totals are calculated from their individual fee structure items.

Fee structures are treated as historical financial records. Once a financial account references a fee structure, that fee structure cannot be modified. A new fee structure must be created instead.

No fee amounts or fee components are hardcoded into application logic.

---

## Student Financial Accounts

A student financial account is created for a student's:

* Enrollment
* Academic Session
* Term
* Applicable Fee Structure

The backend derives the academic session and academic level from the student's enrollment/class relationship rather than trusting duplicated client-provided values.

Each financial account maintains:

* Total Due
* Total Paid
* Status

Possible statuses:

```text
unpaid
partially_paid
paid
```

Duplicate financial accounts for the same student, enrollment, and term are prevented.

---

## Payments

Payments are linked to:

* School
* Student
* Student Financial Account

Supported payment methods:

```text
cash
transfer
pos
cheque
ussd
other
```

Payments:

* Must have an amount greater than zero.
* Cannot exceed the outstanding balance.
* Update the student's financial account atomically.
* Recalculate total paid and account status.
* Are school-scoped.
* Use database transactions and row locking to prevent inconsistent balances.

Payment records currently have no delete operation.

---

## Payment Receipts

Migration **024** introduced payment receipts.

Every successful school-fee payment automatically creates a corresponding receipt within the same database transaction.

A receipt contains a historical snapshot of:

### School

* School name
* Email
* Phone
* Address
* Logo

### Student

* Student name
* Admission number
* Gender

### Academic Context

* Academic Session
* Term
* Academic Level
* Class

### Financial Information

* Total Due
* Amount Paid
* Total Paid After Payment
* Outstanding Balance After Payment
* Payment Date
* Payment Method
* Payment Reference
* Payment Description

### Fee Breakdown

Receipt items are copied from the applicable fee structure items at the time of payment.

### Official Authorization

Payment receipts snapshot:

* Principal name
* Principal title
* Principal signature
* Principal stamp
* Accounting Officer name
* Accounting Officer title
* Accounting Officer signature
* Accounting Officer stamp

Digital signatures and stamps are optional.

Physical signature and stamp spaces must remain available on generated documents when digital assets are not provided.

---

## School Officials

School officials are stored separately from system users.

Supported official types:

```text
principal
exam_officer
accounting_officer
```

This separation is intentional because a school official does not necessarily need to be a WWS-EduSuite login user.

Each official stores:

* Name
* Title
* Optional signature
* Optional stamp

Only one official of each supported type can exist per school.

---

## Receipt Numbering

Payment receipts use a PostgreSQL sequence:

```text
payment_receipt_number_seq
```

Receipt numbers are generated by the database.

The sequence is global while receipt-number uniqueness is enforced per school.

Gaps in receipt numbers caused by rolled-back transactions are acceptable PostgreSQL sequence behavior.

---

## Financial Backend Testing Completed

The following tests have been successfully completed:

### Payment Creation

* Successful payment creation
* Financial account balance update
* Account status update
* Automatic receipt creation
* Receipt item creation

### Partial Payment

Verified that a partial payment correctly produces:

```text
total_due
amount_paid
total_paid_after_payment
outstanding_balance
status = partially_paid
```

### Full Payment

Verified that a final payment correctly produces:

```text
total_paid = total_due
outstanding_balance = 0
status = paid
```

### Historical Receipt Snapshot

Verified that an earlier receipt retains the financial state from the time that payment was made.

For example, a receipt created after a ₦20,000 payment continues to show:

```text
Amount Paid: ₦20,000
Outstanding Balance: ₦40,000
```

even after the student's account is later fully paid.

This confirms that receipts are historical documents rather than live views of the current account balance.

### Overpayment Protection

Attempting to pay more than the outstanding balance is rejected.

Example:

```text
Payment amount cannot exceed the outstanding balance.
```

No invalid payment or receipt is created.

### Duplicate Financial Account Protection

Attempting to create another financial account for the same:

```text
student + enrollment + term
```

is rejected.

### Historical Fee Structure Protection

Once a fee structure is referenced by a financial account, modification is rejected.

The system instructs the user to create a new fee structure instead.

### Tenant Isolation

School-scoped financial isolation has been tested successfully.

A user from another school cannot access another school's:

* Student Financial Account
* Payment
* Payment Receipt

The backend returns a not-found response rather than exposing another school's financial data.

---

## Current Backend Status

```text
Authentication                         🟢 Complete
Authorization / Permissions            🟢 Complete
School Registration                    🟢 Complete
Subscriptions                          🟢 Complete
Students                               🟢 Complete
Academic Sessions                      🟢 Complete
Academic Levels                        🟢 Complete
Classes                                🟢 Complete
Sections                               🟢 Complete
Enrollments                            🟢 Complete
Terms                                  🟢 Complete
Fee Structures                         🟢 Complete
Student Financial Accounts             🟢 Complete
Payments                               🟢 Complete
School Officials                       🟢 Complete
Payment Receipts                       🟢 Complete
Financial Module Testing               🟢 Complete
Tenant Isolation Testing               🟢 Complete
```

---

## Important Architecture Rules

The following principles remain locked:

1. **No hardcoded business data.**
2. Financial records must remain historically reliable.
3. All school-owned data must be tenant-scoped.
4. Backend validation is authoritative.
5. Frontend values must not be blindly trusted.
6. Financial operations that modify multiple records must use database transactions.
7. Historical documents must preserve the information that existed when the document was created.
8. School officials are separate from login users.
9. Digital signatures/stamps are optional; physical signing/stamping must remain possible.
10. Existing project architecture should be followed rather than introducing unnecessary service/repository layers or new architectural patterns.

---

# Next Backend Module — Expenses

Migration 025 — Expenses is now complete. The next backend module is Attendance.

The planned expense structure was:

```text
Expense Categories
        │
        └──────────< Expenses
                         │
                         └── Created By → Users
```

### Expense Categories

Expense categories will be configurable per school.

There will be:

* No hardcoded expense categories.
* Category name
* Description
* Active/inactive status
* School ownership
* Created/updated timestamps

Categories should be deactivated rather than casually deleted when historical expenses depend on them.

### Expenses

Each expense will contain:

* School
* Expense Category
* Expense Category Name Snapshot
* Amount
* Expense Date
* Payment Method
* Reference
* Description
* Created By
* Created/Updated timestamps

The category name snapshot ensures historical expenses retain the category name that existed when the expense was recorded.

Supported payment methods will remain consistent with the existing payment model:

```text
cash
transfer
pos
cheque
ussd
other
```

Expenses will be school-scoped and the backend will verify that the selected category and creating user belong to the authenticated user's school.

Expense records are financial records and should not have casual destructive deletion that can silently erase financial history.

---

## Planned Expense Development Sequence

```text
025 — Expense Categories + Expenses database schema
        ↓
Expense Category Controller
        ↓
Expense Category Routes
        ↓
Expense Controller
        ↓
Expense Routes
        ↓
Register routes in server.js
        ↓
Syntax checks
        ↓
Database/API testing
        ↓
Tenant isolation testing
        ↓
Financial integrity testing
        ↓
Git commit
        ↓
Git push
```

The expense module will be developed incrementally and tested before moving to the next financial feature.



## Expenses Module — Completed

Migration 025 adds the school-scoped expense management system:

- `expense_categories`
- `expenses`

### Expense Categories

Expense categories are configurable per school.

Supported operations:

- GET all expense categories
- GET one expense category
- POST create expense category
- PATCH update expense category

Rules:

- Category names are unique per school.
- Categories use `is_active` instead of destructive deletion.
- Inactive categories cannot be used when creating or updating expenses.
- Category records remain available for historical reference.
- All category queries are school-scoped.

### Expenses

Supported operations:

- GET all expenses
- GET one expense
- POST create expense
- PATCH update expense

Expense records contain:

- school
- expense category
- historical expense category name snapshot
- amount
- expense date
- payment method
- reference
- description
- created-by user
- timestamps

Supported payment methods:

- cash
- transfer
- pos
- cheque
- ussd
- other

### Expense Business Rules

- Every expense belongs to the authenticated user's school.
- The selected expense category must belong to the same school.
- The selected expense category must be active.
- The authenticated user must belong to the same school and have an active account.
- Expense amounts must be greater than zero.
- Invalid payment methods are rejected with HTTP 400.
- Expense dates are returned as calendar dates without timezone shifting.
- Expense category names are snapshotted on the expense record so historical records are not silently renamed when a category is renamed.
- Expenses do not have a destructive DELETE endpoint at this stage.

### Expense Testing Completed

- Expense category creation
- Expense category listing
- Expense category lookup
- Duplicate category protection
- Category update
- Category deactivation/reactivation
- Rejection of inactive categories
- Expense creation
- Expense listing
- Expense lookup
- Expense update
- Creator tracking
- Historical category-name snapshot
- PostgreSQL DATE serialization
- Invalid payment-method validation
- School/tenant isolation for expense reads
- School/tenant isolation for expense updates
- Direct PostgreSQL persistence verification

Expense module is currently considered complete for the implemented backend scope.


# 🔥 LATEST BACKEND CHECKPOINT — SEPTEMBER 20, 2026

## Attendance Backend — COMPLETE

The Attendance backend module has now been implemented, applied to PostgreSQL, wired into the Express API, tested through the API, verified successfully, committed, and pushed to GitHub.

### Database Migration

**026 — `026_create_attendance_records.sql`**

The migration creates:

- `attendance_records`

Attendance records are linked to `student_enrollments` so the backend derives the student's academic session, class, and section context through the enrollment relationship rather than duplicating those relationships unnecessarily.

### Attendance Record Structure

Each attendance record contains:

- School
- Enrollment
- Academic Term
- Attendance Date
- Status
- Created By
- Created At
- Updated At

Supported attendance statuses:
present
absent


# 🔥 LATEST BACKEND CHECKPOINT — SEPTEMBER 23, 2026

## Subjects, Streams & Subject Combinations Backend — COMPLETE

The Subjects, Streams, and Subject Combinations backend modules have now been implemented, applied to PostgreSQL, wired into the Express API, syntax-checked, tested through the API, relationship integrity verified, temporary test data cleaned up, and confirmed working with the existing school-scoped architecture.

### Database Migration

**027 — `027_create_subjects_streams_and_combinations.sql`**

The migration creates:

- `subjects`
- `subject_academic_levels`
- `streams`
- `stream_academic_levels`
- `subject_combinations`
- `subject_combination_subjects`

The relationship tables retain `school_id` for school ownership. Cross-school relationship integrity is enforced by the controllers rather than by introducing composite foreign keys into the existing schema.

### Subjects

Subjects are school-scoped and support:

- Name
- Code
- Category
- Core/non-core status
- Academic-level assignments
- Created/updated timestamps

Supported subject categories are defined by the database schema:

```text
Core
Science
Art
Commercial
Humanities
Language
Vocational
Other


# 🔥 LATEST BACKEND CHECKPOINT — SEPTEMBER 25, 2026

## Enrollment Academic Assignment — COMPLETE

Migration **028** and the corresponding Enrollment Controller updates are now implemented, applied to PostgreSQL, tested through the API, committed, and pushed to GitHub.

### Database Migration

**028 — `028_add_academic_assignment_to_enrollments.sql`**

The migration extends `student_enrollments` with:

* `stream_id`
* `subject_combination_id`

Both fields are nullable.

Foreign-key relationships:

```text
student_enrollments.stream_id
        ↓
streams.id

student_enrollments.subject_combination_id
        ↓
subject_combinations.id
```

The fields are intentionally optional because **streams and subject combinations are not required for every academic level**.

### Enrollment Academic Assignment Rules

The backend now supports the following:

* A normal enrollment can exist without a stream or subject combination.
* A stream can be assigned independently.
* A subject combination requires a stream.
* A stream must belong to the authenticated school.
* A stream must be active.
* A stream must be assigned to the academic level of the selected class.
* A subject combination must belong to the authenticated school.
* A subject combination must be active.
* A subject combination must belong to the selected stream and academic level.
* A subject combination must contain at least one subject.
* Every subject in the selected combination must be assigned to the selected academic level.

This preserves flexibility for levels such as Creche, Primary, and Junior Secondary School (JSS), while supporting stream/combination-based structures where they are applicable, such as Senior Secondary School (SS2/SS3).

### Enrollment Controller Updates

`enrollmentController.js` was updated so that:

* Enrollment creation accepts `streamId` and `subjectCombinationId`.
* Enrollment retrieval returns stream and subject-combination information.
* Enrollment retrieval also returns the class academic level.
* Enrollment updates support changing the stream and subject combination.
* Omitting `streamId` or `subjectCombinationId` during an update preserves the existing value.
* Explicitly sending `null` clears the existing stream or subject combination.
* Invalid stream/combination relationships are rejected by the backend.
* Existing school-scoped authorization and validation patterns remain in place.

### API Testing Completed

The following scenarios were successfully tested:

1. Valid stream + subject combination enrollment → **successful**
2. Enrollment retrieval → stream and combination IDs/names returned correctly
3. Subject combination without a stream → **rejected**
4. Stream from the same school but mismatched with the selected subject combination → **rejected**
5. Partial enrollment update without stream/combination fields → existing assignment preserved
6. Explicit `null` stream and combination values → assignments successfully cleared
7. Normal enrollment without stream/combination → remains supported

### Test Data

Temporary test data was created through the actual APIs to verify the relationships, including:

* Science stream
* Arts test stream
* Test Science subject
* Science test subject combination
* Test student

The enrollment relationship was created, retrieved, updated, and cleared successfully.

### Code Verification

The Enrollment Controller passed the Node.js syntax check:

```text
Enrollment controller syntax: CLEAN
```

The Express server also started successfully and connected to PostgreSQL.

### Git Checkpoint

Migration 028 and the Enrollment Controller changes were committed as:

```text
278c1b8 feat: support stream and subject combination enrollment
```

The commit was successfully pushed to:

```text
origin/master
```

Only the intended backend files were included in the commit.

The following unrelated working-tree files remain intentionally untouched and uncommitted:

```text
../client/AdminLogin.js
cookies.txt
login-response-new.json
login-response.json
```

### Current Backend Status

```text
Authentication                         🟢 Complete
Authorization / Permissions            🟢 Complete
School Registration                    🟢 Complete
Subscriptions                          🟢 Complete
Students                               🟢 Complete
Academic Sessions                      🟢 Complete
Academic Levels                        🟢 Complete
Classes                                🟢 Complete
Sections                               🟢 Complete
Enrollments                            🟢 Complete
Terms                                  🟢 Complete
Fee Structures                         🟢 Complete
Student Financial Accounts             🟢 Complete
Payments                               🟢 Complete
School Officials                       🟢 Complete
Payment Receipts                       🟢 Complete
Expenses                               🟢 Complete
Attendance                             🟢 Complete
Subjects                               🟢 Complete
Streams                                🟢 Complete
Subject Combinations                   🟢 Complete
Enrollment Academic Assignment        🟢 Complete
```

## Next Backend Phase

The next major backend module is the **Results System**.

The Results backend must remain authoritative for:

* Subject applicability
* Stream/subject-combination applicability
* Continuous Assessment (CA) validation: maximum 30
* Examination score validation: maximum 70
* Total score calculation
* Grade calculation
* Remarks
* Result finalization
* Class ranking
* Academic-level ranking
* Third-term/session-level academic-level ranking where applicable
* Result authorization by the Principal and Examination Officer
* Historical result integrity

The existing frontend Results implementation should be inspected before creating the Results schema so that the backend supports the established product requirements without introducing conflicting architecture.

Before creating the next migration, inspect the existing Results frontend and backend structure, identify the exact data relationships required, and continue incrementally with schema design → controller/API → testing → Git checkpoint.
