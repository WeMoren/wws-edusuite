
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import './Login.css'
import "./PasswordRecovery.css";

const API_BASE_URL = "http://localhost:5000/api";
const MIN_PASSWORD_LENGTH = 12;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const hasValidToken = /^[a-f0-9]{64}$/i.test(token);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!hasValidToken) {
            setError(
                "This password-reset link is invalid or has expired."
            );
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(
                `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
            );
            return;
        }

        if (password.length > 1024) {
            setError("Your password is too long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token, password }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        "We could not reset your password. Please try again."
                );
                return;
            }

            setPassword("");
            setConfirmPassword("");
            setSuccess(
                data.message ||
                    "Your password has been reset. Please sign in."
            );
        } catch (requestError) {
            console.error("Password reset failed:", requestError);
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
                    <p>Secure your account</p>
                </header>

                {success ? (
                    <div className="password-recovery-result">
                        <h2>Password updated</h2>
                        <p role="status">{success}</p>
                        <Link
                            className="password-recovery-button"
                            to="/login"
                        >
                            Continue to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="password-recovery-intro">
                            <h2>Create a new password</h2>
                            <p>
                                Choose a password of at least{" "}
                                {MIN_PASSWORD_LENGTH} characters.
                            </p>
                        </div>

                        {!hasValidToken && (
                            <p
                                className="login-form__error"
                                role="alert"
                            >
                                This password-reset link is missing a
                                valid token. Please use the complete link.
                            </p>
                        )}

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="login-form__group">
                                <label htmlFor="new-password">
                                    New password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="At least 12 characters"
                                    minLength={MIN_PASSWORD_LENGTH}
                                    maxLength={1024}
                                    required
                                    disabled={
                                        isSubmitting || !hasValidToken
                                    }
                                />
                            </div>

                            <div className="login-form__group">
                                <label htmlFor="confirm-new-password">
                                    Confirm new password
                                </label>
                                <input
                                    id="confirm-new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Enter it again"
                                    minLength={MIN_PASSWORD_LENGTH}
                                    maxLength={1024}
                                    required
                                    disabled={
                                        isSubmitting || !hasValidToken
                                    }
                                />
                            </div>

                            {error && (
                                <p
                                    className="login-form__error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="login-form__button"
                                disabled={
                                    isSubmitting || !hasValidToken
                                }
                            >
                                {isSubmitting
                                    ? "Updating password..."
                                    : "Reset password"}
                            </button>
                        </form>
                    </>
                )}

                <p className="login-register">
                    <Link to="/login">Back to login</Link>
                </p>
            </section>
        </main>
    );
};

export default ResetPassword;
