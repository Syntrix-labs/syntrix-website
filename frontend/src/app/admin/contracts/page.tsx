"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { apiGet, apiPath, authHeaders } from "@/lib/api";

type ContractType = "client" | "member-contractor" | "member-employee";

type Contract = {
  _id: string;
  type: ContractType;
  title: string;
  partyName: string;
  partyEmail?: string;
  status: "Draft" | "Sent" | "Signed";
  emailed: boolean;
  fileName?: string;
  createdAt: string;
  details?: { role?: string; fee?: number; currency?: string };
};

type Person = { _id: string; name: string; email?: string };

const TYPE_LABELS: Record<ContractType, string> = {
  client: "Client — Services Agreement",
  "member-contractor": "Member — Independent Contractor",
  "member-employee": "Member — Employment",
};

const inputCls =
  "rounded-2xl border border-emerald-200/15 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-50/85 outline-none transition placeholder:text-emerald-50/30 focus:border-emerald-400/60";
const labelCls = "mb-1.5 block text-xs uppercase tracking-wider text-emerald-50/45";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Person[]>([]);
  const [team, setTeam] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // form state
  const [type, setType] = useState<ContractType>("client");
  const [partyId, setPartyId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [scope, setScope] = useState("");
  const [fee, setFee] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [timeline, setTimeline] = useState("");
  const [probation, setProbation] = useState("");
  const [notice, setNotice] = useState("");
  const [compType, setCompType] = useState<"salary" | "share" | "both">("salary");
  const [share, setShare] = useState("");
  const [shareBasis, setShareBasis] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [lastContract, setLastContract] = useState<Contract | null>(null);

  const isClient = type === "client";
  const isEmployee = type === "member-employee";
  const showShare = !isClient && (compType === "share" || compType === "both");
  const showCash = isClient || compType !== "share";

  const load = () => apiGet<Contract[]>("/api/contracts", []).then(setContracts);
  useEffect(() => {
    load();
    apiGet<Person[]>("/api/admin/clients", []).then((rows) =>
      setClients(rows.map((r) => ({ _id: r._id, name: r.name, email: r.email })))
    );
    apiGet<(Person & { isAdmin?: boolean })[]>("/api/team", []).then((rows) =>
      setTeam(rows.filter((r) => !r.isAdmin && r.email).map((r) => ({ _id: r._id, name: r.name, email: r.email })))
    );
  }, []);

  const people = useMemo(() => (isClient ? clients : team), [isClient, clients, team]);

  const pickPerson = (id: string) => {
    setPartyId(id);
    const p = people.find((x) => x._id === id);
    if (p) {
      setName(p.name || "");
      setEmail(p.email || "");
    }
  };

  const reset = () => {
    setPartyId(""); setName(""); setEmail(""); setRole(""); setScope("");
    setFee(""); setPaymentTerms(""); setTimeline(""); setProbation(""); setNotice("");
    setShare(""); setShareBasis("");
  };

  const generate = async () => {
    if (!name.trim()) { setMsg("Add a name (or pick a person)."); return; }
    setBusy(true);
    setMsg("");
    setLastContract(null);
    try {
      const res = await fetch(apiPath("/api/contracts/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          type, partyId: partyId || undefined, name, email,
          role, scope, fee, currency, paymentTerms, timeline, probation, notice,
          compType: isClient ? undefined : compType,
          share: showShare ? share : undefined,
          shareBasis: showShare ? shareBasis : undefined,
          sendEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMsg(
          data.emailed
            ? `Contract generated & emailed to ${email} ✉️`
            : sendEmail && email
            ? "Contract generated. (Email not configured, so it wasn't sent.)"
            : "Contract generated."
        );
        setLastContract(data.contract);
        reset();
        load();
      } else {
        setMsg(data.message || "Could not generate the contract.");
      }
    } catch {
      setMsg("Could not generate the contract. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const download = async (c: Contract) => {
    const res = await fetch(apiPath(`/api/contracts/${c._id}/download`), { headers: authHeaders() });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = c.fileName || `${c.type}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setStatus = async (id: string, status: string) => {
    setContracts((prev) => prev.map((c) => (c._id === id ? { ...c, status: status as Contract["status"] } : c)));
    await fetch(apiPath(`/api/contracts/${id}/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
  };

  const remove = async (id: string) => {
    setContracts((prev) => prev.filter((c) => c._id !== id));
    await fetch(apiPath(`/api/contracts/${id}`), { method: "DELETE", headers: authHeaders() });
  };

  const statusStyle: Record<string, string> = {
    Draft: "bg-emerald-500/10 text-emerald-300",
    Sent: "bg-sky-500/10 text-sky-300",
    Signed: "bg-amber-400/10 text-amber-200",
  };

  return (
    <DashboardShell type="admin">
      <SectionHeader
        icon="file-certificate"
        eyebrow="Contracts"
        title="Contract generator"
        description="Generate a legal agreement for a client or team member. The PDF is stored and can be emailed automatically."
      />

      <div className="mb-8 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-6 backdrop-blur-sm">
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-100/70">
          <i className="ti ti-file-plus" aria-hidden /> New contract
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Contract type</label>
            <select value={type} onChange={(e) => { setType(e.target.value as ContractType); reset(); }} className={`${inputCls} w-full`}>
              {(Object.keys(TYPE_LABELS) as ContractType[]).map((t) => (
                <option key={t} value={t} className="bg-emerald-950">{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>{isClient ? "Pick a client" : "Pick a team member"} (optional)</label>
            <select value={partyId} onChange={(e) => pickPerson(e.target.value)} className={`${inputCls} w-full`}>
              <option value="" className="bg-emerald-950">— Type details manually —</option>
              {people.map((p) => (
                <option key={p._id} value={p._id} className="bg-emerald-950">{p.name}{p.email ? ` · ${p.email}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>{isClient ? "Client name / company" : "Member name"}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={isClient ? "Acme Pvt Ltd" : "Full name"} className={`${inputCls} w-full`} />
          </div>

          <div>
            <label className={labelCls}>Email {sendEmail && "(receives the PDF)"}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" className={`${inputCls} w-full`} />
          </div>

          {!isClient && (
            <div>
              <label className={labelCls}>Role / position</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className={`${inputCls} w-full`} />
            </div>
          )}

          {isClient && (
            <div className="md:col-span-2">
              <label className={labelCls}>Scope of work</label>
              <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={2} placeholder="e.g. design and development of a marketing website with CMS" className={`${inputCls} w-full resize-none`} />
            </div>
          )}

          {!isClient && (
            <div className="md:col-span-2">
              <label className={labelCls}>Compensation type</label>
              <div className="flex gap-2">
                {([
                  { v: "salary", label: isEmployee ? "Salary / month" : "Fixed / month" },
                  { v: "share", label: "Share / deal" },
                  { v: "both", label: "Salary + share" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setCompType(opt.v)}
                    className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm transition ${compType === opt.v ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : "border-emerald-200/15 bg-emerald-950/50 text-emerald-50/55 hover:border-emerald-300/30"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCash && (
            <div>
              <label className={labelCls}>{isClient ? "Total fee" : isEmployee ? "Monthly salary" : "Fixed monthly amount"}</label>
              <div className="flex gap-2">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                  <option className="bg-emerald-950">INR</option>
                  <option className="bg-emerald-950">USD</option>
                  <option className="bg-emerald-950">EUR</option>
                </select>
                <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" placeholder="90000" className={`${inputCls} w-full`} />
              </div>
            </div>
          )}

          {showCash && (
            <div>
              <label className={labelCls}>Payment terms</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder={isClient ? "50% upfront, 50% on delivery" : "per month"} className={`${inputCls} w-full`} />
            </div>
          )}

          {showShare && (
            <div>
              <label className={labelCls}>Share per deal</label>
              <input value={share} onChange={(e) => setShare(e.target.value)} placeholder="e.g. 20% of each deal's value" className={`${inputCls} w-full`} />
            </div>
          )}

          {showShare && (
            <div>
              <label className={labelCls}>Share basis (optional)</label>
              <input value={shareBasis} onChange={(e) => setShareBasis(e.target.value)} placeholder="e.g. net amount the company receives, paid when the client pays" className={`${inputCls} w-full`} />
            </div>
          )}

          {!isEmployee && (
            <div className={isClient ? "md:col-span-2" : ""}>
              <label className={labelCls}>{isClient ? "Timeline" : "Engagement term"}</label>
              <input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder={isClient ? "e.g. 6 weeks from kickoff" : "e.g. 6 months, renewable"} className={`${inputCls} w-full`} />
            </div>
          )}

          {isEmployee && (
            <>
              <div>
                <label className={labelCls}>Probation period</label>
                <input value={probation} onChange={(e) => setProbation(e.target.value)} placeholder="3 months" className={`${inputCls} w-full`} />
              </div>
              <div>
                <label className={labelCls}>Notice period</label>
                <input value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="30 days" className={`${inputCls} w-full`} />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-emerald-50/70">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-emerald-500" />
            Email the PDF to the counterparty
          </label>
          <button onClick={generate} disabled={busy} className="ml-auto rounded-2xl bg-emerald-500/90 px-6 py-3 font-medium tracking-wide text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60">
            {busy ? "Generating…" : "Generate contract"}
          </button>
        </div>
        {msg && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-emerald-200">{msg}</p>
            {lastContract && (
              <button onClick={() => download(lastContract)} className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20">
                <i className="ti ti-download" aria-hidden /> Download PDF
              </button>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-emerald-50/40">
          Blank fields fall back to sensible defaults inside the template. Generated documents are templates and should be reviewed by a qualified lawyer before signing.
        </p>
      </div>

      <p className="mb-3 text-sm text-emerald-100/70">Generated contracts</p>
      <div className="grid grid-cols-1 gap-4">
        {contracts.length === 0 && (
          <p className="rounded-3xl border border-emerald-200/10 bg-emerald-950/20 p-6 text-sm text-emerald-50/45">No contracts yet. Generate your first one above.</p>
        )}
        {contracts.map((c, i) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-5 backdrop-blur-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
              <i className="ti ti-file-text text-xl" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-light tracking-wide">{c.partyName}</h2>
              <p className="truncate text-xs text-emerald-50/45">{c.title}{c.partyEmail ? ` · ${c.partyEmail}` : ""}</p>
            </div>
            <span className={`ml-auto h-fit rounded-full px-3 py-1.5 text-xs ${statusStyle[c.status]}`}>{c.status}{c.emailed ? " · sent" : ""}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => download(c)} title="Download PDF" className="rounded-xl border border-emerald-200/15 px-3 py-2 text-sm text-emerald-100/80 transition hover:border-emerald-300/40">
                <i className="ti ti-download" aria-hidden /> PDF
              </button>
              {c.status !== "Signed" && (
                <button onClick={() => setStatus(c._id, "Signed")} title="Mark as signed" className="rounded-xl border border-emerald-200/15 px-3 py-2 text-sm text-emerald-100/80 transition hover:border-amber-300/40">
                  <i className="ti ti-writing-sign" aria-hidden />
                </button>
              )}
              <button onClick={() => remove(c._id)} aria-label="Delete contract" className="rounded-xl border border-emerald-200/15 px-3 py-2 text-emerald-50/30 transition hover:border-red-400/40 hover:text-red-300">
                <i className="ti ti-trash" aria-hidden />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
