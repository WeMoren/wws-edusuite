import React, {useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import jsPDF from "jspdf";
import "./PaymentReceipt.css";
import { Download } from "lucide-react";

  const PaymentReceipt = ({
  payment,
  student,
  onClose,
  variant = "default",
  financialAccount = null,
  accountPayments = [],
}) => {

    const { authToken } = useAuth();

  const API_BASE_URL = "http://localhost:5000/api";

  const [schoolProfile, setSchoolProfile] = useState(null);
  const [documentAuthorization, setDocumentAuthorization] = useState(null);
  const [documentSettingsLoading, setDocumentSettingsLoading] = useState(true);
  const [documentSettingsLoaded, setDocumentSettingsLoaded] = useState(false);

    const [receiptAccount, setReceiptAccount] = useState(null);
    const [receiptAccountLoading, setReceiptAccountLoading] =
      useState(false);
    const [receiptAccountError, setReceiptAccountError] =
     useState("");


    const getStudentFullName = (student) =>
    [
      student?.firstName,
      student?.middleName,
      student?.lastName,
    ]
      .filter(
        (name) =>
          typeof name === "string" && name.trim() !== ""
      )
      .map((name) => name.trim())
      .join(" ");


     useEffect(() => {
  if (variant !== "student-details") {
    setReceiptAccount(null);
    setReceiptAccountLoading(false);
    setReceiptAccountError("");
    return;
  }

  if (!financialAccount?.id) {
    setReceiptAccount(null);
    setReceiptAccountLoading(false);
    setReceiptAccountError(
      "No financial account is associated with this payment."
    );
    return;
  }

  let cancelled = false;

  const loadReceiptAccount = async () => {
    setReceiptAccount(null);
    setReceiptAccountLoading(true);
    setReceiptAccountError("");

    try {
      if (!authToken) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/student-financial-accounts/${financialAccount.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load financial account details."
        );
      }

      if (!data.financialAccount) {
        throw new Error(
          "Financial account details were not returned by the server."
        );
      }

      if (!cancelled) {
        setReceiptAccount(data.financialAccount);
      }
    } catch (error) {
      if (!cancelled) {
        setReceiptAccountError(error.message);
      }
    } finally {
      if (!cancelled) {
        setReceiptAccountLoading(false);
      }
    }
  };

  loadReceiptAccount();

  return () => {
    cancelled = true;
  };
}, [variant, financialAccount?.id, authToken]);


  useEffect(() => {
    let cancelled = false;

    const loadDocumentSettings = async () => {
      setDocumentSettingsLoading(true);
      setDocumentSettingsLoaded(false);

      try {
        if (!authToken) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const [profileResponse, officialsResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/school-profile`, { headers }),
            fetch(`${API_BASE_URL}/school-officials`, { headers }),
          ]);

        const [profileData, officialsData] = await Promise.all([
          profileResponse.json().catch(() => ({})),
          officialsResponse.json().catch(() => ({})),
        ]);

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message ||
              "Failed to load the school profile."
          );
        }

        if (!officialsResponse.ok) {
          throw new Error(
            officialsData.message ||
              "Failed to load school officials."
          );
        }

        if (cancelled) return;

        const profile = profileData.profile || {};

        setSchoolProfile({
          name: profile.name || "",
          address: profile.address || "",
          phone: profile.phone || "",
          email: profile.email || "",
          website: profile.website || "",
          logo: profile.logo_url || "",
        });

        const defaults = {
          principal: {
            name: "",
            title: "Principal",
            signature: "",
            stamp: "",
          },
          accountingOfficer: {
            name: "",
            title: "Accounting Officer",
            signature: "",
            stamp: "",
          },
        };

        const typeMap = {
          principal: "principal",
          accounting_officer: "accountingOfficer",
        };

        const authorization = { ...defaults };

        for (const official of officialsData.officials || []) {
          const key = typeMap[official.official_type];

          if (!key) continue;

          authorization[key] = {
            name: official.name || "",
            title: official.title || defaults[key].title,
            signature: official.signature_url || "",
            stamp: official.stamp_url || "",
          };
        }

        setDocumentAuthorization(authorization);
        setDocumentSettingsLoaded(true);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Unable to load receipt document settings:",
          error
        );
      } finally {
        if (!cancelled) {
          setDocumentSettingsLoading(false);
        }
      }
    };

    loadDocumentSettings();

    return () => {
      cancelled = true;
    };
  }, [authToken]);


  const receiptNumber = `REC-${String(payment.id).padStart(5, "0")}`;

  const handleDownloadReceipt = () => {


 if (
  documentSettingsLoading ||
  !documentSettingsLoaded ||
  !schoolProfile ||
  !documentAuthorization ||
  (
    variant === "student-details" &&
    (
      receiptAccountLoading ||
      receiptAccountError ||
      !receiptAccount
    )
  )
) {
      console.error(
        "Receipt download blocked: current school document settings are unavailable."
      );
      return;
    }


    console.log("Receipt student:", student);

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

    if (variant === "student-details") {
      // Compact layout: two label/value pairs per row.
            doc.setFontSize(9);

      const drawDetailRow = (left, right = null) => {
        const leftValue = left[1] == null ? "—" : String(left[1]);

        doc.setFont("helvetica", "bold");
        doc.text(left[0], 20, y);

        doc.setFont("helvetica", "normal");
        doc.text(leftValue, 62, y);

        if (right) {
          const rightValue =
            right[1] == null ? "—" : String(right[1]);

          doc.setFont("helvetica", "bold");
          doc.text(right[0], 110, y);

          doc.setFont("helvetica", "normal");
          doc.text(rightValue, 153, y);
        }

        y += 9;
      };

      const paymentDate = new Date(payment.date).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      // Give the long receipt reference its own row.
      doc.setFont("helvetica", "bold");
      doc.text("Receipt No:", 20, y);

      doc.setFont("helvetica", "normal");
      doc.text(String(receiptNumber), 62, y);

      y += 9;

      drawDetailRow(["Date:", paymentDate]);

      drawDetailRow(
        ["Student:", getStudentFullName(student)],
        ["Gender:", student.gender || "—"]
      );

      drawDetailRow(
        ["Admission No:", student.admissionNo],
        ["Class:", student.class]
      );

      drawDetailRow(
        ["Amount Paid:", `N${Number(payment.amount).toLocaleString()}`],
        ["Payment Method:", payment.paymentMethod]
      );

      drawDetailRow(
        ["Description:", payment.description || "—"]
      );
    } else {
      // Preserve the original Accountant receipt layout.
      doc.setFontSize(11);

      const labelX = 20;
      const valueX = 190;

      const addDetail = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, labelX, y);

        doc.setFont("helvetica", "normal");
        doc.text(String(value), valueX, y, { align: "right" });

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
      addDetail("Student:", getStudentFullName(student));
      addDetail("Gender:", student.gender || "—");
      addDetail("Admission No:", student.admissionNo);
      addDetail("Class:", student.class);
      addDetail(
        "Amount Paid:",
        `N${payment.amount.toLocaleString()}`
      );
      addDetail("Payment Method:", payment.paymentMethod);
      addDetail("Description:", payment.description || "—");
    }


        /* --------------------------------
       Student Details: Financial Account
    -------------------------------- */

    if (variant === "student-details") {
          if (!receiptAccount) {
        console.error(
          "Receipt download blocked: financial account details are unavailable."
        );
        return;
      }

     const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 20;
    const rightMargin = 190;

      const formatAmount = (amount) =>
        `N${Number(amount || 0).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      const ensureSpace = (requiredHeight) => {
        if (y + requiredHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const drawSectionHeading = (heading) => {
        ensureSpace(18);

        y += 5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        doc.text(heading, leftMargin, y);

        y += 5;

        doc.setLineWidth(0.4);
        doc.line(leftMargin, y, rightMargin, y);

        y += 7;
      };

      const drawTableHeader = (columns) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);

        columns.forEach((column) => {
          doc.text(
            column.label,
            column.x,
            y,
            column.align ? { align: column.align } : {}
          );
        });

        y += 3;

        doc.setLineWidth(0.3);
        doc.line(leftMargin, y, rightMargin, y);

        y += 6;
      };

      /* 1. Fee Items */

      drawSectionHeading("FEE ITEMS");

      const feeItems = Array.isArray(receiptAccount.items)
        ? receiptAccount.items
        : [];

      const feeDescriptionX = leftMargin;
      const feeAmountX = rightMargin;
      const feeDescriptionWidth = 125;

      drawTableHeader([
        { label: "Description", x: feeDescriptionX },
        { label: "Amount", x: feeAmountX, align: "right" },
      ]);

      if (feeItems.length === 0) {
        ensureSpace(10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("No fee items available.", feeDescriptionX, y);

        y += 8;
      } else {
        feeItems.forEach((item) => {
          const descriptionLines = doc.splitTextToSize(
            String(item.name || "Unnamed fee item"),
            feeDescriptionWidth
          );

          const rowHeight = Math.max(
            8,
            descriptionLines.length * 4.5 + 3
          );

          ensureSpace(rowHeight + 2);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);

          doc.text(descriptionLines, feeDescriptionX, y);

          doc.text(
            formatAmount(item.amount),
            feeAmountX,
            y,
            { align: "right" }
          );

          y += rowHeight;

          doc.setLineWidth(0.2);
          doc.setDrawColor(190, 190, 190);
          doc.line(leftMargin, y, rightMargin, y);

          y += 4;
        });
      }

      ensureSpace(14);

      y += 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      doc.text("TOTAL FEE", feeDescriptionX, y);

      doc.text(
        formatAmount(receiptAccount.total_due),
        feeAmountX,
        y,
        { align: "right" }
      );

      y += 8;

     /* 2. Account Breakdown */

drawSectionHeading("ACCOUNT BREAKDOWN");

const paymentStatusLabels = {
  paid: "Fully Paid",
  partially_paid: "Partially Paid",
  unpaid: "Unpaid",
};

const accountDetails = [
  [
    ["Academic Session:", receiptAccount.academic_session_name],
    ["Term:", receiptAccount.term_name],
  ],
  [
    ["Class:", receiptAccount.class_name],
    ["Fee Structure:", receiptAccount.fee_structure_name],
  ],
  [
    ["Total Due:", formatAmount(receiptAccount.total_due)],
    ["Total Paid:", formatAmount(receiptAccount.total_paid)],
  ],
  [
    [
      "Outstanding:",
      formatAmount(
        receiptAccount.outstanding ??
          (
            Number(receiptAccount.total_due || 0) -
            Number(receiptAccount.total_paid || 0)
          )
      ),
    ],
    [
      "Payment Status:",
      paymentStatusLabels[receiptAccount.status] ||
        receiptAccount.status ||
        "—",
    ],
  ],
];

accountDetails.forEach(([left, right]) => {
  ensureSpace(10);

  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text(left[0], leftMargin, y);

  doc.setFont("helvetica", "normal");
  doc.text(String(left[1] ?? "—"), 62, y);

  doc.setFont("helvetica", "bold");
  doc.text(right[0], 110, y);

  doc.setFont("helvetica", "normal");
  doc.text(String(right[1] ?? "—"), 153, y);

  y += 10;
});

        y += 3;

     // Separator before document authorisation.
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      doc.line(20, y + 2, 190, y + 2);
      doc.setLineWidth(0.1);

      y += 8;

      doc.setDrawColor(0, 0, 0);
      doc.setTextColor(0, 0, 0);

    }

          /* --------------------------------
            Official signatures/stamps
        -------------------------------- */



        if (
            variant === "student-details" &&
            y + 92 > doc.internal.pageSize.getHeight() - 20
          ) {
            doc.addPage();
            y = 20;
          }

          y += 12;

        const signatureTopY = y;

        const signatureWidth = 75;
        const signatureHeight = 18;

        const leftSignatureX = 25;
        const rightSignatureX = 110;

        const principal =
          documentAuthorization.principal;

        const accountingOfficer =
          documentAuthorization.accountingOfficer;

        const drawOfficial = ({
          official,
          x,
          fallbackTitle,
        }) => {
          const officialName =
            official?.name || "—";

          const officialTitle =
            official?.title ||
            fallbackTitle;

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(10);

          doc.text(
            officialName,
            x,
            signatureTopY
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(8);

          doc.text(
            officialTitle,
            x,
            signatureTopY + 7
          );

          /*
            Digital signature
          */

          if (official?.signature) {
            try {
              doc.addImage(
                official.signature,
                "PNG",
                x,
                signatureTopY + 11,
                signatureWidth,
                signatureHeight
              );
            } catch (error) {
              console.error(
                `Unable to add ${officialTitle} digital signature:`,
                error
              );
            }
          }

          /*
            Physical signature area
          */

          doc.line(
            x,
            signatureTopY + 32,
            x + signatureWidth,
            signatureTopY + 32
          );

          /*
            Digital stamp
          */

          if (official?.stamp) {
            try {
              doc.addImage(
                official.stamp,
                "PNG",
                x + 48,
                signatureTopY + 34,
                27,
                27
              );
            } catch (error) {
              console.error(
                `Unable to add ${officialTitle} digital stamp:`,
                error
              );
            }
          }

          /*
            Physical stamp area
          */

          doc.setFontSize(7);

          doc.text(
            "Signature / Stamp",
            x,
            signatureTopY + 40
          );
        };

        drawOfficial({
          official: principal,
          x: leftSignatureX,
          fallbackTitle: "Principal",
        });

        drawOfficial({
          official: accountingOfficer,
          x: rightSignatureX,
          fallbackTitle: "Accounting Officer",
        });

        y =
          signatureTopY +
          68;


                /* PDF Footer - All Receipt Variants */

        const totalPages = doc.internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
          doc.setPage(pageNumber);

          const footerY = pageHeight - 10;

          // Left: Page number
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);

          doc.text(
            `Page ${pageNumber} of ${totalPages}`,
            20,
            footerY
          );

          // Centre: Closing message
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);

          doc.text(
            "Thank you for your payment.",
            pageWidth / 2,
            footerY,
            { align: "center" }
          );

          // Right: WeMoren branding
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);

          doc.text(
            "Powered by WeMoren Web Services",
            pageWidth - 20,
            footerY,
            { align: "right" }
          );
        }

        doc.setTextColor(0, 0, 0);

        doc.save(`${receiptNumber}.pdf`);

        doc.save(`${receiptNumber}.pdf`);

    }

  return (
  <div className="payment-receipt">
    {documentSettingsLoading || !documentSettingsLoaded ? (
      <div className="payment-receipt__content">
        <p>Loading the latest school details...</p>
      </div>
    ) : !schoolProfile || !documentAuthorization ? (
      <div className="payment-receipt__content">
        <p>
          Unable to load the latest school document settings.
          Please close this receipt and try again.
        </p>
      </div>
    ) : (
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
            {getStudentFullName(student)}
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
                disabled={
                  documentSettingsLoading ||
                  !documentSettingsLoaded ||
                  (
                    variant === "student-details" &&
                    (
                      receiptAccountLoading ||
                      !!receiptAccountError ||
                      !receiptAccount
                    )
                  )
                }
              >
            <Download size={17} strokeWidth={2} />
            <span>Download Receipt</span>
          </button>

          {variant === "student-details" && receiptAccountLoading && (
              <p>Loading financial account details...</p>
            )}

            {variant === "student-details" && receiptAccountError && (
              <p className="payment-receipt__error">
                {receiptAccountError}
              </p>
            )}

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
    )}
    </div>
  );
};

export default PaymentReceipt;