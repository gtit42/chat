import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Crown, Globe, Users, VideoIcon, UsersIcon, Globe2Icon, ShieldIcon, Settings } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { COUNTRIES } from "@shared/countries";

export default function Home() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(0);

  // جلب عدد المستخدمين المتصلين
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/stats/online-users');
        const data = await response.json();
        setOnlineUsers(data.count || 0);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000); // كل 30 ثانية

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const element = document.getElementById('onlineUsers');
    if (element) {
      element.textContent = onlineUsers.toString();
    }
  }, [onlineUsers]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Video className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ChatConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.isAdmin && (
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href="/admin">
                      <Crown className="mr-1" size={16} />
                      إدارة أساسية
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link href="/enhanced-admin">
                      <Settings className="mr-1" size={16} />
                      إدارة متقدمة
                    </Link>
                  </Button>
                </div>
              )}
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-gray-700">
                مرحباً، {user?.firstName || user?.email}
              </span>
              <Button variant="outline" asChild>
                <a href="/api/logout">تسجيل الخروج</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            مرحباً بك في ChatConnect
          </h1>
          <p className="text-xl text-gray-600">
            ابدأ دردشة فيديو عشوائية مع أشخاص من حول العالم
          </p>
        </div>

        {/* Stats and Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Online Users Card */}
          <Card className="bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={40} />
              </div>
              <CardTitle className="text-2xl">المستخدمين الحاليين</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2" id="onlineUsers">
                ---
              </div>
              <p className="text-gray-600">متصل الآن</p>
            </CardContent>
          </Card>
          
          {/* Start Chat Card */}
          <Card className="bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="text-white" size={40} />
              </div>
              <CardTitle className="text-2xl">ابدأ دردشة فيديو</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                تواصل مع أشخاص عشوائيين من الدولة التي تختارها
              </p>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                asChild
              >
                <Link href="/video-chat">
                  <Video className="mr-2" size={20} />
                  ابدأ الآن
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="text-white" size={40} />
              </div>
              <CardTitle className="text-2xl">
                {user?.isSubscribed ? "العضوية المميزة" : "ترقية الحساب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {user?.isSubscribed ? (
                <div>
                  <p className="text-green-600 mb-6 font-semibold">
                    ✅ أنت مشترك في العضوية المميزة
                  </p>
                  <div className="text-sm text-gray-600">
                    <p>• جميع الدول متاحة</p>
                    <p>• وقت غير محدود</p>
                    <p>• بدون إعلانات</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    احصل على مميزات إضافية مقابل $3 شهرياً
                  </p>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                    asChild
                  >
                    <Link href="/subscribe">
                      <Crown className="mr-2" size={20} />
                      اشتراك الآن
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6 text-center">
              <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">190+ دولة</h3>
              <p className="text-sm text-gray-600">اختر من أي دولة في العالم</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6 text-center">
              <ShieldIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">آمن ومحمي</h3>
              <p className="text-sm text-gray-600">نظام إبلاغ وحظر متقدم</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">جودة HD</h3>
              <p className="text-sm text-gray-600">فيديو وصوت عالي الجودة</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
