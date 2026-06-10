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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const [filters, setFilters] = useState({
    isPaid: undefined,
    isCompleted: undefined,
    q: "",
  });

  const filtersKey = JSON.stringify({
    isPaid: filters.isPaid,
    isCompleted: filters.isCompleted,
    q: filters.q || "",
  });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const [expandedTpId, setExpandedTpId] = useState(null);
  const [tpSessions, setTpSessions] = useState({}); // { [tpId]: sessions[] }
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [editingTpId, setEditingTpId] = useState(null);

  // const [tpDraft, setTpDraft] = useState({ type: "", agreed_total: "" });
  const [tpDraft, setTpDraft] = useState({ type: "", agreed_total: "", is_completed: false });

  const [savingTp, setSavingTp] = useState(false);

  const [editingPaid, setEditingPaid] = useState({ tpId: null, sessionId: null });
  const [paidDraft, setPaidDraft] = useState("");
  const [savingPaid, setSavingPaid] = useState(false);

  const fetchTps = async (overridePage) => {
    setLoading(true);
    try {
      const currentPage = overridePage ?? page;
      const res = await getAllTreatmentPlansForSection({
        ...filters,
        page: currentPage,
        limit: 20,
      });
      setTps(res.data ?? []);
      if (res.pagination) {
        setPagination(res.pagination);
      } else {
        const list = res.data ?? [];
        setPagination({ total: list.length, totalPages: 1, page: 1, limit: 20 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.isPaid, filters.isCompleted, filters.q, page]);

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

  // const startEditTp = (tp) => {
  //   setEditingTpId(tp.id);
  //   setTpDraft({
  //     type: tp.type ?? "",
  //     agreed_total: String(tp.agreed_total ?? ""),
  //   });
  // };

  const startEditTp = (tp) => {
    setEditingTpId(tp.id);
    setTpDraft({
      type: tp.type ?? "",
      agreed_total: String(tp.agreed_total ?? ""),
      is_completed: !!tp.is_completed,
    });
  };


  const cancelEditTp = () => {
    setEditingTpId(null);
    setTpDraft({ type: "", agreed_total: "", is_completed: false });

  };

  const saveEditTp = async (tp) => {
    const payload = {};

    if (tpDraft.type && tpDraft.type !== tp.type) payload.type = tpDraft.type;

    const agreedNum = Number(String(tpDraft.agreed_total).replace(/,/g, "").trim());
    if (String(tpDraft.agreed_total).trim() !== "" && Number.isFinite(agreedNum)) {
      if (agreedNum !== Number(tp.agreed_total)) payload.agreed_total = agreedNum;
    }
    if (tpDraft.is_completed !== !!tp.is_completed) {
      payload.is_completed = tpDraft.is_completed;
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

      page,
      setPage,
      pagination,

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
      page,
      pagination,
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
