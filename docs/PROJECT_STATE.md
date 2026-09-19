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