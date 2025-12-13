import React, { useState, useEffect } from 'react';
import { Users, DollarSign, PlayCircle, Award, BarChart3, TrendingUp, RefreshCw, Eye, ArrowUpRight, ShieldAlert, CheckCircle, XCircle, ArrowDownRight, Crown, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { SimpleBarChart } from '../components/admin/SimpleBarChart';
import {
  getStats,
  getRecentUsers,
  getRecentPurchases,
  getUsersList,
  formatDate,
  getSignupsLast7Days,
  getRevenueLast7Days,
  getYesterdayStats,
  getLessonAnalytics,
  type DashboardStats,
  type RecentUser,
  type RecentPurchase,
  type UserWithPurchase,
  type DailySignups,
  type DailyRevenue,
  type LessonAnalytics
} from '../services/adminService';
import { getCommunityStats } from '../services/communityService';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'purchases' | 'analytics' | 'traffic' | 'community'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithPurchase[]>([]);
  const [signupsData, setSignupsData] = useState<DailySignups[]>([]);
  const [revenueData, setRevenueData] = useState<DailyRevenue[]>([]);
  const [yesterdayStats, setYesterdayStats] = useState<{ signups: number; revenue: number } | null>(null);
  const [lessonAnalytics, setLessonAnalytics] = useState<LessonAnalytics[]>([]);
  const [communityStats, setCommunityStats] = useState<{ totalMembers: number; activeSubscriptions: number; totalPosts: number; monthlyRevenue: number }>({ totalMembers: 0, activeSubscriptions: 0, totalPosts: 0, monthlyRevenue: 0 });
  const [error, setError] = useState<string | null>(null);
  const { user, profile, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Admin Protection Check
  if (!user || !profile || !profile.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4 font-display">غير مصرح لك بالدخول</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          عذراً، هذه الصفحة مخصصة للمسؤولين فقط. يرجى تسجيل الدخول بحساب مسؤول للوصول إلى لوحة التحكم.
        </p>
        <Link to="/">
          <Button>العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  // Load data on mount and when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load stats for overview tab
      if (activeTab === 'overview') {
        const [statsData, usersData, purchasesData, signupsChart, revenueChart, yesterday] = await Promise.all([
          getStats(),
          getRecentUsers(10),
          getRecentPurchases(5),
          getSignupsLast7Days(),
          getRevenueLast7Days(),
          getYesterdayStats()
        ]);
        setStats(statsData);
        setRecentUsers(usersData);
        setRecentPurchases(purchasesData);
        setSignupsData(signupsChart);
        setRevenueData(revenueChart);
        setYesterdayStats(yesterday);
      }

      // Load all users for users tab
      if (activeTab === 'users') {
        const usersData = await getUsersList();
        setAllUsers(usersData);
      }

      // Load purchases for purchases tab
      if (activeTab === 'purchases') {
        const purchasesData = await getRecentPurchases(50);
        setRecentPurchases(purchasesData);
      }

      // Load lesson analytics
      if (activeTab === 'analytics') {
        const analytics = await getLessonAnalytics();
        setLessonAnalytics(analytics);
      }

      // Load community stats
      if (activeTab === 'community') {
        const stats = await getCommunityStats();
        setCommunityStats(stats);
      }
    } catch (err: any) {
      console.error('[AdminPage] Error loading data:', err);
      setError(err.message || 'فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20">
      {/* Header */}
      <header className="bg-[#111] border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
            <p className="text-gray-400 text-sm">7DayApp Admin</p>
          </div>
          <button
            onClick={refreshData}
            className={`flex items-center gap-2 bg-[#222] hover:bg-[#333] px-4 py-2 rounded-lg transition-colors ${isLoading ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-[#111] border-b border-[#222] px-6">
        <div className="max-w-7xl mx-auto flex gap-4">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
            { id: 'users', label: 'المستخدمين', icon: Users },
            { id: 'purchases', label: 'المشتريات', icon: DollarSign },
            { id: 'analytics', label: 'التحليلات', icon: TrendingUp },
            { id: 'traffic', label: 'مصادر الزيارات', icon: Eye },
            { id: 'community', label: 'المجتمع', icon: MessageCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-[#CCFF00] text-[#CCFF00]' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="text-red-500" size={20} />
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-500" size={24} />
                  </div>
                  {stats && yesterdayStats && (
                    <span className={`flex items-center text-sm ${stats.todaySignups > yesterdayStats.signups ? 'text-green-500' : stats.todaySignups < yesterdayStats.signups ? 'text-red-500' : 'text-gray-400'}`}>
                      {stats.todaySignups > yesterdayStats.signups ? (
                        <><ArrowUpRight size={16} />+{stats.todaySignups - yesterdayStats.signups}</>
                      ) : stats.todaySignups < yesterdayStats.signups ? (
                        <><ArrowDownRight size={16} />{stats.todaySignups - yesterdayStats.signups}</>
                      ) : (
                        <>=</>
                      )}
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold">{stats?.totalUsers || 0}</h3>
                <p className="text-gray-400 text-sm">إجمالي المستخدمين</p>
                {stats && stats.todaySignups > 0 && (
                  <p className="text-xs text-gray-500 mt-2">+{stats.todaySignups} اليوم</p>
                )}
              </div>

              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-500" size={24} />
                  </div>
                  {stats && yesterdayStats && stats.weeklyRevenue > yesterdayStats.revenue && (
                    <span className="flex items-center text-green-500 text-sm">
                      <ArrowUpRight size={16} />
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold">{stats?.totalRevenue || 0} د.ك</h3>
                <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
                {stats && stats.weeklyRevenue > 0 && (
                  <p className="text-xs text-gray-500 mt-2">{stats.weeklyRevenue} د.ك هذا الأسبوع</p>
                )}
              </div>

              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Award className="text-purple-500" size={24} />
                </div>
                <h3 className="text-3xl font-bold">{stats?.totalPurchases || 0}</h3>
                <p className="text-gray-400 text-sm">إجمالي المبيعات</p>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#CCFF00]/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-[#CCFF00]" size={24} />
                </div>
                <h3 className="text-3xl font-bold">{stats?.conversionRate || 0}%</h3>
                <p className="text-gray-400 text-sm">معدل التحويل</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Signups Chart */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  الاشتراكات - آخر 7 أيام
                </h3>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : signupsData.length > 0 ? (
                  <SimpleBarChart
                    data={signupsData.map(d => ({ label: d.date, value: d.count }))}
                    color="#3b82f6"
                    height={250}
                  />
                ) : (
                  <p className="text-gray-400 text-center py-12">لا توجد بيانات</p>
                )}
              </div>

              {/* Revenue Chart */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-500" />
                  الإيرادات - آخر 7 أيام (د.ك)
                </h3>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : revenueData.length > 0 ? (
                  <SimpleBarChart
                    data={revenueData.map(d => ({ label: d.date, value: d.revenue }))}
                    color="#22c55e"
                    height={250}
                  />
                ) : (
                  <p className="text-gray-400 text-center py-12">لا توجد بيانات</p>
                )}
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6">آخر المشتركين</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا يوجد مستخدمين بعد</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-[#222]">
                        <th className="text-right pb-4">المستخدم</th>
                        <th className="text-right pb-4">تاريخ الاشتراك</th>
                        <th className="text-right pb-4">حالة الشراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="border-b border-[#222] last:border-0">
                          <td className="py-4">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </td>
                          <td className="py-4 text-gray-400">{formatDate(user.created_at)}</td>
                          <td className="py-4">
                            {user.hasPurchased ? (
                              <span className="flex items-center gap-2 text-green-500">
                                <CheckCircle size={16} />
                                مشترك
                              </span>
                            ) : (
                              <span className="text-gray-500">لم يشترِ بعد</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6">إجراءات سريعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  className="bg-[#222] hover:bg-[#333] border border-[#333] hover:border-[#444] rounded-xl p-6 text-right transition-colors cursor-not-allowed opacity-50"
                  disabled
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Award className="text-purple-500" size={20} />
                    </div>
                    <h4 className="font-bold">إضافة كوبون</h4>
                  </div>
                  <p className="text-sm text-gray-500">إنشاء كوبون خصم جديد</p>
                  <span className="text-xs text-gray-600 mt-2 inline-block">قريباً</span>
                </button>

                <button
                  className="bg-[#222] hover:bg-[#333] border border-[#333] hover:border-[#444] rounded-xl p-6 text-right transition-colors cursor-not-allowed opacity-50"
                  disabled
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-500" size={20} />
                    </div>
                    <h4 className="font-bold">إرسال إشعار</h4>
                  </div>
                  <p className="text-sm text-gray-500">إرسال إشعار لجميع المستخدمين</p>
                  <span className="text-xs text-gray-600 mt-2 inline-block">قريباً</span>
                </button>

                <button
                  className="bg-[#222] hover:bg-[#333] border border-[#333] hover:border-[#444] rounded-xl p-6 text-right transition-colors cursor-not-allowed opacity-50"
                  disabled
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#CCFF00]/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-[#CCFF00]" size={20} />
                    </div>
                    <h4 className="font-bold">تصدير البيانات</h4>
                  </div>
                  <p className="text-sm text-gray-500">تصدير تقرير شامل بصيغة CSV</p>
                  <span className="text-xs text-gray-600 mt-2 inline-block">قريباً</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">جميع المستخدمين ({allUsers.length})</h3>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-4">جاري التحميل...</p>
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-gray-400 text-center py-12">لا يوجد مستخدمين بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-[#222]">
                      <th className="text-right pb-4">المستخدم</th>
                      <th className="text-right pb-4">تاريخ التسجيل</th>
                      <th className="text-right pb-4">حالة الشراء</th>
                      <th className="text-right pb-4">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#222] last:border-0 hover:bg-[#1a1a1a]">
                        <td className="py-4">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </td>
                        <td className="py-4 text-gray-400">{formatDate(user.created_at)}</td>
                        <td className="py-4">
                          {user.hasPurchased ? (
                            <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-lg text-sm flex items-center gap-2 w-fit">
                              <CheckCircle size={14} />
                              مشترك
                            </span>
                          ) : (
                            <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-lg text-sm">
                              لم يشترِ
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          {user.purchaseAmount ? (
                            <span className="text-[#CCFF00] font-bold">{user.purchaseAmount} د.ك</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">المشتريات ({recentPurchases.length})</h3>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-4">جاري التحميل...</p>
              </div>
            ) : recentPurchases.length === 0 ? (
              <p className="text-gray-400 text-center py-12">لا يوجد مشتريات بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-[#222]">
                      <th className="text-right pb-4">المستخدم</th>
                      <th className="text-right pb-4">المبلغ</th>
                      <th className="text-right pb-4">الباقة</th>
                      <th className="text-right pb-4">التاريخ</th>
                      <th className="text-right pb-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-[#222] last:border-0 hover:bg-[#1a1a1a]">
                        <td className="py-4">
                          <p className="font-medium">{purchase.user_name}</p>
                          <p className="text-gray-400 text-sm">{purchase.user_email}</p>
                        </td>
                        <td className="py-4">
                          <span className="text-[#CCFF00] font-bold">{purchase.amount_kwd} د.ك</span>
                        </td>
                        <td className="py-4">
                          {purchase.has_upsell ? (
                            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-sm">
                              دورة + استشارة
                            </span>
                          ) : (
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm">
                              دورة فقط
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-gray-400">{formatDate(purchase.created_at)}</td>
                        <td className="py-4">
                          <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-lg text-sm flex items-center gap-2 w-fit">
                            <CheckCircle size={14} />
                            مكتمل
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Video Performance Summary */}
            {lessonAnalytics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Eye className="text-blue-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">الأكثر مشاهدة</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {lessonAnalytics.sort((a, b) => b.total_views - a.total_views)[0].lesson_id}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lessonAnalytics.sort((a, b) => b.total_views - a.total_views)[0].total_views} مشاهدة
                  </p>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-purple-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">متوسط الإكمال</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {(lessonAnalytics.reduce((sum, l) => sum + l.completion_rate, 0) / lessonAnalytics.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">عبر جميع الدروس</p>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">متوسط نسبة المشاهدة</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {(lessonAnalytics.reduce((sum, l) => sum + l.avg_watch_percentage, 0) / lessonAnalytics.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">معدل الوصول</p>
                </div>
              </div>
            )}

            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PlayCircle size={20} className="text-[#CCFF00]" />
                تحليلات الدروس
              </h3>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-4">جاري التحميل...</p>
                </div>
              ) : lessonAnalytics.length === 0 ? (
                <p className="text-gray-400 text-center py-12">لا توجد بيانات تحليلية بعد</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-[#222]">
                        <th className="text-right pb-4">معرف الدرس</th>
                        <th className="text-right pb-4">عدد المشاهدات</th>
                        <th className="text-right pb-4">معدل الإكمال</th>
                        <th className="text-right pb-4">متوسط نسبة المشاهدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonAnalytics.map((lesson, index) => (
                        <tr key={lesson.lesson_id} className="border-b border-[#222] last:border-0 hover:bg-[#1a1a1a]">
                          <td className="py-4">
                            <span className="font-medium text-[#CCFF00]">{lesson.lesson_id}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-gray-300">{lesson.total_views}</span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-[#222] rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(lesson.completion_rate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-300 min-w-[45px]">{lesson.completion_rate}%</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-[#222] rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(lesson.avg_watch_percentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-300 min-w-[45px]">{lesson.avg_watch_percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Insights */}
            {lessonAnalytics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">الأكثر إكمالاً</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {lessonAnalytics.sort((a, b) => b.completion_rate - a.completion_rate)[0].lesson_id}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lessonAnalytics.sort((a, b) => b.completion_rate - a.completion_rate)[0].completion_rate}% معدل الإكمال
                  </p>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Eye className="text-blue-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">الأكثر مشاهدة</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {lessonAnalytics.sort((a, b) => b.total_views - a.total_views)[0].lesson_id}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lessonAnalytics.sort((a, b) => b.total_views - a.total_views)[0].total_views} مشاهدة
                  </p>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <XCircle className="text-red-500" size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-400">الأقل إكمالاً</h4>
                  </div>
                  <p className="text-xl font-bold text-[#CCFF00]">
                    {lessonAnalytics.sort((a, b) => a.completion_rate - b.completion_rate)[0].lesson_id}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lessonAnalytics.sort((a, b) => a.completion_rate - b.completion_rate)[0].completion_rate}% معدل الإكمال
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traffic Sources Tab */}
        {activeTab === 'traffic' && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="text-purple-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">مصادر الزيارات</h3>
              <p className="text-gray-400 mb-6">يتم جمع البيانات من PostHog</p>
              <a
                href="https://app.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#CCFF00] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b8e600] transition-colors"
              >
                <ArrowUpRight size={20} />
                فتح لوحة PostHog
              </a>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Members */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-500" size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{communityStats.totalMembers}</h3>
                <p className="text-sm text-gray-400">إجمالي الأعضاء</p>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Crown className="text-green-500" size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{communityStats.activeSubscriptions}</h3>
                <p className="text-sm text-gray-400">اشتراكات نشطة</p>
              </div>

              {/* Total Posts */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <MessageCircle className="text-purple-500" size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{communityStats.totalPosts}</h3>
                <p className="text-sm text-gray-400">إجمالي المنشورات</p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-yellow-500" size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{communityStats.monthlyRevenue.toFixed(3)} د.ك</h3>
                <p className="text-sm text-gray-400">الإيرادات الشهرية</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;