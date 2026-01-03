// src/pages/patients/AddPatient.jsx
import { useNavigate } from "react-router-dom";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";

function AddPatient() {
  const { createPatients, isSubmitting, error } = usePatients({
    skipFetch: true,
  });
  const navigate = useNavigate();

const handleCreate = async (payload) => {

  try {
    const result = await createPatients(payload);
    if (result.ok) {
    navigate("/dashboard/patients");
  } 
    
  } catch (error) {
    console.log("Creation failed:", error);
  }
  // Capture the result from the hook
  

  // Only navigate if the backend actually saved the data
 
    // The hook already set the 'error' state, 
    // so PatientForm will automatically show the message.
    
  
};
  return (
    <PatientForm
      mode="add"
      initialData={null}
      onSubmit={handleCreate}
      isSubmitting={isSubmitting}
      errorMessage={error}
    />
  );
}

export default AddPatient;
