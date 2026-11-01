import api from "./api";

// { floors, my_floor_id }
export const getFloors = async () => {
    const res = await api.get("/api/floors");
    return res.data;
};

export const createFloor = async (data) => {
    const res = await api.post("/api/floors", data);
    return res.data;
};

export const updateFloor = async (id, data) => {
    const res = await api.put(`/api/floors/${id}`, data);
    return res.data;
};

export const deleteFloor = async (id) => {
    const res = await api.delete(`/api/floors/${id}`);
    return res.data;
};

// branch staff + their home floor
export const getStaffFloors = async () => {
    const res = await api.get("/api/floors/staff");
    return res.data;
};

export const setStaffFloor = async (userId, floorId) => {
    const res = await api.put(`/api/floors/staff/${userId}`, { floor_id: floorId });
    return res.data;
};
