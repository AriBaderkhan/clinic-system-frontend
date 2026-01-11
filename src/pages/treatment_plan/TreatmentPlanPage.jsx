// src/pages/treatment_plan/TreatmentPlanPage.jsx
import { useMemo } from "react";
import useTreatmentPlansSection from "../../hooks/useTreatmentPlansSection";

export default function TreatmentPlanPage() {
    const {
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
    } = useTreatmentPlansSection();

    const typeButtons = useMemo(
        () => ["All", "ortho", "implant", "rct", "re_rct"],
        []
    );

    return (
        <div style={{ padding: 16 }}>
            {/* FILTERS */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                {/* Paid filter */}
                <select
                    value={
                        filters.isPaid === undefined ? "" : filters.isPaid ? "true" : "false"
                    }
                    onChange={(e) => {
                        const v = e.target.value;
                        setFilters((prev) => ({
                            ...prev,
                            isPaid: v === "" ? undefined : v === "true",
                        }));
                    }}
                >
                    <option value="">Paid: All</option>
                    <option value="true">Paid</option>
                    <option value="false">Not Paid</option>
                </select>

                {/* Completed filter */}
                <select
                    value={
                        filters.isCompleted === undefined
                            ? ""
                            : filters.isCompleted
                                ? "true"
                                : "false"
                    }
                    onChange={(e) => {
                        const v = e.target.value;
                        setFilters((prev) => ({
                            ...prev,
                            isCompleted: v === "" ? undefined : v === "true",
                        }));
                    }}
                >
                    <option value="">Completed: All</option>
                    <option value="true">Completed</option>
                    <option value="false">Not Completed</option>
                </select>

                {/* Search */}
                <input
                    placeholder="Search patient name..."
                    value={filters.q}
                    onChange={(e) =>
                        setFilters((prev) => ({ ...prev, q: e.target.value }))
                    }
                />
            </div>

            {/* LIST */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                            <th>Patient Name</th>
                            <th>Type</th>
                            <th>Agreed</th>
                            <th>Paid</th>
                            <th>Remaining</th>
                            <th>Pay Status</th>
                            <th>Complete Status</th>
                            <th>Created</th>
                            <th style={{ width: 160 }}>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {tps.map((tp) => {
                            const isExpanded = expandedTpId === tp.id;
                            const sessions = tpSessions[tp.id] || [];

                            const isPaid = Number(tp.total_paid) >= Number(tp.agreed_total);

                            return (
                                <>
                                    <tr key={tp.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td>
                                            {tp.patient_name}
                                        </td>
                                        {/* TYPE */}
                                        <td>
                                            {editingTpId === tp.id ? (
                                                <select
                                                    value={tpDraft.type}
                                                    onChange={(e) =>
                                                        setTpDraft((prev) => ({ ...prev, type: e.target.value }))
                                                    }
                                                    disabled={savingTp}
                                                >
                                                    <option value="">Select...</option>
                                                    {typeButtons
                                                        .filter((x) => x !== "All")
                                                        .map((t) => (
                                                            <option key={t} value={t}>
                                                                {t.toUpperCase()}
                                                            </option>
                                                        ))}
                                                </select>
                                            ) : (
                                                String(tp.type || "").toUpperCase()
                                            )}
                                        </td>

                                        {/* AGREED */}

                                        <td>
                                            {editingTpId === tp.id ? (
                                                <input
                                                    value={tpDraft.agreed_total}
                                                    onChange={(e) =>
                                                        setTpDraft((prev) => ({
                                                            ...prev,
                                                            agreed_total: e.target.value,
                                                        }))
                                                    }
                                                    disabled={savingTp}
                                                />
                                            ) : (
                                                tp.agreed_total
                                            )}
                                        </td>

                                        <td>{tp.total_paid}</td>
                                        <td>{tp.remaining}</td>
                                        <td>{isPaid ? "Paid" : "Due"}</td>
                                        <td>{tp.is_completed ? "Done" : "Still Active"}</td>
                                        <td>{tp.created_at}</td>

                                        {/* ACTIONS */}
                                        <td style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => toggleExpand(tp.id)}>
                                                {isExpanded ? "Hide" : "Sessions"}
                                            </button>

                                            {editingTpId === tp.id ? (
                                                <>
                                                    <button onClick={() => saveEditTp(tp)} disabled={savingTp}>
                                                        {savingTp ? "Saving..." : "Save"}
                                                    </button>
                                                    <button onClick={cancelEditTp} disabled={savingTp}>
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEditTp(tp)}>✏️</button>
                                                    <button onClick={() => handleDeleteTp(tp.id)}>🗑️</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>

                                    {/* EXPANDED SESSIONS */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 12, background: "#fafafa" }}>
                                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                                    Sessions for this plan
                                                </div>

                                                {sessionsLoading && !tpSessions[tp.id] ? (
                                                    <div>Loading sessions...</div>
                                                ) : (
                                                    <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                                                        <thead>
                                                            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                                                                <th>Finished</th>
                                                                <th>Paid in this session</th>
                                                                <th>Next plan</th>
                                                                <th>Notes</th>
                                                                <th style={{ width: 120 }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sessions.map((s) => {
                                                                const isEditingThis =
                                                                    editingPaid.tpId === tp.id &&
                                                                    editingPaid.sessionId === s.session_id;

                                                                const paidValue =
                                                                    s.paid_for_this_plan_in_this_session ?? 0;

                                                                return (
                                                                    <tr key={s.session_id} style={{ borderBottom: "1px solid #eee" }}>
                                                                        <td>{s.finished_at || "-"}</td>

                                                                        <td>
                                                                            {isEditingThis ? (
                                                                                <input
                                                                                    value={paidDraft}
                                                                                    onChange={(e) => setPaidDraft(e.target.value)}
                                                                                    disabled={savingPaid}
                                                                                    style={{ width: 140 }}
                                                                                />
                                                                            ) : (
                                                                                paidValue
                                                                            )}
                                                                        </td>

                                                                        <td>{s.next_plan || "-"}</td>
                                                                        <td>{s.notes || "-"}</td>

                                                                        <td>
                                                                            {isEditingThis ? (
                                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                                    <button onClick={saveEditPaid} disabled={savingPaid}>
                                                                                        {savingPaid ? "Saving..." : "Save"}
                                                                                    </button>
                                                                                    <button onClick={cancelEditPaid} disabled={savingPaid}>
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        startEditPaid(tp.id, s.session_id, paidValue)
                                                                                    }
                                                                                    title="Edit paid"
                                                                                >
                                                                                    ✏️
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {sessions.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={5}>No sessions</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}

                        {tps.length === 0 && (
                            <tr>
                                <td colSpan={8}>No treatment plans found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
