import React, {useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useOutletContext } from "react-router-dom";
import "./Accountant.css";
import FinanceCard from "../../components/accountant/FinanceCard/FinanceCard";
import FinanceAction from "../../components/accountant/FinanceAction/FinanceAction";
import PaymentModal from "../../components/accountant/PaymentModal/PaymentModal";
import initialPayments from "../../data/payments";
import TransactionTable from "../../components/accountant/TransactionTable/TransactionTable";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import ExpenseModal from "../../components/accountant/ExpenseModal/ExpenseModal";
import ExpenseCategoryModal from "../../components/accountant/ExpenseCategoryModal/ExpenseCategoryModal";
import ExpenseTable from "../../components/accountant/ExpenseTable/ExpenseTable";
import PaymentReceipt from "../../components/accountant/PaymentReceipt/PaymentReceipt";



const Accountant = () => {
  const { authToken, currentUser } = useAuth();
  const canCorrectPayments = currentUser?.roles?.includes("Principal") ?? false;
  const API_BASE_URL = "http://localhost:5000/api";
  const [financialSummary, setFinancialSummary] = useState({
    expectedFees: 0,
    totalCollected: 0,
    outstandingFees: 0,
    totalExpenses: 0,
    netBalance: 0,
    academicLevelBreakdown: [],
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [reportingAcademicSessionId, setReportingAcademicSessionId] = useState("");

const [reportingTermId, setReportingTermId] = useState("");
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("");
  const [studentAccountsPage, setStudentAccountsPage] = useState(1);
  const [studentAccountsPageSize, setStudentAccountsPageSize] = useState(25);

const [showAccountGeneration, setShowAccountGeneration] = useState(false);
const [accountGenerationStudentId, setAccountGenerationStudentId] = useState("");
const [accountGenerationLoading, setAccountGenerationLoading] = useState(false);
const [accountGenerationError, setAccountGenerationError] = useState("");
const [accountGenerationSuccess, setAccountGenerationSuccess] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseCategoryModal, setShowExpenseCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
const [expenseSaving, setExpenseSaving] = useState(false);
const [expenseDeleting, setExpenseDeleting] = useState(false);
const [expenseSaveError, setExpenseSaveError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [paymentDateFrom, setPaymentDateFrom] = useState("");
  const [paymentDateTo, setPaymentDateTo] = useState("");



const {
    payments, 
    setPayments,
    setRecentActivities,
    students,
    enrollments,
    academicSessions,
    academicTerms,
    setFinancialAccounts: setSharedFinancialAccounts,
  } = useOutletContext();


  useEffect(() => {
    if (academicSessions.length === 0) return;

    const selectedSession = academicSessions.find(
        (session) => session.id === reportingAcademicSessionId
    );

    const defaultSession =
        selectedSession ||
        academicSessions.find((session) => session.isCurrent) ||
        academicSessions[0];

    if (reportingAcademicSessionId !== defaultSession.id) {
        setReportingAcademicSessionId(defaultSession.id);
    }

    const sessionTerms = academicTerms
        .filter((term) => term.academicSessionId === defaultSession.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    if (sessionTerms.length === 0) {
        if (reportingTermId !== "") {
            setReportingTermId("");
        }
        return;
    }

    const selectedTerm = sessionTerms.find(
        (term) => term.id === reportingTermId
    );

    const defaultTerm =
        selectedTerm ||
        sessionTerms.find((term) => term.isCurrent) ||
        sessionTerms[0];

    if (reportingTermId !== defaultTerm.id) {
        setReportingTermId(defaultTerm.id);
    }
}, [
    academicSessions,
    academicTerms,
    reportingAcademicSessionId,
    reportingTermId,
]);

  const reportingTerms = academicTerms
    .filter(
        (term) => term.academicSessionId === reportingAcademicSessionId
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

const handleReportingSessionChange = (sessionId) => {
    setReportingAcademicSessionId(sessionId);

    const sessionTerms = academicTerms
        .filter((term) => term.academicSessionId === sessionId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    const defaultTerm =
        sessionTerms.find((term) => term.isCurrent) ||
        sessionTerms[0];

    setReportingTermId(defaultTerm?.id || "");
};


const getFinancialSummaryUrl = () => {
    if (!reportingAcademicSessionId || !reportingTermId) {
        return null;
    }

    const params = new URLSearchParams({
        academicSessionId: reportingAcademicSessionId,
        termId: reportingTermId,
    });

    return `${API_BASE_URL}/financial-summary?${params.toString()}`;
};

  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expenseError, setExpenseError] = useState("");
  

  useEffect(() => {
    if (!authToken) {
      setSummaryLoading(false);
      setSummaryError("Please sign in to view financial data.");
      return;
    }

    const controller = new AbortController();

    const loadFinancialSummary = async () => {
      setSummaryLoading(true);
      setSummaryError("");

      try {
        const summaryUrl = getFinancialSummaryUrl();

          if (!summaryUrl) {
              setSummaryLoading(false);
              return;
          }

        const response = await fetch(summaryUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to load financial summary.");
        }

        setFinancialSummary({
          expectedFees: Number(data.expectedFees) || 0,
          totalCollected: Number(data.totalCollected) || 0,
          outstandingFees: Number(data.outstandingFees) || 0,
          totalExpenses: Number(data.totalExpenses) || 0,
          netBalance: Number(data.netBalance) || 0,
          academicLevelBreakdown: data.academicLevelBreakdown || [],
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load financial summary:", error);
          setSummaryError(error.message || "Failed to load financial summary.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      }
    };

    loadFinancialSummary();

    return () => controller.abort();
  }, [authToken,  reportingAcademicSessionId, reportingTermId]);


    useEffect(() => {
    if (!authToken) {
      setFinancialAccounts([]);
      setAccountsLoading(false);
      setAccountsError("Please sign in to view student accounts.");
      return;
    }

    const controller = new AbortController();

    const loadFinancialAccounts = async () => {
      setAccountsLoading(true);
      setAccountsError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/student-financial-accounts`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load student financial accounts."
          );
        }

        setFinancialAccounts(data.financialAccounts || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load student financial accounts:", error);
          setAccountsError(
            error.message || "Failed to load student financial accounts."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setAccountsLoading(false);
        }
      }
    };

    loadFinancialAccounts();

    return () => controller.abort();
  }, [authToken]);


  useEffect(() => {
  if (!authToken) return;

  const controller = new AbortController();

  const loadPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load payments.");
      }

      const normalizedPayments = (data.payments || []).map((payment) => ({
        ...payment,
        studentId: payment.student_id,
        financialAccountId: payment.financial_account_id,
        studentName: [
          payment.first_name,
          payment.middle_name,
          payment.last_name,
        ]
          .filter(Boolean)
          .join(" "),
        date: payment.payment_date,
        amount: Number(payment.amount) || 0,
        paymentMethod: payment.payment_method,
      }));

      setPayments(normalizedPayments);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load payments:", error);
      }
    }
  };

  loadPayments();

  return () => controller.abort();
}, [authToken, setPayments]);


  useEffect(() => {
  if (!authToken) {
    setExpensesLoading(false);
    setExpenseError("Please sign in to view expenses.");
    return;
  }

  const controller = new AbortController();

  const loadExpenses = async () => {
    setExpensesLoading(true);
    setExpenseError("");

    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      const [expensesResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses`, {
          headers,
          signal: controller.signal,
        }),
        fetch(`${API_BASE_URL}/expense-categories`, {
          headers,
          signal: controller.signal,
        }),
      ]);

      const [expensesData, categoriesData] = await Promise.all([
        expensesResponse.json().catch(() => ({})),
        categoriesResponse.json().catch(() => ({})),
      ]);

      if (!expensesResponse.ok) {
        throw new Error(
          expensesData.message || "Failed to load expenses."
        );
      }

      if (!categoriesResponse.ok) {
        throw new Error(
          categoriesData.message || "Failed to load expense categories."
        );
      }

      setExpenses(
         (Array.isArray(
          expensesData) ? expensesData : []).map((expense) => ({
          ...expense,
          date: expense.expense_date,
          title: expense.title,
          category: expense.expense_category_name,
          amount: Number(expense.amount) || 0,
          expenseCategoryId: expense.expense_category_id,
          paymentMethod: expense.payment_method,
          reference: expense.reference,
          description: expense.description || "",
        }))
      );

      setExpenseCategories(
        Array.isArray(categoriesData) ? categoriesData : []
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load expenses:", error);
        setExpenseError(error.message || "Failed to load expenses.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setExpensesLoading(false);
      }
    }
  };

  loadExpenses();

  return () => controller.abort();
}, [authToken]);


  const currentAcademicSession = academicSessions.find(
  (session) => session.isCurrent
);

const currentAcademicTerm = academicTerms.find(
  (term) =>
    term.isCurrent &&
    term.academicSessionId === currentAcademicSession?.id
);

const eligibleEnrollments = enrollments.filter(
  (enrollment) =>
    enrollment.status === "active" &&
    enrollment.academicSessionId === currentAcademicSession?.id
);

const handleGenerateFinancialAccount = async () => {
  setAccountGenerationError("");
  setAccountGenerationSuccess("");

  if (!currentAcademicSession || !currentAcademicTerm) {
    setAccountGenerationError(
      "No current academic session or term has been configured."
    );
    return;
  }

  const selectedEnrollment = eligibleEnrollments.find(
    (enrollment) =>
      enrollment.studentId === accountGenerationStudentId
  );

  if (!selectedEnrollment) {
    setAccountGenerationError(
      "No active enrolment was found for this student in the current session."
    );
    return;
  }

  setAccountGenerationLoading(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/student-financial-accounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          studentId: selectedEnrollment.studentId,
          enrollmentId: selectedEnrollment.id,
          termId: currentAcademicTerm.id,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to generate student financial account."
      );
    }

    const accountsResponse = await fetch(
      `${API_BASE_URL}/student-financial-accounts`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const accountsData = await accountsResponse.json().catch(() => ({}));

    if (!accountsResponse.ok) {
      throw new Error(
        "Account created successfully, but the account list could not refresh. Please reload the page."
      );
    }

    setFinancialAccounts(accountsData.financialAccounts || []);

    const student = students.find(
      (item) => item.id === selectedEnrollment.studentId
    );

    setAccountGenerationSuccess(
      `Financial account created successfully for ${student?.firstName || "the student"}.`
    );

    setAccountGenerationStudentId("");
  } catch (error) {
    setAccountGenerationError(error.message);
  } finally {
    setAccountGenerationLoading(false);
  }
};



  const selectedStudent = selectedPayment
  ? students.find((student) => student.id === selectedPayment.studentId)
  : null;


const filteredPayments = payments.filter((payment) => {
  const student = students.find(
    (student) => student.id === payment.studentId
  );

  const searchTerm = paymentSearch.toLowerCase();

  const matchesSearch =
    payment.studentName.toLowerCase().includes(searchTerm) ||
    student?.admissionNo.toLowerCase().includes(searchTerm);

  const matchesPaymentMethod =
    paymentMethodFilter === "" ||
    payment.paymentMethod === paymentMethodFilter;

    const matchesDateFrom =
  paymentDateFrom === "" ||
  payment.date.slice(0, 10) >= paymentDateFrom;

  const matchesDateTo =
  paymentDateTo === "" ||
  payment.date.slice(0, 10) <= paymentDateTo;

  return matchesSearch && matchesPaymentMethod && matchesDateFrom && matchesDateTo;
});

    const filteredFinancialAccounts = financialAccounts.filter((account) => {
      const fullName = [
        account.first_name,
        account.middle_name,
        account.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchTerm = studentSearch.toLowerCase().trim();

      const matchesSearch =
        fullName.includes(searchTerm) ||
        (account.admission_no || "").toLowerCase().includes(searchTerm);

      const matchesStatus =
        !studentStatusFilter ||
        account.status === studentStatusFilter;

      return matchesSearch && matchesStatus;
    });

        const totalStudentAccountPages = Math.max(
      1,
      Math.ceil(filteredFinancialAccounts.length / studentAccountsPageSize)
    );

    const currentStudentAccountsPage = Math.min(
      studentAccountsPage,
      totalStudentAccountPages
    );

    const paginatedFinancialAccounts = filteredFinancialAccounts.slice(
      (currentStudentAccountsPage - 1) * studentAccountsPageSize,
      currentStudentAccountsPage * studentAccountsPageSize
    );

    const studentAccountsStart =
      filteredFinancialAccounts.length === 0
        ? 0
        : (currentStudentAccountsPage - 1) * studentAccountsPageSize + 1;

    const studentAccountsEnd = Math.min(
      currentStudentAccountsPage * studentAccountsPageSize,
      filteredFinancialAccounts.length
    );

  return (
    <div className="accountant-page">
      <div className="accountant-page__header">
        <div>
          <h1>Accountant</h1>
          <p>Manage school finances and transactions.</p>
        </div>
      </div>

        {summaryError && (
          <p role="alert" className="accountant-page__summary-error">
            {summaryError}
          </p>
        )}


        <section className="accountant-page__reporting-period">
          <div className="accountant-page__section-header">
            <h2>Reporting Period</h2>
            <p>Select an academic session and term to view financial records.</p>
          </div>

          <div className="accountant-page__reporting-controls">
            <div className="accountant-page__reporting-field">
              <label htmlFor="reporting-academic-session">
                Academic Session
              </label>

              <select
                id="reporting-academic-session"
                value={reportingAcademicSessionId}
                onChange={(e) => handleReportingSessionChange(e.target.value)}
                disabled={academicSessions.length === 0}
              >
                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="accountant-page__reporting-field">
              <label htmlFor="reporting-academic-term">
                Academic Term
              </label>

              <select
                id="reporting-academic-term"
                value={reportingTermId}
                onChange={(e) => setReportingTermId(e.target.value)}
                disabled={reportingTerms.length === 0}
              >
                {reportingTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>


        <div className="accountant-page__summary">

                <FinanceCard
                  title="Total Expected Fees"
                  variant="blue"
                  value={
                    summaryLoading
                      ? "Loading..."
                      : summaryError
                        ? "Unavailable"
                        : `₦${financialSummary.expectedFees.toLocaleString()}`
                  }
                  description="Expected fees for the selected academic period"
               />

              <FinanceCard
                title="Total Collected"
                variant="green"
                value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : `₦${financialSummary.totalCollected.toLocaleString()}`}
                description="Total fees collected"
              />

              <FinanceCard
                title="Outstanding Fees"
                variant="amber"
                value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : `₦${financialSummary.outstandingFees.toLocaleString()}`}
                description="Fees yet to be collected"
              />

              <FinanceCard
                title="Total Expenses"
                variant="purple"
                value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : `₦${financialSummary.totalExpenses.toLocaleString()}`}
                description="School expenses"
              />

              <FinanceCard
                title="Net Balance"
                variant="teal"
                value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : `₦${financialSummary.netBalance.toLocaleString()}`}
                description="Net balance for the selected academic period"
              />
        </div>

        <section className="accountant-page__level-breakdown">
          <div className="accountant-page__section-header">
            <h2>Expected Fees by Academic Level</h2>
            <p>
               Fee structure multiplied by active enrolments for the selected period.
            </p>
          </div>

          {financialSummary.academicLevelBreakdown.length === 0 ? (
            <p className="accountant-page__empty">
             No academic-level fee breakdown is available for the selected period.
            </p>
          ) : (
            <div className="accountant-page__table-wrapper">
              <table className="accountant-page__table">
                <thead>
                  <tr>
                    <th>Academic Level</th>
                    <th>Fee per Student</th>
                    <th>Active Enrolments</th>
                    <th>Expected Fees</th>
                  </tr>
                </thead>

                <tbody>
                  {financialSummary.academicLevelBreakdown.map((level) => (
                    <tr key={level.academicLevelId}>
                      <td>
                        <strong>{level.academicLevelName}</strong>
                        {!level.hasCurrentFeeStructure && (
                          <span className="accountant-page__missing-fee">
                            No current fee structure
                          </span>
                        )}
                      </td>
                      <td>₦{Number(level.feePerStudent).toLocaleString()}</td>
                      <td>{Number(level.activeEnrollmentCount).toLocaleString()}</td>
                      <td>
                        <strong>
                          ₦{Number(level.expectedFees).toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>


      <section className="accountant-page__actions">
        <div className="accountant-page__section-header">
            <h2>Quick Actions</h2>
            <p>Record and manage financial activity.</p>
          </div>

         <div className="accountant-page__actions-grid">
          <FinanceAction
            label="Record Payment"
            variant="green"
            description="Record a student fee payment."
            onClick={() => setShowPaymentModal(true)}
          />

          <FinanceAction
            label="Add Expense"
            variant="purple"
            description="Record a school expense."
            onClick={() => setShowExpenseModal(true)}
          />

          <FinanceAction
            label="Generate Fee Account"
            variant="blue"
            description="Create a current-term fee account for an active student."
            onClick={() => {
              setAccountGenerationError("");
              setAccountGenerationSuccess("");
              setAccountGenerationStudentId("");
              setShowAccountGeneration(true);
            }}
          />
        </div>


        {showAccountGeneration && (
            <div className="accountant-page__account-generation">
              <div className="accountant-page__section-header">
                <h3>Generate Current-Term Fee Account</h3>
                <p>
                  Select an active student. The account will use the current
                  term's applicable fee structure.
                </p>
              </div>

              {!currentAcademicSession || !currentAcademicTerm ? (
                <p role="alert">
                  No current academic session and term are configured.
                </p>
              ) : eligibleEnrollments.length === 0 ? (
                <p>No active enrolments are available for the current session.</p>
              ) : (
                <>
                  <label htmlFor="account-generation-student">
                    Student
                  </label>

                  <select
                    id="account-generation-student"
                    value={accountGenerationStudentId}
                    onChange={(event) => {
                      setAccountGenerationStudentId(event.target.value);
                      setAccountGenerationError("");
                      setAccountGenerationSuccess("");
                    }}
                    disabled={accountGenerationLoading}
                  >
                    <option value="">Select a student</option>

                    {eligibleEnrollments.map((enrollment) => {
                      const student = students.find(
                        (item) => item.id === enrollment.studentId
                      );

                      if (!student) return null;

                      const studentName = [
                        student.firstName,
                        student.middleName,
                        student.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <option key={enrollment.id} value={student.id}>
                          {studentName} — {student.admissionNo} (
                          {enrollment.className})
                        </option>
                      );
                    })}
                  </select>
                </>
              )}

              {accountGenerationError && (
                <p role="alert">{accountGenerationError}</p>
              )}

              {accountGenerationSuccess && (
                <p role="status">{accountGenerationSuccess}</p>
              )}

              <div className="accountant-page__account-generation-actions">
                <button
                  type="button"
                  onClick={handleGenerateFinancialAccount}
                  disabled={
                    accountGenerationLoading ||
                    !accountGenerationStudentId ||
                    !currentAcademicTerm
                  }
                >
                  {accountGenerationLoading
                    ? "Generating..."
                    : "Generate Account"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAccountGeneration(false);
                    setAccountGenerationError("");
                    setAccountGenerationSuccess("");
                    setAccountGenerationStudentId("");
                  }}
                  disabled={accountGenerationLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
      </section>


          <section className="accountant-page__students">
              <div className="accountant-page__section-header">
                <h2>Student Fee Accounts</h2>
                <p>Search students and monitor their payment status.</p>
              </div>

              <div className="student-account-search">
                <input
                  type="text"
                  placeholder="Search student name or admission number..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentAccountsPage(1);
                  }}
                />

                <select
                  value={studentStatusFilter}
                 onChange={(e) => {
                    setStudentStatusFilter(e.target.value);
                    setStudentAccountsPage(1);
                  }}
                >
                  <option value="">All payment statuses</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {accountsLoading ? (
                <p>Loading student accounts...</p>
              ) : accountsError ? (
                <p role="alert">{accountsError}</p>
              ) : filteredFinancialAccounts.length === 0 ? (
                <p>No matching student accounts found.</p>
              ) : (
                 <>
                <div className="student-account-table-wrapper">
                  <table className="student-account-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Admission No.</th>
                        <th>Session</th>
                        <th>Term</th>
                        <th>Expected</th>
                        <th>Paid</th>
                        <th>Outstanding</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedFinancialAccounts.map((account) => {
                        const studentName = [
                          account.first_name,
                          account.middle_name,
                          account.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        const outstanding = Math.max(
                          Number(account.total_due) - Number(account.total_paid),
                          0
                        );

                        return (
                          <tr key={account.id}>
                            <td>{studentName}</td>
                            <td>{account.admission_no}</td>
                            <td>{account.academic_session_name}</td>
                            <td>{account.term_name}</td>
                            <td>₦{Number(account.total_due).toLocaleString()}</td>
                            <td>₦{Number(account.total_paid).toLocaleString()}</td>
                            <td>₦{outstanding.toLocaleString()}</td>
                            <td>
                              <span
                                className={`payment-status payment-status--${account.status}`}
                              >
                                {account.status === "paid"
                                  ? "Fully Paid"
                                  : account.status === "partially_paid"
                                    ? "Partially Paid"
                                    : "Unpaid"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>


                <div className="student-account-pagination">
                  <p className="student-account-pagination__summary">
                    Showing {studentAccountsStart}–{studentAccountsEnd} of{" "}
                    {filteredFinancialAccounts.length} accounts
                  </p>

                  <div className="student-account-pagination__controls">
                    <label>
                      Rows per page
                      <select
                        value={studentAccountsPageSize}
                        onChange={(e) => {
                          setStudentAccountsPageSize(Number(e.target.value));
                          setStudentAccountsPage(1);
                        }}
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      disabled={currentStudentAccountsPage === 1}
                      onClick={() =>
                        setStudentAccountsPage((page) => Math.max(page - 1, 1))
                      }
                    >
                      Previous
                    </button>

                    <span>
                      Page {currentStudentAccountsPage} of{" "}
                      {totalStudentAccountPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        currentStudentAccountsPage === totalStudentAccountPages
                      }
                      onClick={() =>
                        setStudentAccountsPage((page) =>
                          Math.min(page + 1, totalStudentAccountPages)
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
                </>
              )}
            </section>


                    <section className="accountant-page__transactions">
                        <div className="accountant-page__section-header">
                          <h2>Recent Transactions</h2>
                          <p>View recent student payments.</p>
                        </div>


                        <div className="transaction-search">
                                <input
                                  type="text"
                                  placeholder="Search student or admossion no..."
                                  value={paymentSearch}
                                  onChange={(e) => setPaymentSearch(e.target.value)}
                                />

                              <select
                                    value={paymentMethodFilter}
                                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                              >
                              <option value="">All payment methods</option>
                               <option value="cash">Cash</option>
                              <option value="transfer">Bank Transfer</option>
                              <option value="pos">POS</option>
                              <option value="cheque">Cheque</option>
                              <option value="ussd">USSD</option>
                              <option value="other">Other</option>
                            </select>


                          <label className="transaction-search__date">
                            <span>From</span>

                            <input
                              type="date"
                              value={paymentDateFrom}
                              onChange={(e) => setPaymentDateFrom(e.target.value)}
                            />
                        </label>

                          <label className="transaction-search__date">
                              <span>To</span>

                              <input
                                type="date"
                                value={paymentDateTo}
                                onChange={(e) => setPaymentDateTo(e.target.value)}
                              />
                          </label>

                          <button
                              type="button"
                              className="transaction-search__clear"
                              onClick={() => {
                                setPaymentSearch("");
                                setPaymentMethodFilter("");
                                setPaymentDateFrom("");
                                setPaymentDateTo("");
                              }}
                            >
                              Clear Filters
                        </button>
                        </div>


                       <TransactionTable
                          payments={filteredPayments}
                          canCorrectPayments={canCorrectPayments}
                          onEdit={(payment) => setEditingPayment(payment)}
                          onReceipt={(payment) => setSelectedPayment(payment)}
                        />
                    </section>

                    <section className="accountant-page__expenses">
                        <div className="accountant-page__expenses-header">
                        <div className="accountant-page__section-header recent-expenses">
                          <h2>Recent Expenses</h2>
                          <p>View recent school expenses.</p>
                        </div>

                        <button
                          type="button"
                          className="accountant-page__manage-categories"
                          onClick={() => setShowExpenseCategoryModal(true)}
                        >
                          Manage Categories
                        </button>
                      </div>

                        <ExpenseTable 
                          expenses={expenses}
                          onEdit={(expense) => setEditingExpense(expense)}
                            onDelete={(expense) => setExpenseToDelete(expense)}
                        />
                    </section>


                      {paymentToDelete && (
                        <ConfirmDialog
                          title="Delete Payment"
                          message={`Are you sure you want to delete the payment from ${paymentToDelete.studentName}?`}
                          onCancel={() => setPaymentToDelete(null)}
                          onConfirm={() => {
                            setPayments((prevPayments) =>
                              prevPayments.filter(
                                (payment) => payment.id !== paymentToDelete.id
                              )
                            );

                        setPaymentToDelete(null);
                      }}
              />           
            )}


     {expenseToDelete && (
  <ConfirmDialog
    title="Delete Expense"
    message={`Are you sure you want to delete "${expenseToDelete.title}"?`}
    onCancel={() => {
      if (!expenseDeleting) {
        setExpenseToDelete(null);
      }
    }}
    onConfirm={async () => {
      if (!expenseToDelete || expenseDeleting) return;

      setExpenseDeleting(true);
      setExpenseError("");

      let expenseDeleted = false;

      try {
        const deleteResponse = await fetch(
          `${API_BASE_URL}/expenses/${expenseToDelete.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const deleteData = await deleteResponse.json().catch(() => ({}));

        if (!deleteResponse.ok) {
          throw new Error(
            deleteData.message || "Failed to delete expense."
          );
        }

        expenseDeleted = true;

        setExpenses((prevExpenses) =>
          prevExpenses.filter(
            (expense) => expense.id !== expenseToDelete.id
          )
        );

        setExpenseToDelete(null);

        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const summaryUrl = getFinancialSummaryUrl();

        const [expensesResponse, summaryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/expenses`, { headers }),
          summaryUrl
            ? fetch(summaryUrl, { headers })
            : Promise.resolve(null),
        ]);

        const [expensesData, summaryData] = await Promise.all([
          expensesResponse.json().catch(() => ({})),
          summaryResponse
            ? summaryResponse.json().catch(() => ({}))
            : Promise.resolve({}),
        ]);

        if (!expensesResponse.ok) {
          throw new Error(
            "Expense deleted, but the expense list could not refresh."
          );
        }

        if (summaryResponse && !summaryResponse.ok) {
          throw new Error(
            "Expense deleted, but the financial summary could not refresh."
          );
        }

        setExpenses(
          (Array.isArray(expensesData) ? expensesData : []).map(
            (expense) => ({
              ...expense,
              date: expense.expense_date,
              title: expense.title,
              category: expense.expense_category_name,
              amount: Number(expense.amount) || 0,
              expenseCategoryId: expense.expense_category_id,
              paymentMethod: expense.payment_method,
              reference: expense.reference,
              description: expense.description || "",
            })
          )
        );

       if (summaryResponse) {
          setFinancialSummary({
            expectedFees: Number(summaryData.expectedFees) || 0,
            totalCollected: Number(summaryData.totalCollected) || 0,
            outstandingFees: Number(summaryData.outstandingFees) || 0,
            totalExpenses: Number(summaryData.totalExpenses) || 0,
            netBalance: Number(summaryData.netBalance) || 0,
            academicLevelBreakdown:
              summaryData.academicLevelBreakdown || [],
          });
      }
      } catch (error) {
        console.error("Expense deletion failed:", error);

        setExpenseError(
          error.message ||
            (expenseDeleted
              ? "Expense was deleted, but some data could not refresh."
              : "Failed to delete expense.")
        );
      } finally {
        setExpenseDeleting(false);
      }
    }}
    loading={expenseDeleting}
  />
)}


      {(showPaymentModal || editingPayment) && (
          <PaymentModal
            payment={editingPayment}
            financialAccounts={financialAccounts}
            error={paymentError}
            onClose={() => {
              setShowPaymentModal(false);
              setEditingPayment(null);
               setPaymentError("");
            }}
            
        onAddPayment={async (paymentData) => {
          setPaymentError("");

          const isCorrection = Boolean(paymentData.id);
          const actionLabel = isCorrection ? "Payment correction" : "Payment recording";

          try {
            const response = await fetch(
              isCorrection
                ? `${API_BASE_URL}/payments/${paymentData.id}`
                : `${API_BASE_URL}/payments`,
              {
                method: isCorrection ? "PATCH" : "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(
                  isCorrection
                    ? {
                        amount: paymentData.amount,
                        paymentDate: paymentData.paymentDate,
                        paymentMethod: paymentData.paymentMethod,
                        reference: paymentData.reference,
                        description: paymentData.description,
                        reason: paymentData.reason,
                      }
                    : {
                        studentId: paymentData.studentId,
                        financialAccountId: paymentData.financialAccountId,
                        amount: paymentData.amount,
                        paymentDate: paymentData.paymentDate,
                        paymentMethod: paymentData.paymentMethod,
                        reference: paymentData.reference,
                        description: paymentData.description,
                      }
                ),
              }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(
                data.message ||
                  (isCorrection
                    ? "Failed to correct payment."
                    : "Failed to record payment.")
              );
            }

            setShowPaymentModal(false);
            setEditingPayment(null);

            setRecentActivities((prevActivities) => [
              {
                id: Date.now(),
                activity: isCorrection
                  ? "School fee payment corrected"
                  : "School fees received",
                createdAt: new Date().toISOString(),
              },
              ...prevActivities,
            ]);

            const headers = {
              Authorization: `Bearer ${authToken}`,
            };

            const summaryUrl = getFinancialSummaryUrl();

            const [paymentsResponse, accountsResponse, summaryResponse] =
              await Promise.all([
                fetch(`${API_BASE_URL}/payments`, { headers }),
                fetch(`${API_BASE_URL}/student-financial-accounts`, { headers }),
                summaryUrl
                  ? fetch(summaryUrl, { headers })
                  : Promise.resolve(null),
              ]);

           const [paymentsData, accountsData, summaryData] = await Promise.all([
              paymentsResponse.json().catch(() => ({})),
              accountsResponse.json().catch(() => ({})),
              summaryResponse
                ? summaryResponse.json().catch(() => ({}))
                : Promise.resolve({}),
            ]);

            if (!paymentsResponse.ok) {
              throw new Error(`${actionLabel} succeeded, but transactions could not refresh.`);
            }

            if (!accountsResponse.ok) {
              throw new Error(`${actionLabel} succeeded, but student accounts could not refresh.`);
            }

            if (summaryResponse && !summaryResponse.ok) {
              throw new Error(`${actionLabel} succeeded, but the financial summary could not refresh.`);
            }

            setPayments(
              (paymentsData.payments || []).map((payment) => ({
                ...payment,
                studentId: payment.student_id,
                financialAccountId: payment.financial_account_id,
                studentName: [
                  payment.first_name,
                  payment.middle_name,
                  payment.last_name,
                ]
                  .filter(Boolean)
                  .join(" "),
                date: payment.payment_date,
                amount: Number(payment.amount) || 0,
                paymentMethod: payment.payment_method,
              }))
            );

            setFinancialAccounts(accountsData.financialAccounts || []);


            setSharedFinancialAccounts(
              (accountsData.financialAccounts || []).map((account) => ({
                id: account.id,
                studentId: account.student_id,
                enrollmentId: account.enrollment_id,
                academicSessionId: account.academic_session_id,
                academicSessionName: account.academic_session_name,
                termId: account.term_id,
                termName: account.term_name,
                feeStructureId: account.fee_structure_id,
                feeStructureName: account.fee_structure_name,
                className: account.class_name,
                academicLevelName: account.academic_level_name,
                totalDue: Number(account.total_due),
                totalPaid: Number(account.total_paid),
                status: account.status,
                outstanding: Math.max(
                  Number(account.total_due) - Number(account.total_paid),
                  0
                ),
              }))
            );

            if (summaryResponse) {
              setFinancialSummary({
                expectedFees: Number(summaryData.expectedFees) || 0,
                totalCollected: Number(summaryData.totalCollected) || 0,
                outstandingFees: Number(summaryData.outstandingFees) || 0,
                totalExpenses: Number(summaryData.totalExpenses) || 0,
                netBalance: Number(summaryData.netBalance) || 0,
                academicLevelBreakdown: summaryData.academicLevelBreakdown || [],
              });
            }
          } catch (error) {
            console.error("Payment request failed:", error);
            setPaymentError(error.message || "Payment operation failed.");
          }
        }}

     />
    )}



        {selectedPayment && selectedStudent && (
        <PaymentReceipt
          payment={selectedPayment}
          student={selectedStudent}
          onClose={() => setSelectedPayment(null)}
      />
    )}


    {(showExpenseModal || editingExpense) && (
          <ExpenseModal
              expense={editingExpense}
              academicSessions={academicSessions}
              academicTerms={academicTerms}
              categories={expenseCategories.filter((category) => category.is_active)}
              error={expenseSaveError}
              saving={expenseSaving}
              onClose={() => {
              setShowExpenseModal(false);
              setEditingExpense(null);
              setExpenseSaveError("");
            }}
            onAddExpense={async (expenseData) => {
              setExpenseSaving(true);
              setExpenseSaveError("");
              setExpenseError("");

              const isEditing = Boolean(expenseData.id);
              let expenseSaved = false;

              try {
                const response = await fetch(
                  isEditing
                    ? `${API_BASE_URL}/expenses/${expenseData.id}`
                    : `${API_BASE_URL}/expenses`,
                  {
                    method: isEditing ? "PATCH" : "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                      title: expenseData.title,
                      expenseCategoryId: expenseData.expenseCategoryId,
                      amount: expenseData.amount,
                      expenseDate: expenseData.expenseDate,
                      academicSessionId: expenseData.academicSessionId,
                      termId: expenseData.termId,
                      paymentMethod: expenseData.paymentMethod,
                      reference: expenseData.reference,
                      description: expenseData.description,
                    }),
                  }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                  throw new Error(
                    data.message ||
                      (isEditing
                        ? "Failed to update expense."
                        : "Failed to record expense.")
                  );
                }

                expenseSaved = true;

                setShowExpenseModal(false);
                setEditingExpense(null);

                const headers = {
                  Authorization: `Bearer ${authToken}`,
                };

              const summaryUrl = getFinancialSummaryUrl();

              const [expensesResponse, summaryResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/expenses`, { headers }),
                summaryUrl
                  ? fetch(summaryUrl, { headers })
                  : Promise.resolve(null),
              ]);

                const [expensesData, summaryData] = await Promise.all([
                  expensesResponse.json().catch(() => ({})),
                  summaryResponse
                    ? summaryResponse.json().catch(() => ({}))
                    : Promise.resolve({}),
                ]);
              if (!expensesResponse.ok) {
                  throw new Error(
                    "Expense saved, but the expense list could not refresh."
                  );
                }

                if (summaryResponse && !summaryResponse.ok) {
                  throw new Error(
                    "Expense saved, but the financial summary could not refresh."
                  );
                }

                setExpenses(
                  (Array.isArray(expensesData) ? expensesData : []).map((expense) => ({
                    ...expense,
                    date: expense.expense_date,
                    title: expense.title,
                    category: expense.expense_category_name,
                    amount: Number(expense.amount) || 0,
                    expenseCategoryId: expense.expense_category_id,
                    paymentMethod: expense.payment_method,
                    reference: expense.reference,
                    description: expense.description || "",
                  }))
                );

                if (summaryResponse) {
                  setFinancialSummary({
                    expectedFees: Number(summaryData.expectedFees) || 0,
                    totalCollected: Number(summaryData.totalCollected) || 0,
                    outstandingFees: Number(summaryData.outstandingFees) || 0,
                    totalExpenses: Number(summaryData.totalExpenses) || 0,
                    netBalance: Number(summaryData.netBalance) || 0,
                    academicLevelBreakdown:
                      summaryData.academicLevelBreakdown || [],
                  });
                }
              } catch (error) {
                console.error("Expense request failed:", error);

                if (expenseSaved) {
                  setExpenseError(error.message);
                } else {
                  setExpenseSaveError(error.message || "Expense operation failed.");
                }
              } finally {
                setExpenseSaving(false);
              }
            }}
          />
        )}


        {showExpenseCategoryModal && (
          <ExpenseCategoryModal
            categories={expenseCategories}
            authToken={authToken}
            apiBaseUrl={API_BASE_URL}
            onClose={() => setShowExpenseCategoryModal(false)}
            onCategoriesChange={setExpenseCategories}
          />
        )}
      
  </div>
  );
};

export default Accountant;