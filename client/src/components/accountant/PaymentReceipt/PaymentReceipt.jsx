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
          motto: profile.motto || "",
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

  const handleDownloadReceipt = async () => {


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

const convertImageToPng = async (imageSource) => {
  if (!imageSource || typeof imageSource !== "string") {
    return null;
  }

  if (imageSource.startsWith("data:image/png")) {
    return imageSource;
  }

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = window.document.createElement("canvas");

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        if (!image.naturalWidth || !image.naturalHeight) {
          resolve(null);
          return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        // Preserve the source image's transparency.
        context.drawImage(image, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.warn("Receipt image conversion failed.", error);
        resolve(null);
      }
    };

    image.onerror = (error) => {
      console.warn("Receipt image could not be loaded.", error);
      resolve(null);
    };

    image.src = imageSource;
  });
};




    let y = 20;

    /* Professional School Letterhead */

    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const logoSize = 28;
    const logoX = leftMargin;
    const logoY = 12;
    const schoolInfoX = logoX + logoSize + 8;
    const schoolInfoWidth = pageWidth - schoolInfoX - 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(25, 45, 75);

    const schoolNameLines = doc.splitTextToSize(
      schoolProfile.name || "School",
      schoolInfoWidth
    );

    doc.text(schoolNameLines, schoolInfoX, 19);

    let headerTextY = 19 + (schoolNameLines.length - 1) * 6;

   let logoRendered = false;

if (schoolProfile.logo) {
  const schoolLogo = await convertImageToPng(schoolProfile.logo);

  if (schoolLogo) {
    try {
      doc.addImage(
        schoolLogo,
        "PNG",
        logoX,
        logoY,
        logoSize,
        logoSize
      );

      logoRendered = true;
    } catch (error) {
      console.error("Unable to add school logo to receipt PDF:", error);
    }
  }
}

