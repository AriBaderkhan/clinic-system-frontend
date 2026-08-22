import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
  const [tpSessions, setTpSessions] = useState({});
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [editingTpId, setEditingTpId] = useState(null);
  const [tpDraft, setTpDraft] = useState({ type: "", agreed_total: "", is_completed: false });
  const [savingTp, setSavingTp] = useState(false);

  const [editingPaid, setEditingPaid] = useState({ tpId: null, sessionId: null });
  const [paidDraft, setPaidDraft] = useState("");
  const [savingPaid, setSavingPaid] = useState(false);

  // Delete-confirmation modal: the plan awaiting confirmation (or null), + busy flag.
  const [deletingTp, setDeletingTp] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const pageLimit = 20;

  const fetchTps = useCallback(async (overridePage) => {
    try {
      setLoading(true);
      const currentPage = overridePage ?? page;
      const res = await getAllTreatmentPlansForSection({
        ...filters,
        page: currentPage,
        limit: pageLimit,
      });
      setTps(res.data ?? []);
      setPagination({
        total: res.total ?? 0,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil((res.total ?? 0) / pageLimit) || 1,
      });
    } finally {
      setLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchTps();
  }, [fetchTps]);

  const refreshTpSessions = useCallback(async (tpId) => {
    const res = await getSessionsForTreatmentPlan(tpId);
    setTpSessions((prev) => ({ ...prev, [tpId]: Array.isArray(res.data) ? res.data : [] }));
  }, []);

  const toggleExpand = useCallback(async (tpId) => {
    if (expandedTpId === tpId) {
      setExpandedTpId(null);
      return;
    }

    setExpandedTpId(tpId);
    if (tpSessions[tpId]) return;

    try {
      setSessionsLoading(true);
      const res = await getSessionsForTreatmentPlan(tpId);
      setTpSessions((prev) => ({ ...prev, [tpId]: Array.isArray(res.data) ? res.data : [] }));
    } finally {
      setSessionsLoading(false);
    }
  }, [expandedTpId, tpSessions]);

  const startEditTp = useCallback((tp) => {
    setEditingTpId(tp.id);
    setTpDraft({
      type: tp.type ?? "",
      agreed_total: String(tp.agreed_total ?? ""),
      is_completed: !!tp.is_completed,
    });
  }, []);

  const cancelEditTp = useCallback(() => {
    setEditingTpId(null);
    setTpDraft({ type: "", agreed_total: "", is_completed: false });
  }, []);

  const saveEditTp = useCallback(async (tp) => {
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

    try {
      setSavingTp(true);
      await editTreatmentPlan(tp.id, payload);
      await fetchTps();
      cancelEditTp();
    } finally {
      setSavingTp(false);
    }
  }, [tpDraft, cancelEditTp, fetchTps]);

  // Step 1: open the confirm modal (pass the whole plan so the modal can show it).
  const handleDeleteTp = useCallback((tp) => {
    setDeletingTp(tp);
  }, []);

  // Step 2: cancel = just close the modal.
  const cancelDeleteTp = useCallback(() => {
    setDeletingTp(null);
  }, []);

  // Step 3: confirm = actually void the plan, then refresh + close.
  const confirmDeleteTp = useCallback(async () => {
    if (!deletingTp) return;
    const tpId = deletingTp.id;
    try {
      setDeletingBusy(true);
      await deleteTreatmentPlan(tpId);
      await fetchTps();

      setExpandedTpId((prev) => (prev === tpId ? null : prev));
      setTpSessions((prev) => {
        const copy = { ...prev };
        delete copy[tpId];
        return copy;
      });
      setDeletingTp(null);
    } catch (err) {
      toast.error(err.userMessage || "Failed to delete");
    } finally {
      setDeletingBusy(false);
    }
  }, [deletingTp, fetchTps]);

  const startEditPaid = useCallback((tpId, sessionId, currentPaid) => {
    setEditingPaid({ tpId, sessionId });
    setPaidDraft(String(currentPaid ?? 0));
  }, []);

  const cancelEditPaid = useCallback(() => {
    setEditingPaid({ tpId: null, sessionId: null });
    setPaidDraft("");
  }, []);

  const saveEditPaid = useCallback(async () => {
    const { tpId, sessionId } = editingPaid;
    if (!tpId || !sessionId) return;

    const amount = Number(String(paidDraft).replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount < 0) return;

    try {
      setSavingPaid(true);
      await updatePaidForTpSession(tpId, sessionId, amount);
      await refreshTpSessions(tpId);
      await fetchTps();
      cancelEditPaid();
    } finally {
      setSavingPaid(false);
    }
  }, [editingPaid, paidDraft, refreshTpSessions, fetchTps, cancelEditPaid]);

  const api = useMemo(
    () => ({
      tps, loading, filters, setFilters,
      page, setPage, pagination,
      expandedTpId, toggleExpand, tpSessions, sessionsLoading,
      editingTpId, startEditTp, cancelEditTp, saveEditTp, tpDraft, setTpDraft, savingTp,
      handleDeleteTp, deletingTp, deletingBusy, cancelDeleteTp, confirmDeleteTp,
      editingPaid, startEditPaid, cancelEditPaid, saveEditPaid, paidDraft, setPaidDraft, savingPaid,
    }),
    [
      tps, loading, filters, page, pagination,
      expandedTpId, tpSessions, sessionsLoading,
      editingTpId, tpDraft, savingTp,
      editingPaid, paidDraft, savingPaid,
      toggleExpand, startEditTp, cancelEditTp, saveEditTp, handleDeleteTp,
      deletingTp, deletingBusy, cancelDeleteTp, confirmDeleteTp,
      startEditPaid, cancelEditPaid, saveEditPaid,
    ]
  );

  return api;
}