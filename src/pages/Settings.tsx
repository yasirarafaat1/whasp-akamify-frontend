import { useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const webhookUrl = `${API.baseUrl}/webhooks/whatsapp`;

  async function rotate() {
    if (!confirm("Rotate API key? Existing key will stop working.")) return;
    setBusy(true);
    try {
      const res = await API.auth.rotateApiKey();
      setApiKey(res.apiKey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-white/60 p-6 ring-1 ring-ink-900/10 backdrop-blur">
        <div className="text-xs font-semibold text-ink-800/60">Tenant</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          API key rotation + webhook URL quick reference.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Webhook URL</div>
        <div className="mt-2 break-all rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold ring-1 ring-ink-900/10">
          {webhookUrl}
        </div>
        <div className="mt-3 text-sm text-ink-800/70">
          Meta verification hits GET with hub params. Events come via POST.
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Automation API key</div>
        <div className="mt-2 text-sm text-ink-800/70">
          Use this key in your client app: <span className="font-semibold">X-API-Key</span>.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" onClick={rotate} disabled={busy}>
            {busy ? "Rotating..." : "Rotate key"}
          </Button>
          {apiKey ? (
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(apiKey)}>
              Copy new key
            </Button>
          ) : null}
        </div>

        {apiKey ? (
          <div className="mt-4 break-all rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-brand-200">
            {apiKey}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
