import api from "./api";

export async function fetchWorkCatalog() {
  // backend later: simple GET that returns an array of works
  // [{ id, code, name, min_price, ... }]
  const res = await api.get("/api/work-catalog");
  return res.data;
}

