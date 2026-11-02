import api from "./api";

// branch roles of the CURRENT branch, each with can_edit
export const getBranchRoles = async () => {
    const res = await api.get("/api/role-permissions");
    return res.data;
};

// { role, permissions: [{ key, group_key, granted, is_default, locked, has_scope, scope, default_scope, max_scope }] }
export const getRolePermissions = async (roleId) => {
    const res = await api.get(`/api/role-permissions/${roleId}`);
    return res.data;
};

// permissions = the FULL list of ticked keys; scopes = { view_patient: 'own' | 'all', ... }
export const saveRolePermissions = async (roleId, permissions, scopes) => {
    const res = await api.put(`/api/role-permissions/${roleId}`, { permissions, scopes });
    return res.data;
};

// ---- custom roles (Pro) ----
// { name, base_role_id, is_doctor } -> the new role
export const createRole = async (data) => {
    const res = await api.post("/api/role-permissions", data);
    return res.data;
};

export const renameRole = async (roleId, name) => {
    const res = await api.patch(`/api/role-permissions/${roleId}`, { name });
    return res.data;
};

export const deleteRole = async (roleId) => {
    const res = await api.delete(`/api/role-permissions/${roleId}`);
    return res.data;
};
