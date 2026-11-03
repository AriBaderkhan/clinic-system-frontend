import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import useWorks from "../../hooks/useWorks";
import { getSpecialties } from "../../api/specialtyApi";
import SpecialtiesSection from "./SpecialtiesSection";

// Branch Settings → Specialties & doctors: loads what the section needs (specialties + works for the doctor extras)
export default function SpecialtiesSettings() {
  const { works } = useWorks();
  const [specialties, setSpecialties] = useState([]);

  const loadSpecialties = useCallback(async () => {
    try {
      const res = await getSpecialties();
      setSpecialties(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.userMessage);
    }
  }, []);

  useEffect(() => { loadSpecialties(); }, [loadSpecialties]);

  return <SpecialtiesSection specialties={specialties} works={works} onSpecialtiesChanged={loadSpecialties} />;
}
