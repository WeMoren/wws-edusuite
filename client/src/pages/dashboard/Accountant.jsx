import React, {useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Accountant.css";
import FinanceCard from "../../components/accountant/FinanceCard/FinanceCard";
/*import financialSummary from "../../data/financialSummary";*/
import FinanceAction from "../../components/accountant/FinanceAction/FinanceAction";
import PaymentModal from "../../components/accountant/PaymentModal/PaymentModal";
import initialPayments from "../../data/payments";
import TransactionTable from "../../components/accountant/TransactionTable/TransactionTable";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import initialExpenses from "../../data/expenses";
import ExpenseModal from "../../components/accountant/ExpenseModal/ExpenseModal";
import ExpenseTable from "../../components/accountant/ExpenseTable/ExpenseTable";
import students from "../../data/students";
import { calculateFinancialSummary } from "../../data/financialSummary";
import PaymentReceipt from "../../components/accountant/PaymentReceipt/PaymentReceipt";



const Accountant = () => {

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
   const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState("");
const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
const [paymentDateFrom, setPaymentDateFrom] = useState("");
const [paymentDateTo, setPaymentDateTo] = useState("");
const {payments, setPayments} = useOutletContext();

  const [expenses, setExpenses] = useState(()  =>{
    const savedExpenses = localStorage.getItem("expenses");

    return savedExpenses ? JSON.parse(savedExpenses) : initialExpenses;
  });
  

  useEffect(()  =>{
    localStorage.setItem("expenses", JSON.stringify(expenses))
  })


  const financialSummary = calculateFinancialSummary(payments, expenses);


  useEffect(()  => { 
    localStorage.setItem("payments", JSON.stringify(payments))
  }, [payments])


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

  return (
    <div className="accountant-page">
      <div className="accountant-page__header">
        <div>
          <h1>Accountant</h1>
          <p>Manage school finances and transactions.</p>
        </div>
      </div>

        <div className="accountant-page__summary">
          <FinanceCard
            title="Total Collected"
            value={`₦${financialSummary.totalCollected.toLocaleString()}`}
            description="Total fees collected"
          />

          <FinanceCard
            title="Outstanding Fees"
            value={`₦${financialSummary.outstandingFees.toLocaleString()}`}
            description="Fees yet to be collected"
          />

          <FinanceCard
            title="Total Expenses"
            value={`₦${financialSummary.totalExpenses.toLocaleString()}`}
            description="School expenses"
          />

          <FinanceCard
            title="Net Balance"
            value={`₦${financialSummary.netBalance.toLocaleString()}`}
            description="Current financial balance"
          />
        </div>


      <section className="accountant-page__actions">
        <div className="accountant-page__section-header">
            <h2>Quick Actions</h2>
            <p>Record and manage financial activity.</p>
          </div>

          <div className="accountant-page__actions-grid">
            <FinanceAction
              label="Record Payment"
              description="Record a student fee payment."
              onClick={() => setShowPaymentModal(true)}
            />

            <FinanceAction
              label="Add Expense"
              description="Record a school expense."
               onClick={() => setShowExpenseModal(true)}
            />
        </div>
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
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
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
                onEdit={(payment) => setEditingPayment(payment)}
                 onDelete={(payment) => setPaymentToDelete(payment)}
                 onReceipt={(payment) => setSelectedPayment(payment)}
            />
        </section>

        <section className="accountant-page__expenses">
            <div className="accountant-page__section-header">
              <h2>Recent Expenses</h2>
              <p>View recent school expenses.</p>
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
            onCancel={() => setExpenseToDelete(null)}
            onConfirm={() => {
              setExpenses((prevExpenses) =>
                prevExpenses.filter(
                  (expense) => expense.id !== expenseToDelete.id
                )
              );

              setExpenseToDelete(null);
            }}
       />
)}


      {(showPaymentModal || editingPayment) && (
          <PaymentModal
            payment={editingPayment}
            onClose={() => {
              setShowPaymentModal(false);
              setEditingPayment(null);
            }}
            onAddPayment={(paymentData) => {
            setPayments((prevPayments) => {
              if (paymentData.id) {
                return prevPayments.map((payment) =>
                  payment.id === paymentData.id
                    ? paymentData
                    : payment
                );
              }

              return [
                ...prevPayments,
                {
                  ...paymentData,
                  id:
                    prevPayments.length > 0
                      ? Math.max(
                          ...prevPayments.map((payment) => payment.id)
                        ) + 1
                      : 1,
                },
              ];
            });

            setShowPaymentModal(false);
            setEditingPayment(null);
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
                onClose={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
               }}
           onAddExpense={(expenseData) => {
          setExpenses((prevExpenses) => {
            if (expenseData.id) {
              return prevExpenses.map((expense) =>
                expense.id === expenseData.id
                  ? expenseData
                  : expense
              );
            }

            return [
              ...prevExpenses,
              {
                ...expenseData,
                id:
                  prevExpenses.length > 0
                    ? Math.max(
                        ...prevExpenses.map((expense) => expense.id)
                      ) + 1
                    : 1,
              },
            ];
          });

        setShowExpenseModal(false);
        setEditingExpense(null);
}}
         />
        )}
  </div>
  );
};

export default Accountant;