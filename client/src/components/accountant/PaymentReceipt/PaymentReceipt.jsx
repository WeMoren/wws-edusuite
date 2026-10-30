import React, {useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import jsPDF from "jspdf";
import "./PaymentReceipt.css";
import { Download } from "lucide-react";

const PaymentReceipt = ({ payment, student, onClose }) => {

    const { authToken } = useAuth();

  const API_BASE_URL = "http://localhost:5000/api";

  const [schoolProfile, setSchoolProfile] = useState(null);
  const [documentAuthorization, setDocumentAuthorization] = useState(null);
  const [documentSettingsLoading, setDocumentSettingsLoading] = useState(true);
  const [documentSettingsLoaded, setDocumentSettingsLoaded] = useState(false);

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
      !documentAuthorization
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
      getStudentFullName(student)
    );

    addDetail(
      "Gender:",
      student.gender || "—"
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

          /* --------------------------------
            Official signatures/stamps
        -------------------------------- */

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

        /* Footer */

        doc.setFontSize(9);

        doc.setTextColor(0, 0, 0);

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
    )}
    </div>
  );
};

export default PaymentReceipt;