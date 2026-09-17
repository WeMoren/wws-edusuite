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
