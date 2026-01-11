// src/hooks/useTreatmentPlansSection.js
import { useEffect, useMemo, useState } from "react";
import {
  deleteTreatmentPlan,
  editTreatmentPlan,
  getAllTreatmentPlansForSection,
  getSessionsForTreatmentPlan,
  updatePaidForTpSession,
} from "../api/treatmentPlanApi";

export default function useTreatmentPlansSection() {
  const [tps, setTps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    isPaid: undefined,      // true | false | undefined
    isCompleted: undefined, // true | false | undefined
    q: "",
  });

  const [expandedTpId, setExpandedTpId] = useState(null);
  const [tpSessions, setTpSessions] = useState({}); // { [tpId]: sessions[] }
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [editingTpId, setEditingTpId] = useState(null);
  const [tpDraft, setTpDraft] = useState({ type: "", agreed_total: "" });
  const [savingTp, setSavingTp] = useState(false);

  const [editingPaid, setEditingPaid] = useState({ tpId: null, sessionId: null });
  const [paidDraft, setPaidDraft] = useState("");
  const [savingPaid, setSavingPaid] = useState(false);

  const fetchTps = async () => {
    setLoading(true);
    try {
      const data = await getAllTreatmentPlansForSection(filters);
      setTps(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.isPaid, filters.isCompleted, filters.q]);

  const refreshTpSessions = async (tpId) => {
    const sessions = await getSessionsForTreatmentPlan(tpId);
    setTpSessions((prev) => ({ ...prev, [tpId]: sessions }));
  };

  const toggleExpand = async (tpId) => {
    if (expandedTpId === tpId) {
      setExpandedTpId(null);
      return;
    }

    setExpandedTpId(tpId);

    if (tpSessions[tpId]) return;

    setSessionsLoading(true);
    try {
      const sessions = await getSessionsForTreatmentPlan(tpId);
      setTpSessions((prev) => ({ ...prev, [tpId]: sessions }));
    } finally {
      setSessionsLoading(false);
    }
  };

  const startEditTp = (tp) => {
    setEditingTpId(tp.id);
    setTpDraft({
      type: tp.type ?? "",
      agreed_total: String(tp.agreed_total ?? ""),
    });
  };

  const cancelEditTp = () => {
    setEditingTpId(null);
    setTpDraft({ type: "", agreed_total: "" });
  };

  const saveEditTp = async (tp) => {
    const payload = {};

    if (tpDraft.type && tpDraft.type !== tp.type) payload.type = tpDraft.type;

    const agreedNum = Number(String(tpDraft.agreed_total).replace(/,/g, "").trim());
    if (String(tpDraft.agreed_total).trim() !== "" && Number.isFinite(agreedNum)) {
      if (agreedNum !== Number(tp.agreed_total)) payload.agreed_total = agreedNum;
    }

    if (Object.keys(payload).length === 0) {
      cancelEditTp();
      return;
    }

    setSavingTp(true);
    try {
      await editTreatmentPlan(tp.id, payload);
      await fetchTps();
      cancelEditTp();
    } finally {
      setSavingTp(false);
    }
  };

  const handleDeleteTp = async (tpId) => {
    const ok = window.confirm("Delete this treatment plan?");
    if (!ok) return;

    await deleteTreatmentPlan(tpId);
    await fetchTps();

    setExpandedTpId((prev) => (prev === tpId ? null : prev));
    setTpSessions((prev) => {
      const copy = { ...prev };
      delete copy[tpId];
      return copy;
    });
  };

  const startEditPaid = (tpId, sessionId, currentPaid) => {
    setEditingPaid({ tpId, sessionId });
    setPaidDraft(String(currentPaid ?? 0));
  };

  const cancelEditPaid = () => {
    setEditingPaid({ tpId: null, sessionId: null });
    setPaidDraft("");
  };

  const saveEditPaid = async () => {
    const { tpId, sessionId } = editingPaid;
    if (!tpId || !sessionId) return;

    const amount = Number(String(paidDraft).replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount < 0) return;

    setSavingPaid(true);
    try {
      await updatePaidForTpSession(tpId, sessionId, amount);

      // refresh both
      await refreshTpSessions(tpId);
      await fetchTps();

      cancelEditPaid();
    } finally {
      setSavingPaid(false);
    }
  };

  const api = useMemo(
    () => ({
      tps,
      loading,
      filters,
      setFilters,

      expandedTpId,
      toggleExpand,
      tpSessions,
      sessionsLoading,

      editingTpId,
      startEditTp,
      cancelEditTp,
      saveEditTp,
      tpDraft,
      setTpDraft,
      savingTp,

      handleDeleteTp,

      editingPaid,
      startEditPaid,
      cancelEditPaid,
      saveEditPaid,
      paidDraft,
      setPaidDraft,
      savingPaid,
    }),
    [
      tps,
      loading,
      filters,
      expandedTpId,
      tpSessions,
      sessionsLoading,
      editingTpId,
      tpDraft,
      savingTp,
      editingPaid,
      paidDraft,
      savingPaid,
    ]
  );

  return api;
}
