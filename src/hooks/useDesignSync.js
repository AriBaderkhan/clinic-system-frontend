import { useEffect } from "react";
import { getMyDesign, saveMyDesign } from "../api/profileApi";
import { onDesignSave, setDesign } from "../utils/theme";

// Logged-in layouts: load the user's design from their account, and let the
// light/dark button save to the account too. Never breaks the app if it fails.
export default function useDesignSync() {
  useEffect(() => {
    let alive = true;
    onDesignSave((d) => { saveMyDesign(d).catch(() => {}); });
    getMyDesign()
      .then((res) => {
        const d = res?.data;
        if (alive && d && Object.keys(d).length) setDesign(d);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
}
