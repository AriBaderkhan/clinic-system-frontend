import { useAuth } from "../context/AuthContext";

// true when the user has ANY of the ticks: hasTick(user, "view_patient", "create_patient")
export const hasTick = (user, ...keys) => keys.some((k) => (user?.permissions || []).includes(k));

// true when the tick is "own only" (the user sees just their own records)
export const isOwnOnly = (user, key) => user?.scopes?.[key] === "own";

// in components: const can = useCan();  can("delete_patient")
export default function useCan() {
  const { user } = useAuth();
  return (...keys) => hasTick(user, ...keys);
}
