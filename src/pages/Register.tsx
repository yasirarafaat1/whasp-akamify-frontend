import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { apiKey } = await register(email, password, name);
      setApiKey(apiKey || null);
      // Give the user a chance to copy the API key.
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">New tenant</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          This creates your workspace and generates an API key for automation triggers.
        </p>

        {apiKey ? (
          <div className="mt-4 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-200">
            <div className="text-xs font-black text-ink-900">Your API key (copy now)</div>
            <div className="mt-2 break-all rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold ring-1 ring-ink-900/10">
              {apiKey}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(apiKey)}
              >
                Copy
              </Button>
              <Button onClick={() => navigate("/app", { replace: true })}>
                Go to dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
            {error ? <Alert>{error}</Alert> : null}

            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team / brand name"
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimum 8 characters."
              required
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Creating..." : "Create account"}
            </Button>
          </form>
        )}

        <div className="mt-4 text-sm text-ink-800/70">
          Already have an account?{" "}
          <Link className="font-semibold text-ink-900 underline" to="/login">
            Sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

