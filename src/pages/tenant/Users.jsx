import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiCheck, FiCheckCircle, FiAlertCircle, FiEye, FiLink } from 'react-icons/fi';
import { getAllUsers, createUser, getRoles, updateUser, assignUserToBranch, deactivateUser } from '../../api/userApi';
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast'
import { getBranches } from '../../api/tenantApi';
import { useSubscription } from '../../context/SubscriptionContext';
import PageHeader from '../../components/common/PageHeader';

export default function TenantUsers() {
    const { t } = useTranslation();
    const { status: subStatus } = useSubscription();
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

        // each row is one branch + its role
        const role = roles.find(r => Number(r.id) === Number(user.role_id)) || roles.find(r => r.name === user.role_name);
        const branch = branches.find(b => Number(b.id) === Number(user.branch_id)) || branches.find(b => b.name === user.branch_name);

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
                // Update — profile here; a new role for this row's branch goes through
                // the assign call, which CHANGES the role there (no second row)
                const roleChanged = formData.branch_id && formData.role_id && Number(formData.role_id) !== Number(selectedUser.role_id);
                if (!payload.password) delete payload.password; // Don't send empty password
                delete payload.confirmPassword;
                delete payload.role_id;
                delete payload.branch_id;

                await updateUser(selectedUser.id, payload);
                if (roleChanged) {
                    await assignUserToBranch(selectedUser.id, { branch_id: Number(formData.branch_id), role_id: Number(formData.role_id) });
                }
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
        <div className="w-full space-y-5">
            <PageHeader
                title={t('users.title')}
                subtitle={t('users.subtitle')}
                actions={
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
                    >
                        <FiPlus size={18} />
                        {t('users.add_user')}
                    </button>
                }
            />

            {/* Filters Section */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="relative w-full sm:w-72 md:w-96">
                    <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('users.search_placeholder')}
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-4 ps-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {t('users.total_users')}: <span className="font-bold text-slate-900 tabular-nums">{new Set(users.map(u => u.id)).size}</span>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_user')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_role')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_branch')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_contact')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_status')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">
                                        {t('users.loading_users')}
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">
                                        {t('users.none_found')}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className={`border-t border-slate-100 transition-colors hover:bg-slate-50 ${!user.is_active_global ? "opacity-50 bg-slate-50" : ""}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                                                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{user.full_name}</div>
                                                    <div className="truncate text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold capitalize text-brand">
                                                {user.role_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-sm text-slate-700">
                                                {user.branch_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="whitespace-nowrap text-sm text-slate-600">{user.phone || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_active_global && user.is_active_branch ? (
                                                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{t('common.active')}</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{t('common.inactive')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleView(user)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                                    title={t('common.view')}
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAssign(user)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                                    title={t('users.assign_to_branch')}
                                                >
                                                    <FiLink size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand/10 hover:text-brand"
                                                    title={t('common.edit')}
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(user)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    {/* ... (Add User Modal Content) ... */}
                    {/* Re-using existing modal content from previous steps */}
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{isEditing ? t('users.edit_user') : t('users.add_new_user')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><FiX size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto px-5 py-4">
                            {/* ... Form Fields ... */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.full_name')} <span className="text-red-500">*</span></label><input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" placeholder="John Doe" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.email')} <span className="text-red-500">*</span></label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" placeholder="john@example.com" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.phone')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.address')}</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{isEditing ? t('users.new_password_optional') : t('users.password')} {!isEditing && <span className="text-red-500">*</span>}</label><input type="password" name="password" required={!isEditing} minLength={3} value={formData.password} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.confirm_password')} {!isEditing && <span className="text-red-500">*</span>}</label><input type="password" name="confirmPassword" required={!isEditing} minLength={3} value={formData.confirmPassword} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" /></div>
                            </div>
                            {!isEditing && (
                            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.assign_role')} <span className="text-red-500">*</span></label><select name="role_id" required value={formData.role_id} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"><option value="">{t('users.select_role')}</option>{roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}</select></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.assign_branch')} <span className="text-red-500">*</span></label><select name="branch_id" required value={formData.branch_id} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"><option value="">{t('users.select_branch')}</option>{branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}</select></div>
                            </div>
                            )}
                            {isEditing && (
                                <div className="border-t border-slate-100 pt-4">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.role_in_branch', { branch: selectedUser?.branch_name || '' })}</label>
                                    <select data-edit-role name="role_id" value={formData.role_id} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15">{roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}</select>
                                    <p className="mt-1.5 text-xs text-slate-500">{t('users.edit_role_hint')}</p>
                                </div>
                            )}
                            {/* a new doctor beyond the plan's included doctors: extra price, or the plan is full */}
                            {!isEditing && roles.find(r => Number(r.id) === Number(formData.role_id))?.is_doctor && subStatus
                                && Number(subStatus.included_doctors) !== -1 && subStatus.doctors_used >= Number(subStatus.included_doctors) && (
                                <p data-doctor-seat className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${Number(subStatus.extra_doctor_price) < 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                                    {Number(subStatus.extra_doctor_price) < 0
                                        ? t('users.doctor_plan_full', { count: subStatus.included_doctors })
                                        : t(`users.doctor_extra_${subStatus.billing_period === 'yearly' ? 'yearly' : 'monthly'}`, { count: subStatus.included_doctors, price: subStatus.extra_doctor_price })}
                                </p>
                            )}
                            {roles.find(r => Number(r.id) === Number(formData.role_id))?.is_doctor && (
                                <div className="pt-2"><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.room_number')}</label><input type="number" name="room" value={formData.room} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" placeholder={t('users.room_placeholder')} /></div>
                            )}
                            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={submitting}>{t('common.cancel')}</button>
                                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>{submitting ? t('common.saving') : <>{isEditing ? t('users.update_user') : t('users.create_user')} <FiCheckCircle size={16} /></>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Branch Modal */}
            {isAssignModalOpen && selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsAssignModalOpen(false)}
                >
                    <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{t('users.assign_to_branch')}</h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><FiX size={18} /></button>
                        </div>
                        <div className="border-b border-brand/20 bg-brand/10 px-5 py-3"><p className="text-sm text-slate-700">{t('users.assigning_to', { name: selectedUser.full_name })}</p><p className="mt-1 text-xs text-slate-500">{t('users.assign_hint')}</p></div>
                        <form onSubmit={handleAssignSubmit} className="space-y-4 overflow-y-auto px-5 py-4">
                            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.select_branch')} <span className="text-red-500">*</span></label><select name="branch_id" required value={assignFormData.branch_id} onChange={handleAssignInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"><option value="">{t('users.select_branch')}</option>{branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}</select></div>
                            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{t('users.select_role')} <span className="text-red-500">*</span></label><select name="role_id" required value={assignFormData.role_id} onChange={handleAssignInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"><option value="">{t('users.select_role')}</option>{roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}</select></div>
                            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={submitting}>{t('common.cancel')}</button>
                                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>{submitting ? t('users.assigning') : <>{t('users.assign_branch_btn')} <FiLink size={16} /></>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View User Modal */}
            {isViewModalOpen && selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsViewModalOpen(false)}
                >
                    <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-slate-900">{t('users.user_details')}</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><FiX size={18} /></button>
                        </div>
                        <div className="space-y-4 overflow-y-auto px-5 py-4">
                            <div className="mb-5 flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-slate-900">{selectedUser.full_name}</h3>
                                    <p className="truncate text-sm text-slate-500">{selectedUser.email}</p>
                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold capitalize text-brand">{selectedUser.role_name}</span>
                                        {selectedUser.is_active_global && selectedUser.is_active_branch ? (<span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{t('common.active')}</span>) : (<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{t('common.inactive')}</span>)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.phone')}</p><p className="break-words font-medium text-slate-800">{selectedUser.phone || t('common.na')}</p></div>
                                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.col_branch')}</p><p className="break-words font-medium text-slate-800">{selectedUser.branch_name}</p></div>
                                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.address')}</p><p className="break-words font-medium text-slate-800">{selectedUser.address || t('common.na')}</p></div>
                                {selectedUser.room && (<div className="rounded-xl border border-brand/20 bg-brand/10 p-3 sm:col-span-2"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">{t('users.doctors_room')}</p><p className="font-semibold text-brand">{t('users.room_label', { n: selectedUser.room })}</p></div>)}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><button onClick={() => setIsViewModalOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('common.close')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
