import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import useLabs from "../../hooks/useLabs";
import useLabOrders from "../../hooks/useLabOrders";
import {
  createLab, editLab, deleteLab,
  createLabOrder, editLabOrder, deleteLabOrder,
} from "../../api/labApi";
import LabFormModal from "../../components/labs/LabFormModal";
import LabOrderFormModal from "../../components/labs/LabOrderFormModal";
import LabOrderStatusModal from "../../components/labs/LabOrderStatusModal";
import LabOrderDetailsModal from "../../components/labs/LabOrderDetailsModal";
import { useSettings } from "../../context/SettingContext";
import PageHeader, { BandTabs, bandTabClass, BAND_TABS } from "../../components/common/PageHeader";

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

function statusBadgeClasses(status) {
  switch (status) {
    case "ordered":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "ready":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "delivered":
      return "bg-green-50 text-green-700 border-green-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function Pagination({ page, pagination, onPageChange }) {
  const { t } = useTranslation();
  if (pagination.totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
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
              onClick={() => onPageChange(p)}
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
          onClick={() => onPageChange(page + 1)}
          disabled={page === pagination.totalPages}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("appt.next")}
        </button>
      </div>
      <span className="text-xs text-slate-500">
        {t("lab.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
      </span>
    </div>
  );
}

export default function LabsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("orders"); // orders | labs

  // dates/times are shown in the branch's configured timezone (branch/tenant settings)
  const { settings, formatDateTime: formatDateTimeTz, formatMoney } = useSettings();
  const formatDateTime = (value) => (value ? formatDateTimeTz(value) : "-");
  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-US", { timeZone: settings.timezone }) : "-";

  // ------------------ ORDERS ------------------
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const ordersState = useLabOrders({ search: orderSearch, status: orderStatus });

  const [openOrderForm, setOpenOrderForm] = useState(false);
  const [orderFormMode, setOrderFormMode] = useState("add");
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderForStatus, setOrderForStatus] = useState(null);
  const [orderDetailsId, setOrderDetailsId] = useState(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

  // ------------------ LABS ------------------
  const [labSearch, setLabSearch] = useState("");
  const labsState = useLabs({ search: labSearch });

  const [openLabForm, setOpenLabForm] = useState(false);
  const [labFormMode, setLabFormMode] = useState("add");
  const [activeLabId, setActiveLabId] = useState(null);
  const [isLabSubmitting, setIsLabSubmitting] = useState(false);

  // ------------------ ORDER ACTIONS ------------------
  const onClickMakeOrder = () => {
    setOrderFormMode("add");
    setActiveOrder(null);
    setOpenOrderForm(true);
  };

  const onClickEditOrder = (order) => {
    setOrderFormMode("edit");
    setActiveOrder(order);
    setOpenOrderForm(true);
  };

  const onSubmitOrder = async (payload) => {
    try {
      setIsOrderSubmitting(true);
      if (orderFormMode === "add") {
        await createLabOrder(payload);
        toast.success(t("lab.order_created"));
      } else {
        await editLabOrder(activeOrder.id, payload);
        toast.success(t("lab.order_updated"));
      }
      setOpenOrderForm(false);
      await ordersState.refresh();
    } catch (err) {
      toast.error(err.userMessage || t("lab.order_save_failed"));
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  const onDeleteOrder = async (order) => {
    const ok = window.confirm(t("lab.order_delete_confirm", { items: order.items_summary || t("lab.items_fallback"), lab: order.lab_name }));
    if (!ok) return;
    try {
      await deleteLabOrder(order.id);
      toast.success(t("lab.order_deleted"));
      await ordersState.refresh();
    } catch (err) {
      toast.error(err.userMessage || t("lab.order_delete_failed"));
    }
  };

  // ------------------ LAB ACTIONS ------------------
  const onClickAddLab = () => {
    setLabFormMode("add");
    setActiveLabId(null);
    setOpenLabForm(true);
  };

  const onClickEditLab = (lab) => {
    setLabFormMode("edit");
    setActiveLabId(lab.id);
    setOpenLabForm(true);
  };

  const onSubmitLab = async (payload) => {
    try {
      setIsLabSubmitting(true);
      if (labFormMode === "add") {
        await createLab(payload);
        toast.success(t("lab.lab_created"));
      } else {
        await editLab(activeLabId, payload);
        toast.success(t("lab.lab_updated"));
      }
      setOpenLabForm(false);
      await labsState.refresh();
    } catch (err) {
      toast.error(err.userMessage || t("lab.lab_save_failed"));
    } finally {
      setIsLabSubmitting(false);
    }
  };

  const onDeleteLab = async (lab) => {
    const ok = window.confirm(t("lab.lab_delete_confirm", { name: lab.name }));
    if (!ok) return;
    try {
      await deleteLab(lab.id);
      toast.success(t("lab.lab_deleted"));
      await labsState.refresh();
    } catch (err) {
      toast.error(err.userMessage || t("lab.lab_delete_failed"));
    }
  };

  const tabButton = (key, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={bandTabClass(activeTab === key)}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full space-y-5">
      {/* Modals */}
      {openOrderForm && (
        <LabOrderFormModal
          mode={orderFormMode}
          initialData={activeOrder}
          onClose={() => setOpenOrderForm(false)}
          onSubmit={onSubmitOrder}
          isSubmitting={isOrderSubmitting}
        />
      )}

      {orderForStatus && (
        <LabOrderStatusModal
          order={orderForStatus}
          onClose={() => setOrderForStatus(null)}
          onUpdated={ordersState.refresh}
        />
      )}

      {orderDetailsId && (
        <LabOrderDetailsModal
          orderId={orderDetailsId}
          onClose={() => setOrderDetailsId(null)}
        />
      )}

      {openLabForm && (
        <LabFormModal
          mode={labFormMode}
          labId={activeLabId}
          onClose={() => setOpenLabForm(false)}
          onSubmit={onSubmitLab}
          isSubmitting={isLabSubmitting}
        />
      )}

      {/* Header */}
      <PageHeader
        title={t("lab.title")}
        subtitle={t("lab.subtitle")}
        actions={
          <>
            <button
              type="button"
              onClick={onClickAddLab}
              className="rounded-xl border border-slate-200 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/20"
            >
              {t("lab.add_lab")}
            </button>
            <button
              type="button"
              onClick={onClickMakeOrder}
              className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
            >
              {t("lab.make_order")}
            </button>
          </>
        }
      />

      {/* Tabs (in the band, under the title) */}
      <BandTabs>
        <div className={BAND_TABS}>
          {tabButton("orders", t("lab.tab_orders"))}
          {tabButton("labs", t("lab.tab_labs"))}
        </div>
      </BandTabs>

      {/* ===================== ORDERS TAB ===================== */}
      {activeTab === "orders" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-72">
              <label className="text-sm font-medium text-slate-700">{t("lab.search")}</label>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder={t("lab.order_search_ph")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">{t("lab.status")}</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              >
                <option value="">{t("lab.all")}</option>
                <option value="ordered">{t("lab.ordered")}</option>
                <option value="ready">{t("lab.ready")}</option>
                <option value="delivered">{t("lab.delivered")}</option>
                <option value="cancelled">{t("lab.cancelled")}</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={ordersState.refresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {t("lab.refresh")}
              </button>
              <button
                type="button"
                onClick={() => { setOrderSearch(""); setOrderStatus(""); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("lab.clear")}
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            {ordersState.isLoading ? t("lab.loading_orders") : t("lab.total", { count: ordersState.pagination.total })}
          </p>

          {ordersState.error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {ordersState.error}
            </div>
          )}

          {!ordersState.isLoading && !ordersState.error && ordersState.orders.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
              {t("lab.orders_empty")}
            </div>
          )}

          {ordersState.orders.length > 0 && (
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full text-start text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-start">#</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_order_date")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_lab")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_patient")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_doctor")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_treatments")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_total")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_status")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_ready")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_delivered")}</th>
                    <th className="px-4 py-3 text-end">{t("lab.col_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersState.orders.map((o, idx) => (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 tabular-nums text-slate-500">
                        {(ordersState.page - 1) * ordersState.pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDateTime(o.order_date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{o.lab_name}</td>
                      <td className="px-4 py-3 text-slate-700">{o.patient_name}</td>
                      <td className="px-4 py-3 text-slate-700 capitalize">{o.doctor_name}</td>
                      <td className="px-4 py-3 text-slate-700">{o.items_summary || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(o.total_cost, o.currency_code)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setOrderForStatus(o)}
                          title={t("lab.change_status_title")}
                          className={
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize transition hover:opacity-80 " +
                            statusBadgeClasses(o.status)
                          }
                        >
                          {o.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDateTime(o.ready_date)}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDateTime(o.delivered_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setOrderDetailsId(o.id)}
                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            {t("common.view")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onClickEditOrder(o)}
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(o)}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={ordersState.page}
            pagination={ordersState.pagination}
            onPageChange={ordersState.setPage}
          />
        </div>
      )}

      {/* ===================== LABS TAB ===================== */}
      {activeTab === "labs" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-72">
              <label className="text-sm font-medium text-slate-700">{t("lab.search")}</label>
              <input
                type="text"
                value={labSearch}
                onChange={(e) => setLabSearch(e.target.value)}
                placeholder={t("lab.lab_search_ph")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={labsState.refresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {t("lab.refresh")}
              </button>
              <button
                type="button"
                onClick={() => setLabSearch("")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("lab.clear")}
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            {labsState.isLoading ? t("lab.loading_labs") : t("lab.total", { count: labsState.pagination.total })}
          </p>

          {labsState.error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {labsState.error}
            </div>
          )}

          {!labsState.isLoading && !labsState.error && labsState.labs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
              {t("lab.labs_empty")}
            </div>
          )}

          {labsState.labs.length > 0 && (
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full text-start text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-start">#</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_lab_name")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_phone")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_treatments")}</th>
                    <th className="px-4 py-3 text-start">{t("lab.col_added")}</th>
                    <th className="px-4 py-3 text-end">{t("lab.col_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {labsState.labs.map((lab, idx) => (
                    <tr key={lab.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 tabular-nums text-slate-500">
                        {(labsState.page - 1) * labsState.pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{lab.name}</td>
                      <td className="px-4 py-3 text-slate-700">{lab.phone || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{lab.treatments_count}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(lab.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => onClickEditLab(lab)}
                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            {t("lab.view_edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteLab(lab)}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={labsState.page}
            pagination={labsState.pagination}
            onPageChange={labsState.setPage}
          />
        </div>
      )}
    </div>
  );
}
