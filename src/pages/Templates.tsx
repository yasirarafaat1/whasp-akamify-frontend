import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { Spinner } from "../components/ui/Spinner";
import type { TemplateRecord } from "../utils/templateRuntime";

type TemplateCategory = "utility" | "marketing" | "authentication";
type TemplateStatus = "draft" | "pending" | "approved" | "rejected" | "paused" | "disabled";
type ButtonKind = "NONE" | "URL" | "QUICK_REPLY";
type UrlKind = "static" | "dynamic";

type MetaTemplateButton =
  | {
      type: "URL";
      text: string;
      url: string;
    }
  | {
      type: "QUICK_REPLY";
      text: string;
    }
  | {
      type: "OTP";
      otp_type: "COPY_CODE";
      text: "Copy code";
    };

type MetaTemplateComponent =
  | {
      type: "BODY";
      text: string;
    }
  | {
      type: "BODY";
      add_security_recommendation: boolean;
    }
  | {
      type: "BUTTONS";
      buttons: MetaTemplateButton[];
    };

type Template = TemplateRecord & {
  rejectedReason?: string;
  metaTemplateId?: string;
  lastSyncedAt?: string;
  createdAt?: string;
};

type MarketingButtonForm = {
  id: string;
  type: Exclude<ButtonKind, "NONE">;
  text: string;
  urlType: UrlKind;
  url: string;
};

const CATEGORY_OPTIONS: Array<{ label: string; value: TemplateCategory }> = [
  { label: "utility", value: "utility" },
  { label: "marketing", value: "marketing" },
  { label: "authentication", value: "authentication" },
];

const STARTER_TEMPLATES = [
  {
    label: "Meta hello_world",
    description: "Quick starter for the free welcome template experience.",
    apply: () => ({
      name: "hello_world",
      language: "en_US",
      category: "utility" as TemplateCategory,
      bodyText: "Hello World",
      includeSecurityRecommendation: true,
      utilityButtonType: "NONE" as ButtonKind,
      utilityUrlType: "static" as UrlKind,
      utilityButtonText: "",
      utilityUrl: "",
      marketingButtons: [createMarketingButton()],
    }),
  },
  {
    label: "Order update",
    description: "Utility message with placeholders for customer name and order id.",
    apply: () => ({
      name: "order_update",
      language: "en_US",
      category: "utility" as TemplateCategory,
      bodyText: "Hi {{1}}, your order {{2}} is ready for dispatch.",
      includeSecurityRecommendation: true,
      utilityButtonType: "QUICK_REPLY" as ButtonKind,
      utilityUrlType: "static" as UrlKind,
      utilityButtonText: "Track order",
      utilityUrl: "",
      marketingButtons: [createMarketingButton()],
    }),
  },
  {
    label: "Offer blast",
    description: "Marketing CTA with placeholders and two buttons.",
    apply: () => ({
      name: "offer_blast",
      language: "en_US",
      category: "marketing" as TemplateCategory,
      bodyText: "Hi {{1}}, unlock {{2}}% off on your next purchase.",
      includeSecurityRecommendation: true,
      utilityButtonType: "NONE" as ButtonKind,
      utilityUrlType: "static" as UrlKind,
      utilityButtonText: "",
      utilityUrl: "",
      marketingButtons: [
        {
          id: nextButtonId(),
          type: "URL" as const,
          text: "Shop now",
          urlType: "static" as const,
          url: "https://example.com/offer",
        },
        {
          id: nextButtonId(),
          type: "QUICK_REPLY" as const,
          text: "Need help?",
          urlType: "static" as const,
          url: "",
        },
      ],
    }),
  },
];

