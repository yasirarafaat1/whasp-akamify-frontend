import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

type Conversation = {
  _id?: string;
  phone: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  contact?: {
    _id?: string;
    name?: string;
    company?: string;
    tags?: string[];
  } | null;
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function ConversationsPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load(activeSearch = search) {
    setBusy(true);
    try {
      const d = await API.conversations.list({ limit: 120, search: activeSearch || undefined });
      setItems(d.conversations || []);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load conversations");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      load(search);
    }, 15000);

    return () => window.clearInterval(id);
  }, [search]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    await load(search);
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[30px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(236,255,248,0.92))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Inbox
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              View incoming and outgoing WhatsApp conversations like a working chat desk.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-800/72">
              Incoming webhook messages and sent campaign messages now share the same normalized phone
              thread, so the inbox behaves more like WhatsApp Business instead of split message logs.
            </p>
          </div>

          <div className="rounded-[26px] border border-emerald-200 bg-white/78 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-800/55">
              Live threads
            </div>
            <div className="mt-3 text-4xl font-black text-ink-900">{items.length}</div>
            <div className="mt-2 text-sm leading-6 text-ink-800/72">
              Search by phone, contact name, company, or message preview.
            </div>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="flex min-w-0 flex-1 flex-wrap gap-3" onSubmit={onSearch}>
            <div className="min-w-0 w-full flex-1 sm:min-w-[240px]">
              <Input
                label="Search inbox"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Phone, name, company, preview"
              />
            </div>
            <div className="flex w-full items-end gap-2 sm:w-auto">
              <Button type="submit">Search</Button>
              <Button type="button" variant="ghost" onClick={() => load(search)}>
                Refresh
              </Button>
            </div>
          </form>

          <Link to="/app/contacts">
            <Button variant="ghost">Open contacts</Button>
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {busy ? (
            <Spinner label="Loading inbox..." />
          ) : items.length ? (
            items.map((conversation) => (
              <Link
                key={conversation._id || conversation.phone}
                to={`/app/conversations/${encodeURIComponent(conversation.phone)}`}
                className="rounded-[26px] border border-ink-900/8 bg-slate-50/80 p-5 transition hover:border-brand-300/40 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-black tracking-tight text-ink-900">
                      {conversation.contact?.name || conversation.phone}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-800/50">
                      {conversation.phone}
                      {conversation.contact?.company ? ` | ${conversation.contact.company}` : ""}
                    </div>
                    <div className="mt-3 truncate text-sm text-ink-800/74">
                      {conversation.lastMessagePreview || "-"}
                    </div>
                    {conversation.contact?.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {conversation.contact.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    {conversation.unreadCount ? (
                      <Badge tone="good">{conversation.unreadCount} new</Badge>
                    ) : (
                      <Badge tone="neutral">open</Badge>
                    )}
                    <div className="mt-3 text-xs text-ink-800/55">
                      {formatDate(conversation.lastMessageAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-900/12 bg-slate-50/80 p-6 text-sm text-ink-800/70">
              No conversations yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
