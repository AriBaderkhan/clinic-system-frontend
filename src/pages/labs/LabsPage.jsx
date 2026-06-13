import { useState } from "react";
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

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString();
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
          className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>

        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
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
          onClick={() => onPageChange(page + 1)}
          disabled={page === pagination.totalPages}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
      <span className="text-[11px] text-slate-400">
        Showing {rowStart}–{rowEnd} of {pagination.total}
      </span>
    </div>
  );
}

export default function LabsPage() {
  const [activeTab, setActiveTab] = useState("orders"); // orders | labs

  // dates/times are shown in the branch's configured timezone (branch/tenant settings)
  const { settings, formatDateTime: formatDateTimeTz } = useSettings();
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
        toast.success("Order created");
      } else {
        await editLabOrder(activeOrder.id, payload);
        toast.success("Order updated");
      }
      setOpenOrderForm(false);
      await ordersState.refresh();
    } catch (err) {
      toast.error(err.userMessage || "Could not save the order.");
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  const onDeleteOrder = async (order) => {
    const ok = window.confirm(`Delete this order (${order.items_summary || "items"} from ${order.lab_name})?`);
    if (!ok) return;
    try {
      await deleteLabOrder(order.id);
      toast.success("Order deleted");
      await ordersState.refresh();
    } catch (err) {
      toast.error(err.userMessage || "Could not delete the order.");
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
        toast.success("Lab created");
      } else {
        await editLab(activeLabId, payload);
        toast.success("Lab updated");
      }
      setOpenLabForm(false);
      await labsState.refresh();
    } catch (err) {
      toast.error(err.userMessage || "Could not save the lab.");
    } finally {
      setIsLabSubmitting(false);
    }
  };

  const onDeleteLab = async (lab) => {
    const ok = window.confirm(`Delete lab "${lab.name}"? Its old orders stay in history.`);
    if (!ok) return;
    try {
      await deleteLab(lab.id);
      toast.success("Lab deleted");
      await labsState.refresh();
    } catch (err) {
      toast.error(err.userMessage || "Could not delete the lab.");
    }
  };

  const tabButton = (key, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        activeTab === key
          ? "bg-[#015478] text-white"
          : "text-[#015478] hover:bg-[#015478]/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Lab</h1>
          <p className="text-xs text-slate-500">
            Manage the labs the clinic works with, their price lists, and lab orders.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClickAddLab}
            className="rounded-lg border border-[#015478]/30 bg-white px-4 py-2 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5"
          >
            + Add Lab
          </button>
          <button
            type="button"
            onClick={onClickMakeOrder}
            className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#013d58]"
          >
            + Make Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit rounded-full border border-[#015478]/20 bg-[#015478]/5 p-1">
        {tabButton("orders", "Orders")}
        {tabButton("labs", "Labs")}
      </div>

      {/* ===================== ORDERS TAB ===================== */}
      {activeTab === "orders" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {/* Filters */}
          <div className="mb-5 rounded-2xl bg-[#015478]/5 border border-[#015478]/10 px-4 py-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-[#015478]">Search</label>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Patient, phone, doctor, lab..."
                className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#015478]">Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
              >
                <option value="">All</option>
                <option value="ordered">Ordered</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={ordersState.refresh}
                className="rounded-xl bg-[#015478] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] transition-colors"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => { setOrderSearch(""); setOrderStatus(""); }}
                className="rounded-xl border border-[#015478]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-400">
            {ordersState.isLoading ? "Loading orders…" : `Total: ${ordersState.pagination.total}`}
          </p>

          {ordersState.error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {ordersState.error}
            </div>
          )}

          {!ordersState.isLoading && !ordersState.error && ordersState.orders.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No orders found. Click "+ Make Order" to create the first one.
            </div>
          )}

          {ordersState.orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Order Date</th>
                    <th className="px-3 py-2 font-medium">Lab</th>
                    <th className="px-3 py-2 font-medium">Patient</th>
                    <th className="px-3 py-2 font-medium">Doctor</th>
                    <th className="px-3 py-2 font-medium">Treatments</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Ready</th>
                    <th className="px-3 py-2 font-medium">Delivered</th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersState.orders.map((o, idx) => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">
                        {(ordersState.page - 1) * ordersState.pagination.limit + idx + 1}
                      </td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateTime(o.order_date)}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{o.lab_name}</td>
                      <td className="px-3 py-2 text-slate-700">{o.patient_name}</td>
                      <td className="px-3 py-2 text-slate-700 capitalize">{o.doctor_name}</td>
                      <td className="px-3 py-2 text-slate-700">{o.items_summary || "-"}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{formatMoney(o.total_cost)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setOrderForStatus(o)}
                          title="Click to change status"
                          className={
                            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize hover:opacity-80 " +
                            statusBadgeClasses(o.status)
                          }
                        >
                          {o.status}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateTime(o.ready_date)}</td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateTime(o.delivered_date)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setOrderDetailsId(o.id)}
                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-slate-100 hover:bg-[#013d58]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onClickEditOrder(o)}
                            className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-yellow-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(o)}
                            className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-red-900"
                          >
                            Delete
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {/* Filters */}
          <div className="mb-5 rounded-2xl bg-[#015478]/5 border border-[#015478]/10 px-4 py-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-[#015478]">Search</label>
              <input
                type="text"
                value={labSearch}
                onChange={(e) => setLabSearch(e.target.value)}
                placeholder="Lab name..."
                className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={labsState.refresh}
                className="rounded-xl bg-[#015478] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] transition-colors"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setLabSearch("")}
                className="rounded-xl border border-[#015478]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-400">
            {labsState.isLoading ? "Loading labs…" : `Total: ${labsState.pagination.total}`}
          </p>

          {labsState.error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {labsState.error}
            </div>
          )}

          {!labsState.isLoading && !labsState.error && labsState.labs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No labs yet. Click "+ Add Lab" to register the first one.
            </div>
          )}

          {labsState.labs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Lab Name</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Treatments</th>
                    <th className="px-3 py-2 font-medium">Added</th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {labsState.labs.map((lab, idx) => (
                    <tr key={lab.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">
                        {(labsState.page - 1) * labsState.pagination.limit + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{lab.name}</td>
                      <td className="px-3 py-2 text-slate-700">{lab.phone || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{lab.treatments_count}</td>
                      <td className="px-3 py-2 text-slate-700">{formatDate(lab.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => onClickEditLab(lab)}
                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-slate-100 hover:bg-[#013d58]"
                          >
                            View / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteLab(lab)}
                            className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-red-900"
                          >
                            Delete
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
