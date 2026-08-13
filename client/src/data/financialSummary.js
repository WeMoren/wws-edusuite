
import classFees from "./classFees";
import students from "./students";



export const calculateFinancialSummary = (payments, expenses) => {
  const totalCollected = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  );

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const outstandingFees = students.reduce((total, student) => {
  const studentFee = classFees[student.class];

  const studentPayments = payments
    .filter((payment) => payment.studentId === student.id)
    .reduce((totalPaid, payment) => totalPaid + Number(payment.amount), 0);

  return total + Math.max(studentFee - studentPayments, 0);
}, 0);


  const netBalance = totalCollected - totalExpenses;

  return {
    totalCollected,
    outstandingFees,
    totalExpenses,
    netBalance,
  };
};