if (!logoRendered) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 130, 145);
  doc.text("LOGO", logoX + logoSize / 2, logoY + 15, {
    align: "center",
  });
}

    if (schoolProfile.motto) {
      headerTextY += 6;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 115);

      const mottoLines = doc.splitTextToSize(
        schoolProfile.motto,
        schoolInfoWidth
      );

      doc.text(mottoLines, schoolInfoX, headerTextY);

      headerTextY += (mottoLines.length - 1) * 4;
    }

    const schoolContactDetails = [];

    if (schoolProfile.address) {
      schoolContactDetails.push(schoolProfile.address);
    }

    if (schoolProfile.phone) {
      schoolContactDetails.push(schoolProfile.phone);
    }

    if (schoolProfile.email) {
      schoolContactDetails.push(schoolProfile.email);
    }

    if (schoolProfile.website) {
      schoolContactDetails.push(schoolProfile.website);
    }

    if (schoolContactDetails.length > 0) {
      headerTextY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 90, 105);

      const contactLines = doc.splitTextToSize(
        schoolContactDetails.join(" | "),
        schoolInfoWidth
      );

      doc.text(contactLines, schoolInfoX, headerTextY);

      headerTextY += (contactLines.length - 1) * 4;
    }

    const headerBottomY = Math.max(
      logoY + logoSize,
      headerTextY + 3
    );

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.7);
    doc.line(
      leftMargin,
      headerBottomY + 4,
      pageWidth - leftMargin,
      headerBottomY + 4
    );

    /* Receipt Title */

    y = headerBottomY + 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(25, 45, 75);

    doc.text(
      "PAYMENT RECEIPT",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    y += 14;




    /* Professional Receipt Details Panel */

    const detailsPanelX = 20;
    const detailsPanelWidth = 170;
    const detailsPanelPadding = 6;
    const detailsTextColor = [35, 45, 60];
    const detailsLabelColor = [105, 115, 130];
    const detailsBorderColor = [220, 226, 235];
    const detailsBackground = [248, 250, 252];

    const drawDetailsPanel = () => {
      if (variant === "student-details") {
        const leftColumnX = detailsPanelX + detailsPanelPadding;
        const rightColumnX = detailsPanelX + 87;
        const columnWidth = 75;

        const detailRows = [
          [
            ["Receipt No:", String(receiptNumber)],
            null,
          ],
          [
            [
              "Date:",
              new Date(payment.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            ],
            null,
          ],
          [
            ["Student:", getStudentFullName(student)],
            ["Gender:", student.gender || "—"],
          ],
          [
            ["Admission No:", student.admissionNo],
            ["Class:", student.class],
          ],
          [
            [
              "Amount Paid:",
              `N${Number(payment.amount).toLocaleString()}`,
            ],
            ["Payment Method:", payment.paymentMethod],
          ],
          [
            ["Description:", payment.description || "—"],
            null,
          ],
        ];

        const preparedRows = detailRows.map(([left, right]) => {
          const leftValue = left[1] == null ? "—" : String(left[1]);
          const rightValue = right
            ? right[1] == null
              ? "—"
              : String(right[1])
            : null;

          const leftLines = doc.splitTextToSize(
            leftValue,
            columnWidth
          );

          const rightLines = right
            ? doc.splitTextToSize(rightValue, columnWidth)
            : [];

          return {
            left,
            right,
            leftLines,
            rightLines,
            height: Math.max(
              14,
              Math.max(leftLines.length, rightLines.length) * 4 + 10
            ),
          };
        });

        const totalPanelHeight = preparedRows.reduce(
          (total, row) => total + row.height,
          0
        ) + detailsPanelPadding * 2;

        doc.setFillColor(...detailsBackground);
        doc.setDrawColor(...detailsBorderColor);
        doc.setLineWidth(0.25);

        doc.roundedRect(
          detailsPanelX,
          y,
          detailsPanelWidth,
          totalPanelHeight,
          2,
          2,
          "FD"
        );

        let rowY = y + detailsPanelPadding;

        preparedRows.forEach((row, index) => {
          const drawInfoCell = (item, lines, x, width) => {
            if (!item) return;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...detailsLabelColor);
            doc.text(item[0], x, rowY + 3);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...detailsTextColor);
            doc.text(lines, x, rowY + 8);

          };

          drawInfoCell(
            row.left,
            row.leftLines,
            leftColumnX,
            columnWidth
          );

          if (row.right) {
            drawInfoCell(
              row.right,
              row.rightLines,
              rightColumnX,
              columnWidth
            );
          }

          rowY += row.height;

          if (index < preparedRows.length - 1) {
            doc.setDrawColor(...detailsBorderColor);
            doc.setLineWidth(0.2);
            doc.line(
              detailsPanelX + detailsPanelPadding,
              rowY,
              detailsPanelX + detailsPanelWidth - detailsPanelPadding,
              rowY
            );
          }
        });

        y += totalPanelHeight + 8;

      } else {
        const accountantDetails = [];

        accountantDetails.push(
          ["Receipt No:", String(receiptNumber)]
        );

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

        accountantDetails.push(["Date:", paymentDate]);
        accountantDetails.push([
          "Student:",
          getStudentFullName(student),
        ]);
        accountantDetails.push([
          "Gender:",
          student.gender || "—",
        ]);
        accountantDetails.push([
          "Admission No:",
          student.admissionNo,
        ]);
        accountantDetails.push(["Class:", student.class]);
        accountantDetails.push([
          "Amount Paid:",
          `N${payment.amount.toLocaleString()}`,
        ]);
        accountantDetails.push([
          "Payment Method:",
          payment.paymentMethod,
        ]);
        accountantDetails.push([
          "Description:",
          payment.description || "—",
        ]);

        const rowHeight = 11;
        const panelHeight =
          accountantDetails.length * rowHeight + 12;

        doc.setFillColor(...detailsBackground);
        doc.setDrawColor(...detailsBorderColor);
        doc.setLineWidth(0.25);

        doc.roundedRect(
          detailsPanelX,
          y,
          detailsPanelWidth,
          panelHeight,
          2,
          2,
          "FD"
        );

        let rowY = y + 8;

        accountantDetails.forEach(([label, value], index) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...detailsLabelColor);

          doc.text(label, detailsPanelX + 6, rowY);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(...detailsTextColor);

          doc.text(
            String(value),
            detailsPanelX + detailsPanelWidth - 6,
            rowY,
            { align: "right" }
          );

          rowY += rowHeight;

          if (index < accountantDetails.length - 1) {
            doc.setDrawColor(...detailsBorderColor);
            doc.setLineWidth(0.15);

            doc.line(
              detailsPanelX + 6,
              rowY - 4,
              detailsPanelX + detailsPanelWidth - 6,
              rowY - 4
            );
          }
        });

        y += panelHeight + 8;
      }
    };

    drawDetailsPanel();



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
        doc.setFontSize(11);
        doc.setTextColor(35, 45, 60);

        doc.text(heading, leftMargin, y);

        y += 5;

        doc.setDrawColor(220, 226, 235);
        doc.setLineWidth(0.3);
        doc.line(leftMargin, y, rightMargin, y);

        y += 7;
      };

      const drawTableHeader = (columns) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(30, 58, 95);
        doc.setDrawColor(30, 58, 95);

        doc.rect(
          leftMargin,
          y - 5,
          rightMargin - leftMargin,
          9,
          "FD"
        );

        columns.forEach((column) => {
          doc.text(
            column.label,
            column.x,
            y,
            column.align ? { align: column.align } : {}
          );
        });

        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(35, 45, 60);
      };

      /* 1. Fee Items */

      drawSectionHeading("FEE ITEMS");

      const feeItems = Array.isArray(receiptAccount.items)
        ? receiptAccount.items
        : [];

      const feeDescriptionX = leftMargin + 3;
      const feeAmountX = rightMargin - 3;
      const feeDescriptionWidth = 125;

      const feeColumns = [
        { label: "Description", x: feeDescriptionX },
        { label: "Amount", x: feeAmountX, align: "right" },
      ];

      drawTableHeader(feeColumns);

      if (feeItems.length === 0) {
        ensureSpace(12);

        doc.setFillColor(248, 250, 253);
        doc.setDrawColor(220, 226, 235);
        doc.setLineWidth(0.2);

        doc.rect(
          leftMargin,
          y - 5,
          rightMargin - leftMargin,
          10,
          "FD"
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(105, 115, 130);

        doc.text(
          "No fee items available.",
          feeDescriptionX,
          y + 1
        );

        y += 12;
      } else {
        feeItems.forEach((item, index) => {
          const descriptionLines = doc.splitTextToSize(
            String(item.name || "Unnamed fee item"),
            feeDescriptionWidth
          );

          const rowHeight = Math.max(
            8,
            descriptionLines.length * 4.5 + 3
          );

          const previousPage = doc.internal.getNumberOfPages();

          ensureSpace(rowHeight + 2);

          if (doc.internal.getNumberOfPages() > previousPage) {
            drawTableHeader(feeColumns);
          }

          doc.setFillColor(
            index % 2 === 0 ? 248 : 255,
            index % 2 === 0 ? 250 : 255,
            index % 2 === 0 ? 253 : 255
          );

          doc.setDrawColor(220, 226, 235);
          doc.setLineWidth(0.2);

          doc.rect(
            leftMargin,
            y - 5,
            rightMargin - leftMargin,
            rowHeight,
            "FD"
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(45, 55, 70);

          doc.text(
            descriptionLines,
            feeDescriptionX,
            y
          );

          doc.text(
            formatAmount(item.amount),
            feeAmountX,
            y,
            { align: "right" }
          );

          y += rowHeight;
        });
      }

      ensureSpace(16);

      y += 3;

      doc.setFillColor(248, 250, 253);
      doc.setDrawColor(220, 226, 235);
      doc.setLineWidth(0.3);

      doc.rect(
        leftMargin,
        y - 5,
        rightMargin - leftMargin,
        12,
        "FD"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(35, 45, 60);

      doc.text(
        "TOTAL FEE",
        feeDescriptionX,
        y + 2
      );

      doc.setFontSize(10);
      doc.setTextColor(35, 55, 85);

      doc.text(
        formatAmount(receiptAccount.total_due),
        feeAmountX,
        y + 2,
        { align: "right" }
      );

      y += 16;

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

      const accountPanelX = leftMargin;
      const accountPanelWidth = rightMargin - leftMargin;
      const accountInnerPadding = 4;

      const accountColumns = {
        leftLabelX: accountPanelX + accountInnerPadding,
        leftValueX: accountPanelX + 37,
        rightLabelX: accountPanelX + 84,
        rightValueX: accountPanelX + 120,
      };

      const accountValueWidth = 31;
      const accountRightValueWidth = 46;

      const preparedAccountRows = accountDetails.map(
        ([left, right]) => {
          const leftValueLines = doc.splitTextToSize(
            String(left[1] ?? "—"),
            accountValueWidth
          );

          const rightValueLines = doc.splitTextToSize(
            String(right[1] ?? "—"),
            accountRightValueWidth
          );

          const rowHeight = Math.max(
            10,
            Math.max(
              leftValueLines.length,
              rightValueLines.length
            ) * 3.5 + 5
          );

          return {
            left,
            right,
            leftValueLines,
            rightValueLines,
            rowHeight,
          };
        }
      );

      const accountPanelPadding = 3;

      const accountPanelHeight =
        accountPanelPadding * 2 +
        preparedAccountRows.reduce(
          (total, row) => total + row.rowHeight,
          0
        );

      ensureSpace(accountPanelHeight + 3);

      const accountPanelTop = y;

      doc.setFillColor(248, 250, 253);
      doc.setDrawColor(220, 226, 235);
      doc.setLineWidth(0.25);

      doc.roundedRect(
        accountPanelX,
        accountPanelTop,
        accountPanelWidth,
        accountPanelHeight,
        2,
        2,
        "FD"
      );

      y = accountPanelTop + accountPanelPadding;

      preparedAccountRows.forEach((row, index) => {
        const rowTextY = y + 4;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(105, 115, 130);

        doc.text(
          row.left[0],
          accountColumns.leftLabelX,
          rowTextY
        );

        doc.text(
          row.right[0],
          accountColumns.rightLabelX,
          rowTextY
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(35, 55, 85);

        doc.text(
          row.leftValueLines,
          accountColumns.leftValueX,
          rowTextY
        );

        doc.text(
          row.rightValueLines,
          accountColumns.rightValueX,
          rowTextY
        );

        y += row.rowHeight;

        if (index < preparedAccountRows.length - 1) {
          doc.setDrawColor(220, 226, 235);
          doc.setLineWidth(0.2);

          doc.line(
            accountPanelX + accountInnerPadding,
            y,
            accountPanelX + accountPanelWidth - accountInnerPadding,
            y
          );
        }
      });

      y = accountPanelTop + accountPanelHeight + 3;

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
        const headerPageWidth = doc.internal.pageSize.getWidth();
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


<div className="payment-receipt__letterhead">
  <div className="payment-receipt__brand">
    {schoolProfile.logo && (
      <img
        src={schoolProfile.logo}
        alt={`${schoolProfile.name} logo`}
        className="payment-receipt__logo"
      />
    )}

    <div className="payment-receipt__school-details">
      <h2>{schoolProfile.name}</h2>

      {schoolProfile.motto && (
        <p className="payment-receipt__motto">
          {schoolProfile.motto}
        </p>
      )}

      <div className="payment-receipt__school-info">
        {schoolProfile.address && (
          <span>{schoolProfile.address}</span>
        )}
        {schoolProfile.phone && (
          <span>{schoolProfile.phone}</span>
        )}
        {schoolProfile.email && (
          <span>{schoolProfile.email}</span>
        )}
        {schoolProfile.website && (
          <span>{schoolProfile.website}</span>
        )}
      </div>
    </div>
  </div>

  <div className="payment-receipt__divider" />

  <h3 className="payment-receipt__title">
    PAYMENT RECEIPT
  </h3>
</div>


<div className="payment-receipt__details">
  <p>
    <strong>Receipt No</strong>
    <span>{receiptNumber}</span>
  </p>

  <p>
    <strong>Date</strong>
    <span>
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
    </span>
  </p>

  <p>
    <strong>Student</strong>
    <span>{getStudentFullName(student)}</span>
  </p>

  <p>
    <strong>Admission No</strong>
    <span>{student.admissionNo}</span>
  </p>

  <p>
    <strong>Class</strong>
    <span>{student.class}</span>
  </p>

  <p className="payment-receipt__amount">
    <strong>Amount Paid</strong>
    <span>₦{payment.amount.toLocaleString()}</span>
  </p>

  <p>
    <strong>Payment Method</strong>
    <span>{payment.paymentMethod}</span>
  </p>

  <p>
    <strong>Description</strong>
    <span>{payment.description || "—"}</span>
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