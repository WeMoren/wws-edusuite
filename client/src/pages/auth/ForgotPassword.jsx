
import React, { useState } from "react";
import { Link } from "react-router-dom";
import './Login.css';
import "./PasswordRecovery.css";

const API_BASE_URL = "http://localhost:5000/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        "We could not process your request. Please try again later."
                );
                return;
            }

            setMessage(
                data.message ||
                    "If an account with that email exists, password-reset instructions will be sent."
            );
        } catch (requestError) {
            console.error("Password-reset request failed:", requestError);
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-card">
                <header className="login-card__header">
                    <h1>WWS-EduSuite</h1>
                    <p>Recover your account</p>
                </header>

                <div className="password-recovery-intro">
                    <h2>Forgot your password?</h2>
                    <p>
                        Enter the email address associated with your
                        account. If it matches an active account, we will
                        provide instructions to reset your password.
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form__group">
                        <label htmlFor="recovery-email">
                            Email address
                        </label>
                        <input
                            id="recovery-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your account email"
                            maxLength={255}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <p className="login-form__error" role="alert">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p
                            className="password-recovery-message"
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="login-form__button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : "Send reset instructions"}
                    </button>
                </form>

                <p className="login-register">
                    Remembered your password?{" "}
                    <Link to="/login">Back to login</Link>
                </p>
            </section>
        </main>
    );
};

export default ForgotPassword;
