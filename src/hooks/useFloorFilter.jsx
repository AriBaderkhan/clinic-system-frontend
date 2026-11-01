import { useEffect, useState } from "react";
import { getFloors } from "../api/floorApi";

// Floor filter for appointment lists.
//   floorId = null while loading (lists wait, so they don't flash every floor first)
//           = ""   → all floors
//           = id   → that floor (starts on MY home floor)
// show = false when the branch has only one floor (the filter is hidden).
// Doctors don't filter by floor: their lists already follow them.
export default function useFloorFilter() {
  const isDoctor = localStorage.getItem("role") === "doctor";
  const [floors, setFloors] = useState([]);
  const [floorId, setFloorId] = useState(isDoctor ? "" : null);

  useEffect(() => {
    if (isDoctor) return;
    let alive = true;
    getFloors()
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data?.floors) ? res.data.floors : [];
        const mine = res.data?.my_floor_id;
        setFloors(list);
        // one floor → no filter; else start on my floor (if I have one)
        setFloorId(list.length > 1 && list.some((f) => Number(f.id) === Number(mine)) ? String(mine) : "");
      })
      .catch(() => { if (alive) setFloorId(""); });
    return () => { alive = false; };
  }, [isDoctor]);

  return { floors, floorId, setFloorId, show: !isDoctor && floors.length > 1 };
}
