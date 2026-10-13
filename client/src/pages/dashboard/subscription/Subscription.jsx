
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import NotificationDialog from "../../../components/common/NotificationDialog/NotificationDialog";
import "./Subscription.css";

const API_BASE_URL = "http://localhost:5000/api";

const formatMoney = (amount, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));


  const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  });
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

const Subscription = () => {
  const { authToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCallback = location.pathname.endsWith("/callback");

  const [subscription, setSubscription] = useState(null);
  const [quote, setQuote] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingPayment, setStartingPayment] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyingReference, setVerifyingReference] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState(null);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
         const error = new Error(
          data.message || "The request could not be completed."
        );

        error.reference = data.reference;
        error.status = response.status;

        throw error;
    }

      return data;
    },
    [authToken]
  );

  const loadSubscriptionData = useCallback(async () => {
    setPageError("");
    setQuoteError("");

    const results = await Promise.allSettled([
      apiRequest("/subscription"),
      apiRequest("/subscription/quote"),
      apiRequest("/subscription/payments"),
    ]);

    if (results[0].status === "fulfilled") {
      setSubscription(results[0].value.subscription);
    } else {
      setPageError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setQuote(results[1].value.quote);
    } else {
      setQuote(null);
      setQuoteError(results[1].reason.message);
    }

    if (results[2].status === "fulfilled") {
      setPayments(results[2].value.payments || []);
    } else {
      setPayments([]);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!authToken) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const loadPage = async () => {
      setLoading(true);

      try {
        if (isCallback) {
          const params = new URLSearchParams(location.search);
          const reference =
            params.get("reference") || params.get("trxref");

          if (!reference) {
            throw new Error(
              "No payment reference was returned. Check your payment history before trying again."
            );
          }

          setVerifyingPayment(true);

          await apiRequest("/subscription/verify-payment", {
            method: "POST",
            body: JSON.stringify({ reference }),
          });

          if (!cancelled) {
            setNotice({
              title: "Payment verified",
              message:
                "Your subscription payment has been verified successfully.",
            });
          }
        }

        await loadSubscriptionData();
      } catch (error) {
        if (!cancelled) {
          if (isCallback) {
            setNotice({
              title: "Payment verification",
              message: error.message,
            });
          } else {
            setPageError(error.message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setVerifyingPayment(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [
    authToken,
    apiRequest,
    isCallback,
    location.search,
    loadSubscriptionData,
    navigate,
  ]);

    const verifyExistingPayment = async (reference) => {
  setVerifyingReference(reference);

  let verificationMessage = "";
  let verificationTitle = "Payment verification";

  try {
    const data = await apiRequest("/subscription/verify-payment", {
      method: "POST",
      body: JSON.stringify({ reference }),
    });

    verificationMessage =
      data.message ||
      "The payment verification request completed.";
  } catch (error) {
    verificationTitle = "Unable to confirm payment";
    verificationMessage =
      error.message ||
      "Payment verification could not be completed. Please try again.";
  }

  try {
    await loadSubscriptionData();
  } catch {
    verificationMessage +=
      " Your payment history could not be refreshed. Please reload the page.";
  }

  setNotice({
    title: verificationTitle,
    message: verificationMessage,
  });

  setVerifyingReference("");
};

    const startCheckout = async () => {
  setStartingPayment(true);

  try {
    const data = await apiRequest(
      "/subscription/initialize-payment",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    if (!data.authorization_url) {
      throw new Error("Paystack did not return a checkout URL.");
    }

    window.location.assign(data.authorization_url);
  } catch (error) {
    const referenceMessage = error.reference
      ? ` Payment reference: ${error.reference}. Open Payment history and use Verify payment before trying another checkout.`
      : "";

    setNotice({
      title: "Unable to start payment",
      message: `${error.message}${referenceMessage}`,
    });

    setStartingPayment(false);
  }
};

  const closeNotice = () => {
    setNotice(null);

    if (isCallback) {
      navigate("/dashboard/subscription", { replace: true });
    }
  };

  if (loading) {
    return (
      <main className="subscription-page">
        <p className="subscription-message">
          {verifyingPayment
            ? "Verifying your payment securely..."
            : "Loading subscription details..."}
        </p>
      </main>
    );
  }

  if (pageError && !subscription) {
    return (
      <main className="subscription-page">
        <h1>WWS Subscription</h1>
        <div className="subscription-alert">
          <p>{pageError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>

        {notice && (
          <NotificationDialog
            title={notice.title}
            message={notice.message}
            onClose={closeNotice}
          />
        )}
      </main>
    );
  }

  const status = subscription?.status || "unknown";

  return (
    <main className="subscription-page">
      <header className="subscription-header">
        <div>
          <p className="subscription-eyebrow">ACCOUNT BILLING</p>
          <h1>WWS Subscription</h1>
          <p>
            Manage your school's WWS-EduSuite subscription and annual billing.
          </p>
        </div>
        <span className={`subscription-status status-${status}`}>
          {formatStatus(status)}
        </span>
      </header>

      {pageError && (
        <div className="subscription-alert">
          {pageError}
        </div>
      )}

      <section className="subscription-overview">
        <article className="subscription-card subscription-plan-card">
          <h2>Current plan</h2>
          <p className="subscription-plan-name">
            {subscription?.plan_name || "WWS-EduSuite"}
          </p>
          <p className="subscription-muted">
            {subscription?.plan_description ||
              "Annual school management subscription"}
          </p>

          {status === "trial" && (
            <p className="subscription-highlight">
              {subscription?.remaining_trial_days ?? 0} trial day(s) remaining
            </p>
          )}

          <dl className="subscription-details">
            <div>
              <dt>Trial started</dt>
              <dd>{formatDate(subscription?.trial_start)}</dd>
            </div>
            <div>
              <dt>Trial ends</dt>
              <dd>{formatDate(subscription?.trial_end)}</dd>
            </div>
            <div>
              <dt>Subscription starts</dt>
              <dd>{formatDate(subscription?.start_date)}</dd>
            </div>
            <div>
              <dt>Subscription ends</dt>
              <dd>{formatDate(subscription?.end_date)}</dd>
            </div>
            <div>
              <dt>Grace period ends</dt>
              <dd>{formatDate(subscription?.grace_period_end)}</dd>
            </div>
          </dl>
        </article>

        <article className="subscription-card subscription-price-card">
          <h2>Annual billing</h2>

          {quote ? (
            <>
              <p className="subscription-price">
                {formatMoney(quote.amount, quote.currency)}
              </p>
              <p className="subscription-muted">
                Estimated annual subscription
              </p>

              <dl className="subscription-details">
                <div>
                  <dt>Active enrolled students</dt>
                  <dd>{quote.active_student_count}</dd>
                </div>
                <div>
                  <dt>Rate per student/year</dt>
                  <dd>
                    {formatMoney(
                      quote.price_per_student,
                      quote.currency
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Minimum annual fee</dt>
                  <dd>
                    {formatMoney(
                      quote.minimum_annual_amount,
                      quote.currency
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Billing period</dt>
                  <dd>{formatStatus(quote.billing_period)}</dd>
                </div>
              </dl>

              <p className="subscription-footnote">
                The final amount is recalculated by the server when payment
                starts.
              </p>

              <button
                type="button"
                className="subscription-primary-button"
                onClick={startCheckout}
                disabled={startingPayment}
              >
                {startingPayment
                  ? "Preparing checkout..."
                  : status === "active"
                    ? "Renew subscription"
                    : "Pay annual subscription"}
              </button>
            </>
          ) : (
            <div className="subscription-quote-error">
              <p>{quoteError || "A billing quote is currently unavailable."}</p>
              <p>
                Check your school's current academic session and subscription
                setup, then refresh this page.
              </p>
              <button
                type="button"
                className="subscription-secondary-button"
                onClick={() => window.location.reload()}
              >
                Refresh quote
              </button>
            </div>
          )}
        </article>
      </section>

      <section className="subscription-card subscription-history">
        <div className="subscription-section-heading">
          <div>
            <h2>Payment history</h2>
            <p className="subscription-muted">
              Records of your school's WWS subscription payments.
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="subscription-empty">
            No subscription payments have been recorded yet.
          </p>
        ) : (
          <div className="subscription-table-wrapper">
            <table className="subscription-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDateTime(payment.paid_at || payment.created_at)}</td>
                    <td className="subscription-reference">
                      {payment.payment_reference || "—"}
                    </td>
                    <td>
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td>{formatStatus(payment.payment_method || "—")}</td>
                    <td>
                      <span
                        className={`subscription-payment-status payment-${payment.status}`}
                      >
                        {formatStatus(payment.status)}
                      </span>
                    </td>
                    <td>
                        {payment.status === "pending" &&
                          payment.payment_reference && (
                            <button
                              type="button"
                              className="subscription-secondary-button"
                              onClick={() =>
                                verifyExistingPayment(payment.payment_reference)
                              }
                              disabled={verifyingReference !== ""}
                            >
                              {verifyingReference === payment.payment_reference
                                ? "Checking..."
                                : "Verify payment"}
                            </button>
                          )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {notice && (
        <NotificationDialog
          title={notice.title}
          message={notice.message}
          onClose={closeNotice}
        />
      )}
    </main>
  );
};

export default Subscription;
