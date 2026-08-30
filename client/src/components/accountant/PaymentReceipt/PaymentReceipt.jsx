import React, { useState } from "react";
import jsPDF from "jspdf";
import "./PaymentReceipt.css";
import { Download } from "lucide-react";

const PaymentReceipt = ({ payment, student, onClose }) => {
  const [schoolProfile] = useState(() => {
    const savedProfile = localStorage.getItem("schoolProfile");

    if (savedProfile) {
      return JSON.parse(savedProfile);
    }

    return {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
    };
  });

  const receiptNumber = `REC-${String(payment.id).padStart(5, "0")}`;

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();

    let y = 20;

    /* School Header */

    if (schoolProfile.logo) {
      try {
        doc.addImage(
          schoolProfile.logo,
          "PNG",
          85,
          10,
          40,
          40
        );

        y = 58;
      } catch (error) {
        console.error("Unable to add school logo to receipt PDF:", error);
      }
    }

    doc.setFontSize(18);

    doc.text(
      schoolProfile.name || "School",
      105,
      y,
      { align: "center" }
    );

    y += 9;

    doc.setFontSize(10);

    if (schoolProfile.address) {
      doc.text(
        schoolProfile.address,
        105,
        y,
        { align: "center" }
      );

      y += 6;
    }

    if (schoolProfile.phone) {
      doc.text(
        schoolProfile.phone,
        105,
        y,
        { align: "center" }
      );

      y += 6;
    }

    if (schoolProfile.email) {
      doc.text(
        schoolProfile.email,
        105,
        y,
        { align: "center" }
      );

      y += 10;
    }

    /* Receipt Title */

    doc.setFontSize(14);

    doc.text(
      "PAYMENT RECEIPT",
      105,
      y,
      { align: "center" }
    );

    y += 14;

   /* Receipt Details */

    doc.setFontSize(11);

    const labelX = 20;
    const valueX = 190;

    const addDetail = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, labelX, y);

      doc.setFont("helvetica", "normal");

      doc.text(
        String(value),
        valueX,
        y,
        { align: "right" }
      );

      y += 9;
    };

    addDetail("Receipt No:", receiptNumber);

    const paymentDate = new Date(payment.date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    addDetail("Date:", paymentDate);

    addDetail(
      "Student:",
      `${student.firstName} ${student.lastName}`
    );

    addDetail("Admission No:", student.admissionNo);

    addDetail("Class:", student.class);

    addDetail(
      "Amount Paid:",
      `N${payment.amount.toLocaleString()}`
    );

    addDetail(
      "Payment Method:",
      payment.paymentMethod
    );

    addDetail(
      "Description:",
      payment.description || "—"
    );

    /* Footer */

    /* Visual separator */
    y += 4;

    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, 190, y);

    y += 10;

    doc.text(
      "Thank you for your payment.",
      105,
      y,
      { align: "center" }
    );

    y += 10;

    doc.setFontSize(8);

      doc.setTextColor(150, 150, 150);

      doc.text(
        "Powered by WeMoren Web Services",
        105,
        y,
        { align: "center" }
      );

      doc.setTextColor(0, 0, 0);

    doc.save(`${receiptNumber}.pdf`);
  };

  return (
    <div className="payment-receipt">
      <div className="payment-receipt__content">

        <div className="payment-receipt__header">

          {schoolProfile.logo && (
            <img
              src={schoolProfile.logo}
              alt={`${schoolProfile.name} logo`}
              className="payment-receipt__logo"
            />
          )}

          <h2>{schoolProfile.name}</h2>

          <p>Payment Receipt</p>
        </div>

        <div className="payment-receipt__school-info">
          <p>{schoolProfile.address}</p>
          <p>{schoolProfile.phone}</p>
          <p>{schoolProfile.email}</p>
        </div>

        <div className="payment-receipt__details">

          <p>
            <strong>Receipt No:</strong> {receiptNumber}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(payment.date).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }
            )}
          </p>

          <p>
            <strong>Student:</strong>{" "}
            {student.firstName} {student.lastName}
          </p>

          <p>
            <strong>Admission No:</strong>{" "}
            {student.admissionNo}
          </p>

          <p>
            <strong>Class:</strong>{" "}
            {student.class}
          </p>

          <p className="payment-receipt__amount">
            <strong>Amount Paid:</strong>{" "}
            ₦{payment.amount.toLocaleString()}
          </p>

          <p>
            <strong>Payment Method:</strong>{" "}
            {payment.paymentMethod}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {payment.description || "—"}
          </p>

        </div>

        <div className="payment-receipt__actions">

          <button
            type="button"
            className="payment-receipt__print-button"
            onClick={handleDownloadReceipt}
          >
            <Download size={17} strokeWidth={2} />
            <span>Download Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

        <div className="payment-receipt__footer">
          <p>Thank you for your payment.</p>
          <small>Powered by WeMoren Web Services</small>
        </div>

      </div>
    </div>
  );
};

export default PaymentReceipt;