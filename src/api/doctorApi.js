import api from "./api";

export const getAllDoctors = async () => {
    const res = await api.get("/api/docs");
    return res.data;
};

export const getActiveTodayApptsPerDoc = async () => {
    const res = await api.get("/api/docs/active/appointments/today");
    return res.data;
};

// All the doctor's unfinished (in_progress) appointments, any date.
export const getOpenApptsPerDoc = async () => {
    const res = await api.get("/api/docs/active/appointments/open");
    return res.data;
};

export const getAllApptsPerDoc = async (params = {}) => {
    const res = await api.get("/api/docs/appointments/per-doctor", { params });
    return res.data;
};

// The logged-in doctor's own report (current branch).
export const getMyDoctorReport = async (params = {}) => {
    const res = await api.get("/api/docs/report", { params });
    return res.data?.data || null;
};

// Same report as a PDF blob. params: { month } or { from, to }.
export const downloadMyDoctorReportPdf = async ({ month, from, to } = {}) => {
    const res = await api.get("/api/docs/report/pdf", {
        params: { month, from, to },
        responseType: "blob",
    });
    const cd = res.headers?.["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/i);
    let fallback = "Doctor-Report.pdf";
    if (month) fallback = `Doctor-Report-${month}.pdf`;
    if (from && to) fallback = `Doctor-Report-${from}-to-${to}.pdf`;
    return { blob: res.data, filename: match?.[1] || fallback };
};