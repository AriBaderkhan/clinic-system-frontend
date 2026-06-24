import api from './api';

// Read-only autocomplete: the clinic's own past values for a field
// (drug_name / dosage / frequency / duration), scoped per tenant.
export const suggestPrescriptionField = async (field, q) => {
    const res = await api.get('/api/prescriptions/suggest', { params: { field, q } });
    return res.data;
};
