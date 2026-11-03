import { useMemo } from "react";

function getPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
}
import { useTranslation } from "react-i18next";
import useTreatmentPlansSection from "../../hooks/useTreatmentPlansSection";
import { useSettings } from "../../context/SettingContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";

export default function TreatmentPlanPage() {
    const { t } = useTranslation();
    const { formatDateTime, formatMoney } = useSettings();
    const {
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
        deletingTp,
        deletingBusy,
        cancelDeleteTp,
        confirmDeleteTp,

        editingPaid,
        startEditPaid,
        cancelEditPaid,
        saveEditPaid,
        paidDraft,
        setPaidDraft,
        savingPaid,
    } = useTreatmentPlansSection();

    const handlePageChange = (newPage) => {
        setPage(newPage);
        const el = document.getElementById("main-scroll");
        if (el) el.scrollTop = 0;
    };

    const pageNumbers = getPageNumbers(page, pagination.totalPages);
    const showPagination = pagination.totalPages > 1;
    const rowStart = (page - 1) * pagination.limit + 1;
    const rowEnd = Math.min(page * pagination.limit, pagination.total);

    const typeButtons = useMemo(() => ["All", "ortho", "implant", "rct", "re_rct"], []);

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <PageHeader title={t("tp.title")} subtitle={t("tp.subtitle")} />

            {/* Filter bar */}
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">

                {/* Search */}
                <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-72">
                    <label className="text-sm font-medium text-slate-700">{t("tp.search")}</label>
                    <input
                        placeholder={t("tp.search_ph")}
                        value={filters.q}
                        onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                    />
                </div>

                {/* Pay status */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">{t("tp.pay_status")}</label>
                    <select
                        value={filters.isPaid === undefined ? "" : filters.isPaid ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setFilters((prev) => ({ ...prev, isPaid: v === "" ? undefined : v === "true" }));
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                    >
                        <option value="">{t("tp.all")}</option>
                        <option value="true">{t("tp.paid")}</option>
                        <option value="false">{t("tp.not_paid")}</option>
                    </select>
                </div>

                {/* Complete status */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">{t("tp.complete_status")}</label>
                    <select
                        value={filters.isCompleted === undefined ? "" : filters.isCompleted ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setFilters((prev) => ({ ...prev, isCompleted: v === "" ? undefined : v === "true" }));
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                    >
                        <option value="">{t("tp.all")}</option>
                        <option value="true">{t("tp.completed")}</option>
                        <option value="false">{t("tp.not_completed")}</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setFilters({ isPaid: undefined, isCompleted: undefined, q: "" })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        {t("tp.clear")}
                    </button>
                </div>
            </div>

            {/* Count info */}
            <p className="-mt-2 text-xs text-slate-500">
                {loading
                    ? t("tp.loading_plans")
                    : t("appt.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
            </p>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                {loading ? (
                    <p className="py-10 text-center text-sm text-slate-500">{t("tp.loading")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3 text-start">{t("tp.col_patient")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_type")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_agreed")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_paid")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_remaining")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_pay_status")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_complete_status")}</th>
                                    <th className="px-4 py-3 text-start">{t("tp.col_created")}</th>
                                    <th className="px-4 py-3 text-end">{t("tp.col_actions")}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tps.map((tp) => {
                                    const isExpanded = expandedTpId === tp.id;
                                    const sessions = tpSessions[tp.id] || [];
                                    const isPaid = Number(tp.total_paid) >= Number(tp.agreed_total);
                                    const isEditing = editingTpId === tp.id;

                                    return (
                                        <>
                                            <tr
                                                key={tp.id}
                                                className={`border-t border-slate-100 ${isEditing ? "bg-brand/10" : "hover:bg-slate-50"}`}
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-900">{tp.patient_name}</td>

                                                {/* TYPE */}
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <select
                                                            value={tpDraft.type}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, type: e.target.value }))}
                                                            disabled={savingTp}
                                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                                        >
                                                            <option value="">{t("tp.select_dots")}</option>
                                                            {typeButtons.filter((x) => x !== "All").map((ty) => (
                                                                <option key={ty} value={ty}>{ty.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="font-medium text-slate-700">{String(tp.type || "").toUpperCase()}</span>
                                                    )}
                                                </td>

                                                {/* AGREED */}
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            value={tpDraft.agreed_total}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, agreed_total: e.target.value }))}
                                                            disabled={savingTp}
                                                            className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                                        />
                                                    ) : (
                                                        <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(tp.agreed_total, tp.currency_code)}</span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(tp.total_paid, tp.currency_code)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(tp.remaining, tp.currency_code)}</td>

                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
                                                        {isPaid ? t("tp.paid") : t("tp.due")}
                                                    </span>
                                                </td>

                                                {/* COMPLETE STATUS */}
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <select
                                                            value={tpDraft.is_completed ? "done" : "undone"}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, is_completed: e.target.value === "done" }))}
                                                            disabled={savingTp}
                                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                                        >
                                                            <option value="done">{t("tp.done")}</option>
                                                            <option value="undone">{t("tp.undone")}</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tp.is_completed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
                                                            {tp.is_completed ? t("tp.done") : t("tp.undone")}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(tp.created_at)}</td>

                                                {/* ACTIONS */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(tp.id)}
                                                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                                                        >
                                                            {isExpanded ? t("tp.hide") : t("tp.sessions_btn")}
                                                        </button>

                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => saveEditTp(tp)}
                                                                    disabled={savingTp}
                                                                    className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                                                >
                                                                    {savingTp ? t("tp.saving") : t("tp.save")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEditTp}
                                                                    disabled={savingTp}
                                                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                                                >
                                                                    {t("common.cancel")}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditTp(tp)}
                                                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                                >
                                                                    {t("common.edit")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTp(tp)}
                                                                    className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                                >
                                                                    {t("common.delete")}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* EXPANDED SESSIONS */}
                                            {isExpanded && (
                                                <tr key={`${tp.id}-sessions`}>
                                                    <td colSpan={9} className="bg-slate-50 px-4 py-3">
                                                        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                                                            <p className="mb-3 text-sm font-semibold text-slate-900">{t("tp.sessions_for_plan")}</p>

                                                            {sessionsLoading && !tpSessions[tp.id] ? (
                                                                <p className="py-6 text-center text-sm text-slate-500">{t("tp.loading_sessions")}</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-start text-sm">
                                                                        <thead className="bg-slate-50">
                                                                            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                                <th className="px-4 py-3 text-start">{t("tp.col_finished")}</th>
                                                                                <th className="px-4 py-3 text-start">{t("tp.col_paid_session")}</th>
                                                                                <th className="px-4 py-3 text-start">{t("tp.col_payment_note")}</th>
                                                                                <th className="px-4 py-3 text-start">{t("tp.col_next_plan")}</th>
                                                                                <th className="px-4 py-3 text-start">{t("tp.col_notes")}</th>
                                                                                <th className="px-4 py-3 text-end">{t("tp.col_action")}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {sessions.length === 0 && (
                                                                                <tr>
                                                                                    <td colSpan={6} className="px-3 py-2 text-slate-500">{t("tp.no_sessions")}</td>
                                                                                </tr>
                                                                            )}
                                                                            {sessions.map((s) => {
                                                                                const isEditingThis =
                                                                                    editingPaid.tpId === tp.id &&
                                                                                    editingPaid.sessionId === s.session_id;
                                                                                const paidValue = s.paid_for_this_plan_in_this_session ?? 0;

                                                                                return (
                                                                                    <tr
                                                                                        key={s.session_id}
                                                                                        className={`border-t border-slate-100 ${isEditingThis ? "bg-brand/10" : "hover:bg-slate-50"}`}
                                                                                    >
                                                                                        <td className="px-4 py-3 text-slate-700">{formatDateTime(s.finished_at)}</td>

                                                                                        <td className="px-4 py-3">
                                                                                            {isEditingThis ? (
                                                                                                <input
                                                                                                    value={paidDraft}
                                                                                                    onChange={(e) => setPaidDraft(e.target.value)}
                                                                                                    disabled={savingPaid}
                                                                                                    className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                                                                                />
                                                                                            ) : (
                                                                                                <span className="font-medium text-slate-800">{formatMoney(paidValue, tp.currency_code)}</span>
                                                                                            )}
                                                                                        </td>

                                                                                        <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                                                                                            {s.payment_note ? (
                                                                                                <span className="block truncate" title={s.payment_note}>{s.payment_note}</span>
                                                                                            ) : (
                                                                                                <span className="text-slate-300">—</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-slate-700">{s.next_plan || "-"}</td>
                                                                                        <td className="px-4 py-3 text-slate-700">{s.notes || "-"}</td>

                                                                                        <td className="px-4 py-3">
                                                                                            <div className="flex items-center justify-end gap-2">
                                                                                                {isEditingThis ? (
                                                                                                    <>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={saveEditPaid}
                                                                                                            disabled={savingPaid}
                                                                                                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                                                                                        >
                                                                                                            {savingPaid ? t("tp.saving") : t("tp.save")}
                                                                                                        </button>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={cancelEditPaid}
                                                                                                            disabled={savingPaid}
                                                                                                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                                                                                        >
                                                                                                            {t("common.cancel")}
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => startEditPaid(tp.id, s.session_id, paidValue)}
                                                                                                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                                                                    >
                                                                                                        {t("common.edit")}
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}

                                {tps.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                                            {t("tp.no_plans")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination bar */}
                {showPagination && (
                    <div className="flex flex-col items-center gap-2 border-t border-slate-100 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {t("appt.prev")}
                            </button>

                            {pageNumbers.map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`min-w-[2rem] rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition ${
                                            p === page
                                                ? "border-brand bg-brand text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === pagination.totalPages}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {t("appt.next")}
                            </button>
                        </div>
                        <span className="text-xs text-slate-500">
                            {t("tp.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
                        </span>
                    </div>
                )}
            </div>

            {deletingTp && (
                <ConfirmModal
                    danger
                    title={t("tp.delete_title")}
                    message={t("tp.delete_message", { type: String(deletingTp.type || "").toUpperCase() })}
                    confirmLabel={t("common.delete")}
                    cancelLabel={t("common.cancel")}
                    loading={deletingBusy}
                    onConfirm={confirmDeleteTp}
                    onClose={cancelDeleteTp}
                />
            )}
        </div>
    );
}
