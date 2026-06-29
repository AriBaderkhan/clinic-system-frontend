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
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold text-slate-900">{t("tp.title")}</h1>
                <p className="text-xs text-slate-500">{t("tp.subtitle")}</p>
            </div>

            {/* Filter bar */}
            <div className="rounded-2xl bg-[#015478]/5 border border-[#015478]/10 px-4 py-4 flex flex-wrap items-end gap-4">

                {/* Search */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-[#015478]">{t("tp.search")}</label>
                    <input
                        placeholder={t("tp.search_ph")}
                        value={filters.q}
                        onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                        className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
                    />
                </div>

                {/* Pay status */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#015478]">{t("tp.pay_status")}</label>
                    <select
                        value={filters.isPaid === undefined ? "" : filters.isPaid ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setFilters((prev) => ({ ...prev, isPaid: v === "" ? undefined : v === "true" }));
                        }}
                        className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
                    >
                        <option value="">{t("tp.all")}</option>
                        <option value="true">{t("tp.paid")}</option>
                        <option value="false">{t("tp.not_paid")}</option>
                    </select>
                </div>

                {/* Complete status */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#015478]">{t("tp.complete_status")}</label>
                    <select
                        value={filters.isCompleted === undefined ? "" : filters.isCompleted ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setFilters((prev) => ({ ...prev, isCompleted: v === "" ? undefined : v === "true" }));
                        }}
                        className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
                    >
                        <option value="">{t("tp.all")}</option>
                        <option value="true">{t("tp.completed")}</option>
                        <option value="false">{t("tp.not_completed")}</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setFilters({ isPaid: undefined, isCompleted: undefined, q: "" })}
                        className="rounded-xl border border-[#015478]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5 transition-colors"
                    >
                        {t("tp.clear")}
                    </button>
                </div>
            </div>

            {/* Count info */}
            <p className="text-xs text-slate-400">
                {loading
                    ? t("tp.loading_plans")
                    : t("appt.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
            </p>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-4 text-xs text-slate-500">{t("tp.loading")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                                    <th className="px-3 py-3">{t("tp.col_patient")}</th>
                                    <th className="px-3 py-3">{t("tp.col_type")}</th>
                                    <th className="px-3 py-3">{t("tp.col_agreed")}</th>
                                    <th className="px-3 py-3">{t("tp.col_paid")}</th>
                                    <th className="px-3 py-3">{t("tp.col_remaining")}</th>
                                    <th className="px-3 py-3">{t("tp.col_pay_status")}</th>
                                    <th className="px-3 py-3">{t("tp.col_complete_status")}</th>
                                    <th className="px-3 py-3">{t("tp.col_created")}</th>
                                    <th className="px-3 py-3 text-end">{t("tp.col_actions")}</th>
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
                                                className={`border-b border-slate-100 ${isEditing ? "bg-[#015478]/10" : "hover:bg-slate-50"}`}
                                            >
                                                <td className="px-3 py-2 font-medium text-slate-800">{tp.patient_name}</td>

                                                {/* TYPE */}
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <select
                                                            value={tpDraft.type}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, type: e.target.value }))}
                                                            disabled={savingTp}
                                                            className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#015478]"
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
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <input
                                                            value={tpDraft.agreed_total}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, agreed_total: e.target.value }))}
                                                            disabled={savingTp}
                                                            className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-700">{formatMoney(tp.agreed_total, tp.currency_code)}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-slate-700">{formatMoney(tp.total_paid, tp.currency_code)}</td>
                                                <td className="px-3 py-2 text-slate-700">{formatMoney(tp.remaining, tp.currency_code)}</td>

                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isPaid ? "bg-[#015478]/10 text-[#015478]" : "bg-amber-50 text-amber-700"}`}>
                                                        {isPaid ? t("tp.paid") : t("tp.due")}
                                                    </span>
                                                </td>

                                                {/* COMPLETE STATUS */}
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <select
                                                            value={tpDraft.is_completed ? "done" : "undone"}
                                                            onChange={(e) => setTpDraft((prev) => ({ ...prev, is_completed: e.target.value === "done" }))}
                                                            disabled={savingTp}
                                                            className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                        >
                                                            <option value="done">{t("tp.done")}</option>
                                                            <option value="undone">{t("tp.undone")}</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tp.is_completed ? "bg-[#015478]/10 text-[#015478]" : "bg-amber-50 text-amber-700"}`}>
                                                            {tp.is_completed ? t("tp.done") : t("tp.undone")}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-slate-700">{formatDateTime(tp.created_at)}</td>

                                                {/* ACTIONS */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(tp.id)}
                                                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-white hover:bg-[#013d58]"
                                                        >
                                                            {isExpanded ? t("tp.hide") : t("tp.sessions_btn")}
                                                        </button>

                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => saveEditTp(tp)}
                                                                    disabled={savingTp}
                                                                    className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-white hover:bg-[#013d58] disabled:opacity-60"
                                                                >
                                                                    {savingTp ? t("tp.saving") : t("tp.save")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEditTp}
                                                                    disabled={savingTp}
                                                                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                                                >
                                                                    {t("common.cancel")}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditTp(tp)}
                                                                    className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-900"
                                                                >
                                                                    {t("common.edit")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTp(tp.id)}
                                                                    className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-white hover:bg-red-900"
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
                                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                            <p className="mb-3 text-[11px] font-semibold text-slate-600">{t("tp.sessions_for_plan")}</p>

                                                            {sessionsLoading && !tpSessions[tp.id] ? (
                                                                <p className="text-xs text-slate-500">{t("tp.loading_sessions")}</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full text-left text-xs">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                                                                                <th className="px-3 py-2">{t("tp.col_finished")}</th>
                                                                                <th className="px-3 py-2">{t("tp.col_paid_session")}</th>
                                                                                <th className="px-3 py-2">{t("tp.col_payment_note")}</th>
                                                                                <th className="px-3 py-2">{t("tp.col_next_plan")}</th>
                                                                                <th className="px-3 py-2">{t("tp.col_notes")}</th>
                                                                                <th className="px-3 py-2 text-end">{t("tp.col_action")}</th>
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
                                                                                        className={`border-b border-slate-100 last:border-0 ${isEditingThis ? "bg-[#015478]/10" : "hover:bg-slate-50"}`}
                                                                                    >
                                                                                        <td className="px-3 py-2 text-slate-700">{formatDateTime(s.finished_at)}</td>

                                                                                        <td className="px-3 py-2">
                                                                                            {isEditingThis ? (
                                                                                                <input
                                                                                                    value={paidDraft}
                                                                                                    onChange={(e) => setPaidDraft(e.target.value)}
                                                                                                    disabled={savingPaid}
                                                                                                    className="w-36 rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                                                                />
                                                                                            ) : (
                                                                                                <span className="font-medium text-slate-800">{formatMoney(paidValue, tp.currency_code)}</span>
                                                                                            )}
                                                                                        </td>

                                                                                        <td className="px-3 py-2 text-slate-600 max-w-[200px]">
                                                                                            {s.payment_note ? (
                                                                                                <span className="block truncate" title={s.payment_note}>{s.payment_note}</span>
                                                                                            ) : (
                                                                                                <span className="text-slate-300">—</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-slate-700">{s.next_plan || "-"}</td>
                                                                                        <td className="px-3 py-2 text-slate-700">{s.notes || "-"}</td>

                                                                                        <td className="px-3 py-2">
                                                                                            <div className="flex items-center justify-end gap-2">
                                                                                                {isEditingThis ? (
                                                                                                    <>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={saveEditPaid}
                                                                                                            disabled={savingPaid}
                                                                                                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-white hover:bg-[#013d58] disabled:opacity-60"
                                                                                                        >
                                                                                                            {savingPaid ? t("tp.saving") : t("tp.save")}
                                                                                                        </button>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={cancelEditPaid}
                                                                                                            disabled={savingPaid}
                                                                                                            className="rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                                                                                        >
                                                                                                            {t("common.cancel")}
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => startEditPaid(tp.id, s.session_id, paidValue)}
                                                                                                        className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-900"
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
                                        <td colSpan={9} className="px-3 py-4 text-center text-xs text-slate-500">
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
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {t("appt.prev")}
                            </button>

                            {pageNumbers.map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`rounded-md border px-3 py-1.5 text-[11px] transition-colors ${
                                            p === page
                                                ? "border-[#015478] bg-[#015478] text-white"
                                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === pagination.totalPages}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {t("appt.next")}
                            </button>
                        </div>
                        <span className="text-[11px] text-slate-400">
                            {t("tp.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
