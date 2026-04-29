import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import {
  inspectTemplate,
  parseCommaList,
  type TemplateRecord,
} from "../utils/templateRuntime";

type Contact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
};

type BulkRecipient = {
  to: string;
  variables?: string[];
  headerVariables?: string[];
  otpCode?: string;
  buttonValues?: string[];
};

type BulkPayload = {
  templateId: string;
  concurrency?: number;
  recipients: BulkRecipient[];
};

export default function SendPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [selectedContactPhone, setSelectedContactPhone] = useState("");
  const [to, setTo] = useState("");
  const [headerVariables, setHeaderVariables] = useState("");
  const [variables, setVariables] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [buttonValues, setButtonValues] = useState("");
  const [busy, setBusy] = useState(false);

  const [bulkJson, setBulkJson] = useState(
    JSON.stringify(
      {
        templateId: "",
        concurrency: 5,
        recipients: [
          {
            to: "919999999999",
            variables: ["A", "B"],
            headerVariables: [],
            buttonValues: ["order-123"],
          },
        ],
      },
      null,
      2
    )
  );
  const [bulkBusy, setBulkBusy] = useState(false);

  const approvedTemplates = useMemo(
    () => templates.filter((template) => template.status === "approved"),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((template) => template._id === templateId),
    [approvedTemplates, templateId]
  );

  const selectedTemplateSummary = useMemo(
    () => inspectTemplate(selectedTemplate),
    [selectedTemplate]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.all([API.templates.list(), API.contacts.list({ limit: 250 })])
      .then(([templateRes, contactRes]) => {
        if (!alive) return;
        const approved = (templateRes.templates || []).filter(
          (template: TemplateRecord) => template.status === "approved"
        );
        setTemplates(templateRes.templates || []);
        setContacts(contactRes.contacts || []);
        if (approved.length > 0) {
          const helloWorld = approved.find((template: TemplateRecord) => template.name === "hello_world");
          setTemplateId((current) => current || helloWorld?._id || approved[0]._id);
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load send workspace");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContactPhone) return;
    setTo(selectedContactPhone);
  }, [selectedContactPhone]);

  async function sendOne(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);

    try {
      if (!selectedTemplate) {
        throw new Error("Select an approved template first");
      }

      const payload = {
        templateId,
        to,
        headerVariables: parseCommaList(headerVariables),
        variables: parseCommaList(variables),
        otpCode: otpCode.trim(),
        buttonValues: parseCommaList(buttonValues),
      };

      const res = await API.messages.send(payload);
      setOk(`Sent. Message ID: ${res.message?.whatsappMessageId || res.message?._id}`);
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Send failed"
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendBulk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBulkBusy(true);

    try {
      const payload: BulkPayload = JSON.parse(bulkJson);

      if (!payload.templateId) {
        throw new Error("bulkJson.templateId is required");
      }

      const normalizedPayload: BulkPayload = {
        ...payload,
        recipients: (payload.recipients || []).map((recipient) => ({
          to: recipient.to,
          variables: recipient.variables,
          headerVariables: recipient.headerVariables,
          otpCode: recipient.otpCode?.trim(),
          buttonValues: recipient.buttonValues,
        })),
      };

      const res = await API.messages.bulk(normalizedPayload);
      setOk(`Bulk done. Results: ${res.count}`);
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.message ||
          e?.message ||
          "Bulk send failed"
      );
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[30px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(236,255,248,0.92))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Campaign launcher
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Send approved template messages to one contact or a full audience batch.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-800/72">
              Approved templates are pulled directly from your library. Use `hello_world` if it is
              already approved in Meta, or choose any other template and we will surface the runtime
              fields needed for send.
            </p>
          </div>

          <div className="rounded-[26px] border border-emerald-200 bg-white/78 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-800/55">
              Ready to launch
            </div>
            <div className="mt-3 text-4xl font-black text-ink-900">{approvedTemplates.length}</div>
            <div className="mt-2 text-sm leading-6 text-ink-800/72">
              Approved templates available right now.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {approvedTemplates.slice(0, 3).map((template) => (
                <Badge key={template._id} tone="good">
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}
      {ok ? (
        <div className="rounded-[24px] bg-brand-50 px-4 py-3 text-sm text-ink-900 ring-1 ring-brand-200">
          {ok}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
            Single send
          </div>
          <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
            Send from a contact-aware flow
          </div>

          <form className="mt-5 grid gap-4" onSubmit={sendOne}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Approved template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select approved template...</option>
                {approvedTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.language})
                  </option>
                ))}
              </Select>

              <Select
                label="Pick contact (optional)"
                value={selectedContactPhone}
                onChange={(e) => setSelectedContactPhone(e.target.value)}
              >
                <option value="">Manual phone entry</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact.phone}>
                    {contact.name || contact.phone}
                    {contact.company ? ` | ${contact.company}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="To (WhatsApp phone)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="919999999999"
              required
            />

            {selectedTemplate ? (
              <div className="rounded-[24px] border border-ink-900/8 bg-slate-50/80 p-4 text-sm text-ink-800/76">
                <div className="font-semibold text-ink-900">{selectedTemplate.name}</div>
                <div className="mt-2">
                  {selectedTemplate.category} | {selectedTemplate.language} | {selectedTemplate.source || "local"}
                </div>
              </div>
            ) : null}

            {selectedTemplateSummary.headerVariableCount > 0 ? (
              <Input
                label={`Header variables (${selectedTemplateSummary.headerVariableCount} required)`}
                value={headerVariables}
                onChange={(e) => setHeaderVariables(e.target.value)}
                placeholder="Festival sale"
              />
            ) : null}

            {selectedTemplateSummary.bodyVariableCount > 0 ? (
              <Input
                label={`Body variables (${selectedTemplateSummary.bodyVariableCount} required)`}
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                placeholder="John, 123456"
              />
            ) : null}

            {selectedTemplateSummary.otpButtons > 0 ? (
              <Input
                label="OTP code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                required
              />
            ) : null}

            {selectedTemplateSummary.dynamicUrlButtons.length > 0 ? (
              <Input
                label="Dynamic URL values"
                value={buttonValues}
                onChange={(e) => setButtonValues(e.target.value)}
                placeholder="order-123, summer-sale"
                hint={selectedTemplateSummary.dynamicUrlButtons
                  .map((button) => `${button.index + 1}: ${button.label}`)
                  .join(" | ")}
              />
            ) : null}

            <Button type="submit" disabled={busy || !templateId}>
              {busy ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Bulk JSON
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Broadcast payload
            </div>
            <div className="mt-2 text-sm text-ink-800/72">
              Use the same runtime fields supported in single send, including `headerVariables`,
              `variables`, `otpCode`, and `buttonValues`.
            </div>

            <form className="mt-5 grid gap-3" onSubmit={sendBulk}>
              <Textarea
                label="Payload (JSON)"
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="min-h-72 font-mono text-xs"
              />

              <Button type="submit" disabled={bulkBusy}>
                {bulkBusy ? "Sending..." : "Send bulk"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Best path
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Recommended flow
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-ink-800/74">
              <div className="rounded-[20px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                1. Import `hello_world` from the template library if it already exists in Meta.
              </div>
              <div className="rounded-[20px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                2. Add your audience in Contacts so sending and chatroom navigation stay simple.
              </div>
              <div className="rounded-[20px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                3. Use the Inbox page to continue conversations after the first approved template send.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
