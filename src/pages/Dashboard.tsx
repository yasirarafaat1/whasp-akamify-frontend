import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Circle, ArrowRight, Wallet, 
  UserCircle, Phone, Edit2, RefreshCw 
} from "lucide-react";

const EMPTY_OVERVIEW = { sent: 0, delivered: 0, read: 0, failed: 0, clicks: 0 };
const formatCurrency = (v: number, c = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency: c }).format(v || 0);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setBusy(true);
    try {
      // In a real app, Promise.allSettled is better (as in your original code)
      // Keeping it simple for the UI demo
      const results = await Promise.allSettled([
        API.analytics.overview(),
        API.templates.list(),
        API.contacts.list({ limit: 10 }),
        API.wallet.get(),
        API.meta.status().catch(() => null),
        API.campaigns.list({ limit: 5 }),
      ]);
      
      setSnapshot({
        overview: results[0].status === 'fulfilled' ? results[0].value.overview : EMPTY_OVERVIEW,
        templates: results[1].status === 'fulfilled' ? results[1].value.templates : [],
        contacts: results[2].status === 'fulfilled' ? results[2].value.contacts : [],
        wallet: results[3].status === 'fulfilled' ? results[3].value.wallet : { balance: 0, currency: 'INR' },
        metaStatus: results[4].status === 'fulfilled' ? results[4].value?.status : "disconnected",
        campaigns: results[5].status === 'fulfilled' ? results[5].value.campaigns : [],
      });
    } catch (e) {
      setError("Failed to sync dashboard");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const steps = useMemo(() => [
    { id: 1, label: "Connect Meta Account", done: snapshot?.metaStatus === "active", href: "/app/meta" },
    { id: 2, label: "Create WhatsApp Template", done: snapshot?.templates?.some((t: any) => t.status === 'approved'), href: "/app/templates" },
    { id: 3, label: "Import Your Contacts", done: snapshot?.contacts?.length > 0, href: "/app/contacts" },
    { id: 4, label: "Add Wallet Balance", done: snapshot?.wallet?.balance > 0, href: "/app/settings" },
    { id: 5, label: "Launch First Campaign", done: snapshot?.campaigns?.length > 0, href: "/app/send" },
  ], [snapshot]);

  if (busy && !snapshot) return <div className="flex h-[60vh] items-center justify-center"><Spinner label="Loading dashboard..." /></div>;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

      {error ? <Alert>{error}</Alert> : null}
      
      {/* LEFT CONTENT AREA */}
      <div className="flex-1 space-y-8">
        
        {/* Welcome & Stepper Card (AiSensy Style) */}
        <section className="relative overflow-hidden rounded-[32px] border border-brand-200/50 bg-gradient-to-br from-white to-brand-50/30 p-8 shadow-sm">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
              Good morning, {user?.name || 'Partner'}! 🚀
            </h1>
            <p className="mt-2 text-ink-800/60">Here is what's happening with your WhatsApp marketing today.</p>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-900/40">Setup Progress</h3>
                <span className="text-sm font-bold text-brand-600">{steps.filter(s => s.done).length} / {steps.length} Completed</span>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {steps.map((step) => (
                  <Link key={step.id} to={step.href} className={cn(
                    "group relative flex flex-col p-5 rounded-[24px] border transition-all",
                    step.done ? "bg-white border-brand-200" : "bg-white/50 border-ink-900/5 hover:border-brand-300"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      {step.done ? <CheckCircle2 className="text-brand-600" size={22} /> : <Circle className="text-ink-900/10" size={22} />}
                      <span className="text-[10px] font-bold text-ink-900/20">0{step.id}</span>
                    </div>
                    <div className="text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{step.label}</div>
                    <ArrowRight size={16} className="mt-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-600" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Metrics */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Sent', val: snapshot?.overview?.sent, color: 'text-blue-600' },
            { label: 'Delivered', val: snapshot?.overview?.delivered, color: 'text-emerald-600' },
            { label: 'Read Rate', val: `${Math.round((snapshot?.overview?.read / snapshot?.overview?.sent) * 100 || 0)}%`, color: 'text-purple-600' },
            { label: 'Wallet', val: formatCurrency(snapshot?.wallet?.balance), color: 'text-amber-600' },
          ].map((m) => (
            <Card key={m.label} className="p-5 border-none bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40">{m.label}</div>
              <div className={cn("mt-2 text-2xl font-black", m.color)}>{m.val}</div>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Modules (Inbox & Campaigns) */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Recent Conversations */}
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-ink-900">Recent Chats</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/conversations')}>View All</Button>
            </div>
            <div className="space-y-3">
              {snapshot?.conversations?.slice(0, 5).map((chat: any) => (
                <div key={chat.phone} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-ink-900/5">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                    {chat.contact?.name?.[0] || chat.phone?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink-900 truncate">{chat.contact?.name || chat.phone}</div>
                    <div className="text-xs text-ink-800/50 truncate">{chat.lastMessagePreview}</div>
                  </div>
                  <div className="text-[10px] text-ink-900/30 font-medium">2m ago</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Campaign Health */}
          <Card className="p-6">
             <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-ink-900">Campaign Health</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/send')}>Analytics</Button>
            </div>
            {/* Simple Progress Bar UI */}
            <div className="space-y-6">
              {snapshot?.campaigns?.slice(0, 3).map((camp: any) => (
                <div key={camp._id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{camp.name}</span>
                    <span className="text-brand-600">{Math.round((camp.totals?.sent / camp.totals?.total) * 100 || 0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(camp.totals?.sent / camp.totals?.total) * 100 || 0}%` }}
                      className="h-full bg-brand-500" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* RIGHT STICKY SIDEBAR (Profile & Workspace) */}
      <aside className="w-full lg:w-[340px] space-y-6 lg:sticky lg:top-5">
        
        {/* Profile Card */}
        <Card className="p-6 border-none bg-ink-900 text-black overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <UserCircle size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-400 to-brand-600 p-0.5">
                <div className="h-full w-full rounded-2xl bg-ink-900 flex items-center justify-center font-black text-xl text-white">
                  {user?.name?.[0] || 'U'}
                </div>
              </div>
              <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
                <Edit2 size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold">{user?.name || 'User Name'}</h2>
              <p className="text-sm text-black/50">{user?.email || 'email@example.com'}</p>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="flex items-center gap-3 text-sm text-black/70">
                <Phone size={14} /> <span>+91 {user?.phone || 'Not linked'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-black/70">
                <Wallet size={14} /> <span>{snapshot?.wallet?.currency} {snapshot?.wallet?.balance}</span>
              </div>
            </div>

            <Button variant="ghost" className="w-full mt-8 bg-white/5 border-black/10 hover:border-black/20 hover:bg-white/10 text-black" onClick={() => navigate('/app/settings')}>
              Account Settings
            </Button>
          </div>
        </Card>

        {/* Workspace Card */}
        <Card className="p-6 bg-white border-ink-900/5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40 mb-4">Workspace Details</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-800/60 font-medium">Status</span>
              <Badge tone={snapshot?.metaStatus === "active" ? "good" : snapshot?.metaStatus === "pending" ? "warn" : "bad"}>
                {snapshot?.metaStatus === "active" ? "Active" : snapshot?.metaStatus === "pending" ? "Pending" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-800/60 font-medium">Plan</span>
              <span className="font-bold text-ink-900">SaaS Pro</span>
            </div>
            <div className="pt-4 border-t border-ink-900/5 flex items-center justify-between">
               <button onClick={loadDashboard} className="text-xs font-bold text-brand-600 flex items-center gap-2 hover:underline">
                 <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> Force Sync
               </button>
               <span className="text-[10px] text-ink-900/30 italic">v2.4.1</span>
            </div>
          </div>
        </Card>
      </aside>

    </div>
  );
}

// Helper function for tailwind class merging (ensure you have this utility)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
