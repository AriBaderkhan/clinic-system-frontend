import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiCheck, FiCheckCircle, FiAlertCircle, FiEye, FiLink } from 'react-icons/fi';
import { getAllUsers, createUser, getRoles, updateUser, assignUserToBranch, deactivateUser } from '../../api/userApi';
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast'
import { getBranches } from '../../api/tenantApi';

export default function TenantUsers() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const initialFormState = {
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        role_id: '',
        branch_id: '',
        room: '', // For doctors
        is_active: true
    };
    const [formData, setFormData] = useState(initialFormState);

    // Assign Form State
    const [assignFormData, setAssignFormData] = useState({
        branch_id: '',
        role_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData, branchesData] = await Promise.all([
                getAllUsers(),
                getRoles(),
                getBranches()
            ]);
            setUsers(usersData.data || []);
            setRoles(rolesData.data || []);
            setBranches(branchesData.data || []);
        } catch (error) {
            toast.error(error.userMessage || t('users.failed_load_data'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssignInputChange = (e) => {
        const { name, value } = e.target;
        setAssignFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditing(true);

        const role = roles.find(r => r.name === user.role_name);
        const branch = branches.find(b => b.name === user.branch_name);

        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: '',
            confirmPassword: '',
            phone: user.phone || '',
            address: user.address || '',
            role_id: role ? role.id : '',
            branch_id: branch ? branch.id : '',
            room: user.room || '',
            is_active: user.is_active_global
        });
        setIsModalOpen(true);
    };

    const handleView = (user) => {
        setSelectedUser(user);
        setIsViewModalOpen(true);
    };

    const handleAssign = (user) => {
        setSelectedUser(user);
        setAssignFormData({ branch_id: '', role_id: '' });
        setIsAssignModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!isEditing && formData.password !== formData.confirmPassword) {
            toast.error(t('users.passwords_no_match'));
            return;
        }
        if (isEditing && formData.password && formData.password !== formData.confirmPassword) {
            toast.error(t('users.passwords_no_match'));
            return;
        }

        if (!isEditing && (!formData.role_id || !formData.branch_id)) {
            toast.error(t('users.select_role_branch'));
            return;
        }

        try {
            setSubmitting(true);
            // const user = JSON.parse(localStorage.getItem('user') || '{}');

            const payload = {
                ...formData,
                role_id: Number(formData.role_id),
                branch_id: Number(formData.branch_id),
                // tenant_id: user.tenant_id
            };

            console.log(payload);
            // Remove room if empty to avoid validation error (Joi expects number)
            if (!payload.room) {
                delete payload.room;
            }

            if (isEditing) {
                // Update — identity/profile only. Branch & role are managed via
                // the "Assign to Branch" action, so don't send them here.
                if (!payload.password) delete payload.password; // Don't send empty password
                delete payload.confirmPassword;
                delete payload.role_id;
                delete payload.branch_id;

                await updateUser(selectedUser.id, payload);
                toast.success(t('users.updated_success'));
            } else {
                // Create
                await createUser(payload);
                toast.success(t('users.created_success'));
            }

            setIsModalOpen(false);
            setFormData(initialFormState);
            setIsEditing(false);
            setSelectedUser(null);
            loadData();
        } catch (error) {
            toast.error(error.userMessage || t('users.failed_save'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();

        if (!assignFormData.role_id || !assignFormData.branch_id) {
            toast.error(t('users.select_role_branch'));
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                role_id: Number(assignFormData.role_id),
                branch_id: Number(assignFormData.branch_id),
            };

            await assignUserToBranch(selectedUser.id, payload);
            toast.success(t('users.assigned_success'));

            setIsAssignModalOpen(false);
            setSelectedUser(null);
            setAssignFormData({ branch_id: '', role_id: '' });
            loadData();
        } catch (error) {
            toast.error(error.userMessage || t('users.failed_assign'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (user) => {
        const confirmed = window.confirm(t('users.deactivate_confirm', { name: user.full_name }));
        if (!confirmed) return;
        try {
            await deactivateUser(user.id);
            toast.success(t('users.deactivated_success', { name: user.full_name }));
            loadData();
        } catch (error) {
            toast.error(error.userMessage || t('users.failed_deactivate'));
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setSelectedUser(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('users.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('users.subtitle')}</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#0E6E75] hover:bg-[#0E6E75] text-white px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                >
                    <FiPlus size={20} />
                    {t('users.add_user')}
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('users.search_placeholder')}
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full ps-10 pe-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-gray-50 rounded-md text-sm text-gray-600 border">
                        {t('users.total_users')}: <span className="font-semibold text-gray-900">{new Set(users.map(u => u.id)).size}</span>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.col_user')}</th>
                                <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.col_role')}</th>
                                <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.col_branch')}</th>
                                <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.col_contact')}</th>
                                <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.col_status')}</th>
                                <th className="px-6 py-4 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {t('users.loading_users')}
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {t('users.none_found')}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${!user.is_active_global ? "opacity-50 bg-gray-50" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0E6E75]/10 text-[#0E6E75] capitalize border border-[#0E6E75]/20">
                                                {user.role_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 flex items-center gap-1">
                                                {user.branch_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{user.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active_global && user.is_active_branch ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0E6E75]/10 text-[#0E6E75] border border-[#0E6E75]/20">{t('common.active')}</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{t('common.inactive')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleView(user)}
                                                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                    title={t('common.view')}
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAssign(user)}
                                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-[#0E6E75]/10 rounded-lg transition-all"
                                                    title={t('users.assign_to_branch')}
                                                >
                                                    <FiLink size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-gray-500 hover:text-[#0E6E75] hover:bg-[#0E6E75]/10 rounded-lg transition-all"
                                                    title={t('common.edit')}
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(user)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title={t('common.delete')}
                                                    disabled={!user.is_active_global}
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    {/* ... (Add User Modal Content) ... */}
                    {/* Re-using existing modal content from previous steps */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? t('users.edit_user') : t('users.add_new_user')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* ... Form Fields ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.full_name')} <span className="text-red-500">*</span></label><input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" placeholder="John Doe" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.email')} <span className="text-red-500">*</span></label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" placeholder="john@example.com" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.phone')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.address')}</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{isEditing ? t('users.new_password_optional') : t('users.password')} {!isEditing && <span className="text-red-500">*</span>}</label><input type="password" name="password" required={!isEditing} minLength={3} value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.confirm_password')} {!isEditing && <span className="text-red-500">*</span>}</label><input type="password" name="confirmPassword" required={!isEditing} minLength={3} value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" /></div>
                            </div>
                            {!isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.assign_role')} <span className="text-red-500">*</span></label><select name="role_id" required value={formData.role_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"><option value="">{t('users.select_role')}</option>{roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}</select></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.assign_branch')} <span className="text-red-500">*</span></label><select name="branch_id" required value={formData.branch_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"><option value="">{t('users.select_branch')}</option>{branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}</select></div>
                            </div>
                            )}
                            {isEditing && (
                                <p className="pt-4 border-t border-gray-100 text-xs text-gray-500">
                                    {t('users.edit_hint')}
                                </p>
                            )}
                            {roles.find(r => Number(r.id) === Number(formData.role_id))?.name?.toLowerCase() === 'doctor' && (
                                <div className="space-y-1 pt-2"><label className="text-sm font-medium text-gray-700">{t('users.room_number')}</label><input type="number" name="room" value={formData.room} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" placeholder={t('users.room_placeholder')} /></div>
                            )}
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all" disabled={submitting}>{t('common.cancel')}</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0E6E75] text-white font-medium hover:bg-[#0E6E75] shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled={submitting}>{submitting ? t('common.saving') : <>{isEditing ? t('users.update_user') : t('users.create_user')} <FiCheckCircle size={18} /></>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Branch Modal */}
            {isAssignModalOpen && selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsAssignModalOpen(false)}
                >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">{t('users.assign_to_branch')}</h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"><FiX size={20} /></button>
                        </div>
                        <div className="px-6 py-4 bg-[#0E6E75]/10/50 border-b border-[#0E6E75]/20"><p className="text-sm text-gray-600">{t('users.assigning_to', { name: selectedUser.full_name })}</p></div>
                        <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.select_branch')} <span className="text-red-500">*</span></label><select name="branch_id" required value={assignFormData.branch_id} onChange={handleAssignInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"><option value="">{t('users.select_branch')}</option>{branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}</select></div>
                            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('users.select_role')} <span className="text-red-500">*</span></label><select name="role_id" required value={assignFormData.role_id} onChange={handleAssignInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"><option value="">{t('users.select_role')}</option>{roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}</select></div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all" disabled={submitting}>{t('common.cancel')}</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0E6E75] text-white font-medium hover:bg-[#0E6E75] shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled={submitting}>{submitting ? t('users.assigning') : <>{t('users.assign_branch_btn')} <FiLink size={18} /></>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View User Modal */}
            {isViewModalOpen && selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsViewModalOpen(false)}
                >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">{t('users.user_details')}</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"><FiX size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">{selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.full_name}</h3>
                                    <p className="text-gray-500">{selectedUser.email}</p>
                                    <div className="mt-1 flex gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0E6E75]/10 text-[#0E6E75] capitalize border border-[#0E6E75]/20">{selectedUser.role_name}</span>
                                        {selectedUser.is_active_global && selectedUser.is_active_branch ? (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#0E6E75]/10 text-[#0E6E75] border border-[#0E6E75]/20">{t('common.active')}</span>) : (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{t('common.inactive')}</span>)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">{t('users.phone')}</p><p className="text-gray-800 font-medium">{selectedUser.phone || t('common.na')}</p></div>
                                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">{t('users.col_branch')}</p><p className="text-gray-800 font-medium">{selectedUser.branch_name}</p></div>
                                <div className="bg-gray-50 p-3 rounded-lg col-span-2"><p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">{t('users.address')}</p><p className="text-gray-800 font-medium">{selectedUser.address || t('common.na')}</p></div>
                                {selectedUser.room && (<div className="bg-[#0E6E75]/10 p-3 rounded-lg col-span-2 border border-[#0E6E75]/20"><p className="text-[#0E6E75] text-xs uppercase tracking-wider font-semibold mb-1">{t('users.doctors_room')}</p><p className="text-[#0E6E75] font-medium">{t('users.room_label', { n: selectedUser.room })}</p></div>)}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end"><button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all">{t('common.close')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
