import { useState, type FormEvent } from "react";
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { ListChecks, Mail, Lock, User, ArrowLeft } from "lucide-react";
import "./auth.css";

interface RegisterProps {
  onRegisterComplete: () => void;
  onLogin: () => void;
}

export default function Register({
  onRegisterComplete,
  onLogin,
}: RegisterProps) {
  const [step, setStep] = useState<"register" | "verify">("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await signUp({
        username: email.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
            name: name.trim(),
          },
        },
      });

      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
      } else if (result.isSignUpComplete) {
        onRegisterComplete();
      } else {
        setError("Registration requires an additional step.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create account.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await confirmSignUp({
        username: email.trim(),
        confirmationCode: confirmationCode.trim(),
      });

      if (result.isSignUpComplete) {
        onRegisterComplete();
      } else {
        setError("Email verification requires an additional step.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to verify email.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await resendSignUpCode({
        username: email.trim(),
      });

      setSuccess("A new verification code has been sent to your email.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to resend code.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "verify") {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-brand">
            <div className="auth-brand-mark">
              <ListChecks size={24} />
            </div>
            <span>taskflow<span className="brand-dot">.</span></span>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">EMAIL VERIFICATION</span>
            <h1>Check your inbox.</h1>
            <p>
              We've sent a verification code to
              <strong> {email}</strong>.
            </p>
          </div>

          <form onSubmit={handleVerification} className="auth-form">

            <div className="auth-field">
              <label htmlFor="confirmation-code">Verification code</label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="confirmation-code"
                  type="text"
                  placeholder="Enter verification code"
                  value={confirmationCode}
                  onChange={(event) =>
                    setConfirmationCode(event.target.value)
                  }
                  required
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify email"}
            </button>

          </form>

          <button
            type="button"
            className="auth-text-button"
            onClick={handleResendCode}
            disabled={loading}
          >
            Resend verification code
          </button>

          <button
            type="button"
            className="auth-back-button"
            onClick={() => setStep("register")}
          >
            <ArrowLeft size={15} /> Back to registration
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-mark">
            <ListChecks size={24} />
          </div>
          <span>taskflow<span className="brand-dot">.</span></span>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">GET STARTED</span>
          <h1>Create your account.</h1>
          <p>Start organizing your work with TaskFlow.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">

          <div className="auth-field">
            <label htmlFor="register-name">Your name</label>

            <div className="auth-input-wrapper">
              <User size={18} />

              <input
                id="register-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={30}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                id="register-password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
            </div>

            <span className="auth-hint">
              Minimum 12 characters, including uppercase, lowercase,
              number and symbol.
            </span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

        </form>

        <div className="auth-switch">
          Already have an account?
          <button type="button" onClick={onLogin}>
            Sign in
          </button>
        </div>

        <div className="auth-footer">
          © 2026 TaskFlow. Made for focused work.
        </div>

      </div>
    </div>
  );
}