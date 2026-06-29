// Display config for the Insights Assistant. The actual question list comes from
// the backend catalog (the single source of truth, also future-AI-ready); this
// file only controls how each category is labelled and ordered in the menu.
export const INSIGHT_CATEGORIES = [
    { code: "patients", label: "Patients", icon: "🧑" },
    { code: "appointments", label: "Appointments", icon: "📅" },
    { code: "treatments", label: "Treatments", icon: "🦷" },
    { code: "revenue", label: "Revenue", icon: "💰" },
];
