import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { switchBranch } from '../api/userApi';
import toast from 'react-hot-toast';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedBranches = localStorage.getItem('availableBranches');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedBranches) setBranches(JSON.parse(storedBranches));
  }, []);

  const handleBranchSwitch = async (branchId) => {
    try {
      const res = await switchBranch({ branch_id: branchId });

      // Update local storage
      localStorage.setItem('token', res.token1);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('role', res.user.role);

      toast.success('Switched branch successfully');

      // Force reload to apply new permissions/routes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Failed to switch branch');
    }
  };

  const currentBranchName = branches.find(b => b.branch_id === user?.branch_id)?.role_name || 'Current Branch'; // fallback

  return (
    <header className="flex h-14 items-center justify-between border-b bg-slate-800 px-4 shadow-sm backdrop-blur">
      {/* Mobile hamburger */}
      <button
        className="rounded-md px-3 py-2 text-white hover:bg-slate-700 md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">Dashboard</span>
        {user?.branch_id && (
          <span className="text-[11px] text-slate-400">Branch ID: {user.branch_id}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Branch Switcher Dropdown */}
        {branches.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-600"
            >
              <span>Switch Branch</span>
              <svg className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                {branches.map(branch => (
                  <button
                    key={branch.branch_id}
                    onClick={() => handleBranchSwitch(branch.branch_id)}
                    disabled={branch.branch_id === user?.branch_id}
                    className={`block w-full px-4 py-2 text-left text-sm ${branch.branch_id === user?.branch_id
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {branch.branch_name || `Branch ${branch.branch_id}`} ({branch.role_name})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hidden text-right text-xs sm:block">
          <div className="font-medium text-white">{user?.name}</div>
          <div className="text-slate-400 capitalize">{user?.role}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954] text-xs font-semibold text-white">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}

export default Header;
