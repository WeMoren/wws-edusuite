

import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./AcceptInvitation.css";

const API_BASE_URL = "http://localhost:5000/api";
const MIN_PASSWORD_LENGTH = 12;

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidToken = /^[a-f0-9]{64}$/i.test(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!hasValidToken) {
      setError(
        "This invitation link is missing a valid token. Please use the complete link from your invitation email."
      );
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/staff/invitations/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "We could not accept this invitation. Please try again."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSuccess(
        data.message ||
          "Your account has been created successfully. You can now sign in."
      );
    } catch (requestError) {
      console.error("Invitation acceptance request failed:", requestError);
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="accept-invitation-page">
      <section className="accept-invitation-card">
        <header className="accept-invitation-header">
          <h1>WWS-EduSuite</h1>
          <p>Set up your staff account</p>
        </header>

        {success ? (
          <div className="accept-invitation-result" role="status">
            <h2>Invitation accepted</h2>
            <p>{success}</p>
            <Link
              className="accept-invitation-button"
              to="/login"
            >
              Continue to login
            </Link>
          </div>
        ) : (
          <>
            <div className="accept-invitation-intro">
              <h2>Welcome aboard!</h2>
              <p>
                Create a secure password to activate your staff account.
              </p>
            </div>

            {!hasValidToken && (
              <p className="accept-invitation-error" role="alert">
                This invitation link is missing a valid token. Please open
                the complete link from your invitation email.
              </p>
            )}

            <form
              className="accept-invitation-form"
              onSubmit={handleSubmit}
            >
              <div className="accept-invitation-group">
                <label htmlFor="invitation-password">
                  Create password
                </label>
                <input
                  id="invitation-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || !hasValidToken}
                />
              </div>

              <div className="accept-invitation-group">
                <label htmlFor="invitation-confirm-password">
                  Confirm password
                </label>
                <input
                  id="invitation-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || !hasValidToken}
                />
              </div>

              {error && (
                <p className="accept-invitation-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="accept-invitation-button"
                disabled={isSubmitting || !hasValidToken}
              >
                {isSubmitting
                  ? "Activating account..."
                  : "Activate account"}
              </button>
            </form>
          </>
        )}

        <p className="accept-invitation-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default AcceptInvitation;
