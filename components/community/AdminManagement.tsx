import React, { useState, useEffect } from 'react';
import { Shield, Users, Trash2, UserPlus, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_community_admin: boolean;
  community_level: number;
  created_at: string;
}

interface AdminManagementProps {
  currentUserId: string;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'admins' | 'users'>('admins');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_community_admin, community_level, created_at')
        .eq('is_community_admin', true)
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;

      // Load all regular users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_community_admin, community_level, created_at')
        .eq('is_community_admin', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (usersError) throw usersError;

      setAdmins((adminsData as User[]) || []);
      setUsers((usersData as User[]) || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من ترقية هذا المستخدم إلى مشرف؟')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_community_admin: true })
          .eq('id', userId);

        if (error) throw error;

        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_admin_promoted', { user_id: userId });
        }

        await loadData();
      } catch (error) {
        console.error('Error promoting user:', error);
        alert('حدث خطأ في ترقية المستخدم');
      }
    }
  };

  const handleDemoteAdmin = async (userId: string) => {
    if (userId === currentUserId) {
      alert('لا يمكنك إزالة صلاحياتك الخاصة');
      return;
    }

    if (window.confirm('هل أنت متأكد من إزالة صلاحيات المشرف من هذا المستخدم؟')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_community_admin: false })
          .eq('id', userId);

        if (error) throw error;

        // Track with PostHog
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('community_admin_demoted', { user_id: userId });
        }

        await loadData();
      } catch (error) {
        console.error('Error demoting admin:', error);
        alert('حدث خطأ في إزالة الصلاحيات');
      }
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Loader className="w-12 h-12 text-[#CCFF00] animate-spin mx-auto mb-4" />
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#CCFF00]" />
            <span>إدارة المشرفين</span>
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">{admins.length} مشرف</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">{users.length} مستخدم</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="ابحث عن مستخدم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-2 ${
            activeTab === 'admins'
              ? 'text-gray-900 border-[#CCFF00] bg-[#CCFF00]/5'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>المشرفون ({filteredAdmins.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all border-b-2 ${
            activeTab === 'users'
              ? 'text-gray-900 border-[#CCFF00] bg-[#CCFF00]/5'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>المستخدمون ({filteredUsers.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {activeTab === 'admins' && (
          filteredAdmins.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد نتائج</p>
            </div>
          ) : (
            filteredAdmins.map((admin) => (
              <div key={admin.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={admin.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.full_name)}&background=CCFF00&color=000`}
                      alt={admin.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{admin.full_name}</h3>
                        <span className="px-2 py-1 bg-[#CCFF00] text-gray-900 text-xs font-bold rounded">
                          مشرف
                        </span>
                        {admin.id === currentUserId && (
                          <span className="text-xs text-gray-500">(أنت)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        انضم {new Date(admin.created_at).toLocaleDateString('ar')}
                      </p>
                    </div>
                  </div>

                  {admin.id !== currentUserId && (
                    <button
                      onClick={() => handleDemoteAdmin(admin.id)}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>إزالة الصلاحيات</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'users' && (
          filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد نتائج</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random&color=fff`}
                      alt={user.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        انضم {new Date(user.created_at).toLocaleDateString('ar')} • المستوى {user.community_level}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePromoteToAdmin(user.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 rounded-lg transition-colors font-bold"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ترقية لمشرف</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
