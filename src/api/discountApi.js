import api from "./api";

export const getDiscounts = async () => {
  const res = await api.get("/api/discounts");
  return res.data;
};

export const createDiscount = async (data) => {
  const res = await api.post("/api/discounts", data);
  return res.data;
};

export const updateDiscount = async (id, data) => {
  const res = await api.put(`/api/discounts/${id}`, data);
  return res.data;
};

export const deleteDiscount = async (id) => {
  const res = await api.delete(`/api/discounts/${id}`);
  return res.data;
};
