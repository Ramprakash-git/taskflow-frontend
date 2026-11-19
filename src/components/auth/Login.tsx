import { useState, type FormEvent } from "react";
import { signIn } from "aws-amplify/auth";
import { ListChecks, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./auth.css";

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Login({ onLogin, onRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn({
        username: email.trim(),
        password,
      });

      if (result.isSignedIn) {
        onLogin();
      } else {
        setError(
          "Additional authentication steps are required. Please contact support."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in.";

      setError(message);
    } finally {
      setLoading(false);
    }
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
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Good to see you.</h1>
          <p>Sign in to continue managing your work.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>

            <div className="auth-input-wrapper">
              <Mail size={18} />
              <input
                id="login-email"
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
            <label htmlFor="login-password">Password</label>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <div className="auth-switch">
          Don't have an account?
          <button type="button" onClick={onRegister}>
            Create account
          </button>
        </div>

        <div className="auth-footer">
          © 2026 TaskFlow. Made for focused work.
        </div>

      </div>
    </div>
  );
}