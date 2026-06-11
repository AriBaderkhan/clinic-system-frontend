// Each doctor gets a fixed color: the first doctor (smallest id) gets the menu bar
// blue, the second the navy, the third the light green, then the rest of the palette.
const DOCTOR_PALETTE = [
  { bg: "#7b97bd", soft: "#7b97bd15", text: "#7b97bd" }, // menu bar blue
  { bg: "#015478", soft: "#01547815", text: "#015478" }, // navy (brand)
  { bg: "#66bb6a", soft: "#66bb6a15", text: "#66bb6a" }, // light green
  { bg: "#e11d74", soft: "#e11d7415", text: "#e11d74" }, // pink
  { bg: "#f97316", soft: "#f9731615", text: "#f97316" }, // orange
  { bg: "#7c3aed", soft: "#7c3aed15", text: "#7c3aed" }, // violet
  { bg: "#0d9488", soft: "#0d948815", text: "#0d9488" }, // teal
  { bg: "#ca8a04", soft: "#ca8a0415", text: "#ca8a04" }, // gold
  { bg: "#dc2626", soft: "#dc262615", text: "#dc2626" }, // red
  { bg: "#2563eb", soft: "#2563eb15", text: "#2563eb" }, // blue
];

export function getDoctorColor(doctorId) {
  const id = Number(doctorId) || 0;
  return DOCTOR_PALETTE[id % DOCTOR_PALETTE.length];
}

// Rank-based assignment: sort doctor ids ascending (oldest doctor first) so the
// first doctor always gets the menu bar color, the second the navy, and so on.
export function buildDoctorColorMap(doctorIds) {
  const sorted = [...new Set(doctorIds.map(Number))].sort((a, b) => a - b);
  const map = new Map();
  sorted.forEach((id, i) => map.set(id, DOCTOR_PALETTE[i % DOCTOR_PALETTE.length]));
  return map;
}
