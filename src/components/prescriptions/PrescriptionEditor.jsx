import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { suggestPrescriptionField } from "../../api/prescriptionApi";

const EMPTY_ROW = { drug_name: "", dosage: "", frequency: "", duration: "", instructions: "" };

const INPUT_CLS = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]";

/* ---- autocomplete text input (suggests the clinic's own past values) ---- */
function AutoInput({ field, value, onChange, placeholder, disabled }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled || !value || !value.trim()) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await suggestPrescriptionField(field, value.trim());
        setSuggestions((res.data || []).filter((s) => s.toLowerCase() !== value.trim().toLowerCase()));
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [value, field, disabled]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className={INPUT_CLS}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white text-sm shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="cursor-pointer px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Controlled editor — `items` and `onChange` are owned by the parent (the session
// edit modal or the complete-appointment modal). The drug lines travel inside
// THAT form's save payload (no separate prescription API).
//
// UX mirrors the treatment flow: fill the draft row → "Add medicine" → it lands
// in a compact list below where each item can be edited or removed.
export default function PrescriptionEditor({ items = [], onChange, patientName = "", readOnly = false }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ ...EMPTY_ROW });
  const [editingIdx, setEditingIdx] = useState(null); // index being edited, or null = adding new
  const [showForm, setShowForm] = useState(false);    // fields stay hidden until "+ Add medicine"

  const setField = (field, val) => setDraft((d) => ({ ...d, [field]: val }));
  const resetDraft = () => { setDraft({ ...EMPTY_ROW }); setEditingIdx(null); setShowForm(false); };
  const openAdd = () => { setDraft({ ...EMPTY_ROW }); setEditingIdx(null); setShowForm(true); };

  const addOrSave = () => {
    if (!draft.drug_name.trim()) { toast.error(t("rx.enter_drug")); return; }
    const clean = { ...draft, drug_name: draft.drug_name.trim() };
    if (editingIdx === null) onChange([...items, clean]);
    else onChange(items.map((row, i) => (i === editingIdx ? clean : row)));
    resetDraft();
  };

  const editRow = (idx) => { setDraft({ ...EMPTY_ROW, ...items[idx] }); setEditingIdx(idx); setShowForm(true); };
  const removeRow = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
    if (editingIdx === idx) resetDraft();
  };

  const summaryOf = (r) => {
    const parts = [r.dosage, r.frequency, r.duration].filter((x) => x && x.trim());
    let s = parts.join(" · ");
    if (r.instructions && r.instructions.trim()) s += (s ? " · " : "") + r.instructions.trim();
    return s || "—";
  };

  const print = () => {
    const rows = items.filter((r) => r.drug_name && r.drug_name.trim());
    if (rows.length === 0) { toast.error(t("rx.add_one_print")); return; }
    const doctor = localStorage.getItem("name") || "";
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const body = rows.map((r, i) => `
      <tr><td>${i + 1}</td><td><b>${esc(r.drug_name)}</b></td><td>${esc(r.dosage)}</td>
      <td>${esc(r.frequency)}</td><td>${esc(r.duration)}</td><td>${esc(r.instructions)}</td></tr>`).join("");

    const html = `
      <html><head><title>Prescription</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#111}
        h1{color:#015478;margin:0 0 4px}
        .meta{font-size:13px;color:#444;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}
        th{background:#f1f5f9}
        .sign{margin-top:48px;font-size:13px}
      </style></head><body>
        <h1>Crown Dental Clinic</h1>
        <div class="meta">Patient: <b>${esc(patientName)}</b> &nbsp;·&nbsp; Date: ${today}${doctor ? ` &nbsp;·&nbsp; Doctor: ${esc(doctor)}` : ""}</div>
        <table>
          <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        <div class="sign">Doctor's signature: ____________________</div>
        <script>window.onload=function(){window.print();}</script>
      </body></html>`;

    const w = window.open("", "_blank");
    if (!w) { toast.error(t("rx.allow_popups")); return; }
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{t("rx.title")} <span className="text-xs font-normal text-slate-400">{t("rx.optional")}</span></h3>
        <button type="button" onClick={print}
          className="rounded-lg border border-[#015478] px-3 py-1.5 text-xs font-medium text-[#015478] transition hover:bg-[#015478] hover:text-white">
          {t("rx.print")}
        </button>
      </div>

      {/* Added medicines — compact list (always visible) */}
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">{t("rx.no_medicines")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((row, idx) => (
            <div key={idx} className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 ${editingIdx === idx ? "border-[#015478] bg-[#015478]/5" : "border-slate-200 bg-white"}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{idx + 1}. {row.drug_name}</p>
                <p className="truncate text-[12px] text-slate-500">{summaryOf(row)}</p>
              </div>
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => editRow(idx)} title={t("common.edit")}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#015478]">✎</button>
                  <button type="button" onClick={() => removeRow(idx)} title={t("common.delete")}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fields appear only after clicking "+ Add medicine" (or Edit). */}
      {!readOnly && (showForm ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <AutoInput field="drug_name" value={draft.drug_name}
            onChange={(v) => setField("drug_name", v)} placeholder={t("rx.drug_name_ph")} />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <AutoInput field="dosage" value={draft.dosage}
              onChange={(v) => setField("dosage", v)} placeholder={t("rx.dosage_ph")} />
            <AutoInput field="frequency" value={draft.frequency}
              onChange={(v) => setField("frequency", v)} placeholder={t("rx.frequency_ph")} />
            <AutoInput field="duration" value={draft.duration}
              onChange={(v) => setField("duration", v)} placeholder={t("rx.duration_ph")} />
          </div>

          <input type="text" value={draft.instructions}
            onChange={(e) => setField("instructions", e.target.value)} placeholder={t("rx.instructions_ph")}
            className={INPUT_CLS} />

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetDraft}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              {t("common.cancel")}
            </button>
            <button type="button" onClick={addOrSave}
              className="rounded-lg bg-[#015478] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#013d58]">
              {editingIdx === null ? t("rx.add_medicine") : t("rx.save_medicine")}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={openAdd}
          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:border-[#015478] hover:text-[#015478]">
          {t("rx.add_medicine_btn")}
        </button>
      ))}
    </div>
  );
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
