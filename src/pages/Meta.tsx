import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { RefreshCw } from "lucide-react";

type MetaStatus =
  | { status: "loading" }
  | { status: "disconnected"; credentials: null }
  | { status: "pending"; credentials: any }
  | { status: "active"; credentials: any };

function toneFor(status: MetaStatus["status"]) {
  if (status === "active") return "good";
  if (status === "pending") return "warn";
  return "bad";
}

export default function MetaConnectPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    if (metaStatus.status === "loading") return "Loading";
    if (metaStatus.status === "active") return "Connected";
    if (metaStatus.status === "pending") return "Pending";
    return "Not connected";
  }, [metaStatus.status]);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const res = await API.meta.status();
      const status = res?.status;
      if (status === "active") setMetaStatus({ status: "active", credentials: res.credentials });
      else if (status === "pending") setMetaStatus({ status: "pending", credentials: res.credentials });
      else setMetaStatus({ status: "disconnected", credentials: null });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to fetch Meta connection status");
      setMetaStatus({ status: "disconnected", credentials: null });
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (metaStatus.status !== "pending") return;
    const t = setInterval(loadStatus, 5000);
    return () => clearInterval(t);
  }, [metaStatus.status, loadStatus]);

  const onConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await API.auth.metaConnectUrl();
      const url = res?.url;
      if (!url) throw new Error("Missing OAuth URL");
      window.location.assign(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to start Meta OAuth");
      setBusy(false);
    }
  }, []);

  return (
    <div className="grid gap-5">
      <section className="rounded-[32px] bg-blue-600 text-white shadow-[0_28px_110px_rgba(37,99,235,0.35)] overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
            Meta Business Manager
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Connect your Meta account
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">
            This enables WhatsApp Cloud API for template sync, broadcasts, webhooks, and inbox.
          </p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge tone={toneFor(metaStatus.status)}>{statusLabel}</Badge>
              {metaStatus.status === "active" && metaStatus.credentials?.lastValidatedAt ? (
                <span className="text-xs text-white/70">
                  Last verified: {new Date(metaStatus.credentials.lastValidatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={loadStatus}
                disabled={busy}
              >
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Refresh
              </Button>
              <Button
                className="bg-white text-blue-700 hover:bg-white/90"
                onClick={onConnect}
                disabled={busy}
              >
                {busy ? "Connecting..." : "Connect Meta Business Manager"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="p-6">
        {metaStatus.status === "loading" ? (
          <Spinner label="Checking Meta connection..." />
        ) : (
          <div className="grid gap-3 text-sm text-ink-900/70">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-ink-900/40">
              Connection details
            </div>
            {metaStatus.status === "active" ? (
              <>
                <div>Graph API: {metaStatus.credentials?.graphApiVersion || "-"}</div>
                <div>WABA: {metaStatus.credentials?.businessAccountId || "-"}</div>
                <div>Phone Number ID: {metaStatus.credentials?.phoneNumberId || "-"}</div>
              </>
            ) : (
              <div>
                Status is <span className="font-semibold">{statusLabel}</span>. Click{" "}
                <span className="font-semibold">Connect Meta Business Manager</span> to start OAuth.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