function statusTone(status: TemplateStatus) {
  if (status === "approved") return "good";
  if (status === "rejected" || status === "disabled") return "bad";
  if (status === "pending" || status === "paused") return "warn";
  return "neutral";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function nextButtonId() {
  return Math.random().toString(36).slice(2, 10);
}

function createMarketingButton(): MarketingButtonForm {
  return {
    id: nextButtonId(),
    type: "URL",
    text: "",
    urlType: "static",
    url: "",
  };
}

function clean(value: string) {
  return String(value || "")
    .replace(/["\\]/g, "")
    .trim();
}

function normalizeUrl(value: string) {
  const cleaned = clean(value);
  return cleaned.replace(/\/+$/, "");
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildSingleButton(
  type: ButtonKind,
  text: string,
  urlType: UrlKind,
  url: string
): MetaTemplateButton[] {
  if (type === "NONE") return [];

  if (type === "QUICK_REPLY") {
    const label = clean(text);
    if (!label) throw new Error("Quick reply button text is required");

    return [{ type: "QUICK_REPLY", text: label }];
  }

  const label = clean(text);
  const targetUrl = normalizeUrl(url);

  if (!label) throw new Error("URL button text is required");
  if (!targetUrl) throw new Error("Button URL is required");

  const finalUrl =
    urlType === "dynamic" && !targetUrl.includes("{{1}}")
      ? `${targetUrl}/{{1}}`
      : targetUrl;

  const baseUrlForValidation = finalUrl.replace(/\{\{\d+\}\}/g, "test");
  if (!isValidHttpUrl(baseUrlForValidation)) {
    throw new Error("Please enter a valid http/https URL");
  }

  return [
    {
      type: "URL",
      text: label,
      url: finalUrl,
    },
  ];
}

function buildMarketingButtons(buttons: MarketingButtonForm[]): MetaTemplateButton[] {
  const normalized = buttons.flatMap((button) =>
    button.type === "QUICK_REPLY"
      ? buildSingleButton("QUICK_REPLY", button.text, button.urlType, button.url)
      : buildSingleButton("URL", button.text, button.urlType, button.url)
  );

  if (normalized.length > 2) {
    throw new Error("Marketing templates can have at most 2 buttons");
  }

  return normalized;
}

function buildTemplateComponents(args: {
  category: TemplateCategory;
  includeSecurityRecommendation: boolean;
  bodyText: string;
  utilityButtonType: ButtonKind;
  utilityUrlType: UrlKind;
  utilityButtonText: string;
  utilityUrl: string;
  marketingButtons: MarketingButtonForm[];
}) {
  const {
    category,
    includeSecurityRecommendation,
    bodyText,
    utilityButtonType,
    utilityUrlType,
    utilityButtonText,
    utilityUrl,
    marketingButtons,
  } = args;

  if (category === "authentication") {
    return [
      {
        type: "BODY" as const,
        add_security_recommendation: includeSecurityRecommendation,
      },
      {
        type: "BUTTONS" as const,
        buttons: [
          {
            type: "OTP" as const,
            otp_type: "COPY_CODE" as const,
            text: "Copy code" as const,
          },
        ],
      },
    ];
  }

  const text = clean(bodyText);
  if (!text) {
    throw new Error("Body text is required");
  }

  const components: MetaTemplateComponent[] = [
    {
      type: "BODY",
      text,
    },
  ];

  const buttons =
    category === "utility"
      ? buildSingleButton(utilityButtonType, utilityButtonText, utilityUrlType, utilityUrl)
      : buildMarketingButtons(marketingButtons);

  if (buttons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons,
    });
  }

  return components;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState<TemplateCategory>("utility");
  const [bodyText, setBodyText] = useState("Hi {{1}}, your order {{2}} has been shipped.");
  const [includeSecurityRecommendation, setIncludeSecurityRecommendation] = useState(true);
  const [utilityButtonType, setUtilityButtonType] = useState<ButtonKind>("NONE");
  const [utilityUrlType, setUtilityUrlType] = useState<UrlKind>("static");
  const [utilityButtonText, setUtilityButtonText] = useState("");
  const [utilityUrl, setUtilityUrl] = useState("");
  const [marketingButtons, setMarketingButtons] = useState<MarketingButtonForm[]>([
    createMarketingButton(),
  ]);
  const [creating, setCreating] = useState(false);

  const approvedTemplates = useMemo(
    () => templates.filter((template) => template.status === "approved").length,
    [templates]
  );

  const canCreate = useMemo(() => name.trim().length >= 3, [name]);

  const generatedComponents = useMemo(() => {
    try {
      return buildTemplateComponents({
        category,
        includeSecurityRecommendation,
        bodyText,
        utilityButtonType,
        utilityUrlType,
        utilityButtonText,
        utilityUrl,
        marketingButtons,
      });
    } catch {
      return null;
    }
  }, [
    bodyText,
    category,
    includeSecurityRecommendation,
    marketingButtons,
    utilityButtonText,
    utilityButtonType,
    utilityUrl,
    utilityUrlType,
  ]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await API.templates.list();
      setTemplates(res.templates || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function applyStarter(index: number) {
    const starter = STARTER_TEMPLATES[index].apply();
    setName(starter.name);
    setLanguage(starter.language);
    setCategory(starter.category);
    setBodyText(starter.bodyText);
    setIncludeSecurityRecommendation(starter.includeSecurityRecommendation);
    setUtilityButtonType(starter.utilityButtonType);
    setUtilityUrlType(starter.utilityUrlType);
    setUtilityButtonText(starter.utilityButtonText);
    setUtilityUrl(starter.utilityUrl);
    setMarketingButtons(starter.marketingButtons);
  }

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setCreating(true);

    try {
      const components = buildTemplateComponents({
        category,
        includeSecurityRecommendation,
        bodyText,
        utilityButtonType,
        utilityUrlType,
        utilityButtonText,
        utilityUrl,
        marketingButtons,
      });

      const res = await API.templates.create({
        name: clean(name),
        language: clean(language),
        category,
        components,
      });

      setTemplates((current) => [res.template, ...current]);
      setOk("Template saved locally. Submit it for approval or sync Meta to import `hello_world`.");
      setName("");
      setLanguage("en_US");
      setCategory("utility");
      setBodyText("Hi {{1}}, your order {{2}} has been shipped.");
      setIncludeSecurityRecommendation(true);
      setUtilityButtonType("NONE");
      setUtilityUrlType("static");
      setUtilityButtonText("");
      setUtilityUrl("");
      setMarketingButtons([createMarketingButton()]);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function syncMeta(nameFilter?: string) {
    setSyncingMeta(true);
    setError(null);
    setOk(null);

    try {
      const res = await API.templates.syncMeta(nameFilter ? { name: nameFilter } : {});
      setTemplates((current) => {
        const map = new Map(current.map((template) => [template._id, template]));
        for (const template of res.templates || []) {
          map.set(template._id, template);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || b.lastSyncedAt || 0).getTime() - new Date(a.createdAt || a.lastSyncedAt || 0).getTime()
        );
      });
      setOk(
        nameFilter
          ? `Imported Meta template: ${nameFilter}`
          : `Synced ${res.count || 0} template${res.count === 1 ? "" : "s"} from Meta.`
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Meta sync failed"
      );
    } finally {
      setSyncingMeta(false);
    }
  }

  async function submit(id: string) {
    setBusyId(id);
    setError(null);
    setOk(null);

    try {
      const res = await API.templates.submit(id);
      setTemplates((current) => current.map((t) => (t._id === id ? res.template : t)));
      setOk("Template submitted to Meta.");
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Submit failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function sync(id: string) {
    setBusyId(id);
    setError(null);
    setOk(null);

    try {
      const res = await API.templates.status(id);
      setTemplates((current) => current.map((t) => (t._id === id ? res.template : t)));
      setOk("Template status refreshed from Meta.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Sync failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete template?")) return;

    setBusyId(id);
    setError(null);
    setOk(null);

    try {
      await API.templates.remove(id);
      setTemplates((current) => current.filter((t) => t._id !== id));
      setOk("Template deleted.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function updateMarketingButton(id: string, patch: Partial<MarketingButtonForm>) {
    setMarketingButtons((current) =>
      current.map((button) => (button.id === id ? { ...button, ...patch } : button))
    );
  }

  function addMarketingButton() {
    setMarketingButtons((current) => [...current, createMarketingButton()]);
  }

  function removeMarketingButton(id: string) {
    setMarketingButtons((current) =>
      current.length === 1 ? current : current.filter((button) => button.id !== id)
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[30px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(236,255,248,0.93))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Template operations
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Approve faster, import Meta defaults, and keep send-ready templates organized.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-800/72">
              This workspace now supports local creation, approval submission, status sync, and
              Meta template imports. If your WhatsApp Business account already exposes the free
              `hello_world` template, use the import actions below and it will appear in your
              library immediately.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => syncMeta()} disabled={syncingMeta}>
                {syncingMeta ? "Syncing Meta..." : "Import Meta templates"}
              </Button>
              <Button variant="ghost" onClick={() => syncMeta("hello_world")} disabled={syncingMeta}>
                Import `hello_world`
              </Button>
              <Button variant="ghost" onClick={load} disabled={loading}>
                Refresh library
              </Button>
            </div>
          </div>

          <div className="rounded-[26px] border border-emerald-200 bg-white/78 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-800/55">
              Library status
            </div>
            <div className="mt-3 text-4xl font-black text-ink-900">{templates.length}</div>
            <div className="mt-2 text-sm leading-6 text-ink-800/72">
              {approvedTemplates} template{approvedTemplates === 1 ? "" : "s"} approved and ready
              for sends.
            </div>
            <div className="mt-4 grid gap-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-ink-800">
                Tip: import Meta first, then create only the missing templates your campaigns need.
              </div>
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
                Template library
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                Review approval state and source
              </div>
            </div>
            <Badge tone="neutral">{loading ? "loading" : `${templates.length} total`}</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <Spinner label="Fetching templates..." />
            ) : templates.length ? (
              templates.map((template) => (
                <div
                  key={template._id}
                  className="rounded-[26px] border border-ink-900/8 bg-slate-50/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-black tracking-tight text-ink-900">
                        {template.name}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="neutral">{template.category}</Badge>
                        <Badge tone="neutral">{template.language}</Badge>
                        <Badge tone={template.source === "meta" ? "good" : "neutral"}>
                          {template.source || "local"}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-1 text-xs text-ink-800/56 sm:grid-cols-2">
                        <div>Meta ID: {template.metaTemplateId || "-"}</div>
                        <div>Last sync: {formatDate(template.lastSyncedAt)}</div>
                      </div>
                      {template.rejectedReason ? (
                        <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-200">
                          Rejected: {template.rejectedReason}
                        </div>
                      ) : null}
                    </div>

                    <Badge tone={statusTone(template.status)}>{template.status}</Badge>
                  </div>

                  <details className="mt-4 rounded-2xl border border-ink-900/8 bg-white/78 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-ink-800/82">
                      Preview Meta JSON
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-800">
                      {JSON.stringify(template.components, null, 2)}
                    </pre>
                  </details>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => submit(template._id)}
                      disabled={busyId === template._id || template.source === "meta"}
                    >
                      {template.source === "meta" ? "Managed in Meta" : "Submit for approval"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sync(template._id)}
                      disabled={busyId === template._id}
                    >
                      Sync status
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(template._id)}
                      disabled={busyId === template._id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-900/12 bg-slate-50/80 p-6 text-sm text-ink-800/70">
                No templates yet. Import Meta templates or create one from the builder on the right.
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Starter presets
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Build quicker
            </div>
            <div className="mt-4 grid gap-3">
              {STARTER_TEMPLATES.map((starter, index) => (
                <button
                  key={starter.label}
                  type="button"
                  className="rounded-[22px] border border-ink-900/8 bg-slate-50/80 px-4 py-4 text-left transition hover:bg-white"
                  onClick={() => applyStarter(index)}
                >
                  <div className="text-sm font-black text-ink-900">{starter.label}</div>
                  <div className="mt-2 text-sm leading-6 text-ink-800/70">{starter.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Create locally
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Template builder
            </div>
            <div className="mt-2 text-sm text-ink-800/72">
              Use this when the template does not already exist inside Meta.
            </div>

            <form className="mt-5 grid gap-4" onSubmit={createTemplate}>
              <Input
                label="Template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="hello_world"
                hint="Lowercase, numbers, underscore."
                required
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {category === "authentication" ? (
                <div className="grid gap-3 rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
                  <div className="text-sm font-semibold text-amber-900">Authentication template</div>
                  <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 text-sm text-ink-900 ring-1 ring-ink-900/10">
                    <input
                      type="checkbox"
                      checked={includeSecurityRecommendation}
                      onChange={(e) => setIncludeSecurityRecommendation(e.target.checked)}
                    />
                    Include security recommendation
                  </label>
                  <Input label="Button type" value="COPY_CODE" disabled />
                </div>
              ) : null}

              {category === "utility" ? (
                <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <Textarea
                    label="Body text"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Hi {{1}}, your order {{2}} has been shipped."
                  />
                  <Select
                    label="Button type"
                    value={utilityButtonType}
                    onChange={(e) => setUtilityButtonType(e.target.value as ButtonKind)}
                  >
                    <option value="NONE">None</option>
                    <option value="URL">URL</option>
                    <option value="QUICK_REPLY">Quick Reply</option>
                  </Select>

                  {utilityButtonType === "URL" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select
                        label="URL type"
                        value={utilityUrlType}
                        onChange={(e) => setUtilityUrlType(e.target.value as UrlKind)}
                      >
                        <option value="static">Static</option>
                        <option value="dynamic">Dynamic</option>
                      </Select>
                      <Input
                        label="Button text"
                        value={utilityButtonText}
                        onChange={(e) => setUtilityButtonText(e.target.value)}
                        placeholder="Verify account"
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Button URL"
                          value={utilityUrl}
                          onChange={(e) => setUtilityUrl(e.target.value)}
                          placeholder="https://example.com/verify"
                          hint={
                            utilityUrlType === "dynamic"
                              ? "If {{1}} is missing, it will be appended automatically."
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {utilityButtonType === "QUICK_REPLY" ? (
                    <Input
                      label="Button text"
                      value={utilityButtonText}
                      onChange={(e) => setUtilityButtonText(e.target.value)}
                      placeholder="Track order"
                    />
                  ) : null}
                </div>
              ) : null}

              {category === "marketing" ? (
                <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <Textarea
                    label="Body text"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Hi {{1}}, get {{2}}% off this week."
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-ink-900">CTA buttons</div>
                    <Button type="button" size="sm" variant="ghost" onClick={addMarketingButton}>
                      Add button
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {marketingButtons.map((button, index) => (
                      <div
                        key={button.id}
                        className="rounded-[24px] bg-white/84 p-4 ring-1 ring-ink-900/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-ink-900">Button {index + 1}</div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMarketingButton(button.id)}
                            disabled={marketingButtons.length === 1}
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <Select
                            label="CTA type"
                            value={button.type}
                            onChange={(e) =>
                              updateMarketingButton(button.id, {
                                type: e.target.value as MarketingButtonForm["type"],
                              })
                            }
                          >
                            <option value="URL">URL</option>
                            <option value="QUICK_REPLY">Quick Reply</option>
                          </Select>

                          <Input
                            label="Button text"
                            value={button.text}
                            onChange={(e) =>
                              updateMarketingButton(button.id, { text: e.target.value })
                            }
                            placeholder="Shop now"
                          />

                          {button.type === "URL" ? (
                            <>
                              <Select
                                label="URL type"
                                value={button.urlType}
                                onChange={(e) =>
                                  updateMarketingButton(button.id, {
                                    urlType: e.target.value as UrlKind,
                                  })
                                }
                              >
                                <option value="static">Static</option>
                                <option value="dynamic">Dynamic</option>
                              </Select>
                              <Input
                                label="Button URL"
                                value={button.url}
                                onChange={(e) =>
                                  updateMarketingButton(button.id, { url: e.target.value })
                                }
                                placeholder="https://example.com/offer"
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <details className="rounded-[24px] border border-ink-900/8 bg-slate-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-800/82">
                  Preview final Meta JSON
                </summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-800">
                  {generatedComponents
                    ? JSON.stringify(
                        {
                          name: clean(name),
                          language: clean(language),
                          category,
                          components: generatedComponents,
                        },
                        null,
                        2
                      )
                    : "Complete the required fields to preview the final Meta structure."}
                </pre>
              </details>

              <Button type="submit" disabled={!canCreate || creating}>
                {creating ? "Creating..." : "Create local template"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
