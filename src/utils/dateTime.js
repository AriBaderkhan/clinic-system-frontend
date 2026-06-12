// All dates/times in the app are displayed in the clinic's timezone:
// branch setting first, tenant setting as fallback (resolved by the backend).
// SettingContext calls setAppTimezone() whenever settings load or refresh.

let appTimezone = "UTC";

export function setAppTimezone(tz) {
  if (tz) appTimezone = tz;
}

export function getAppTimezone() {
  return appTimezone;
}

export function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-US", { timeZone: appTimezone });
  } catch {
    return new Date(value).toLocaleDateString();
  }
}

export function formatTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: appTimezone,
    });
  } catch {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

export function formatDateTime(value) {
  if (!value) return "-";
  return `${formatDate(value)}, ${formatTime(value)}`;
}
