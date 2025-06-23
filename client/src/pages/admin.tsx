import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  Shield, 
  Eye, 
  AlertTriangle,
  Crown,
  Ban,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSubscribed: boolean;
  isAdmin: boolean;
  canPromoteUsers: boolean;
  isBanned: boolean;
  createdAt: string;
}

interface ChatSession {
  id: number;
  userId: string;
  partnerId: string;
  status: string;
  country: string;
  startedAt: string;
}

interface Report {
  id: number;
  reason: string;
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    firstName: string;
  };
  reported: {
    id: string;
    email: string;
    firstName: string;
  };
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "غير مصرح",
        description: "تحتاج صلاحيات الإدارة للوصول لهذه الصفحة",
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated && user?.isAdmin) {
      loadData();
    }
  }, [isAuthenticated, isLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, sessionsRes, reportsRes] = await Promise.all([
        apiRequest("GET", "/api/admin/users"),
        apiRequest("GET", "/api/admin/chat-sessions"),
        apiRequest("GET", "/api/admin/reports")
      ]);

      setUsers(await usersRes.json());
      setChatSessions(await sessionsRes.json());
      setReports(await reportsRes.json());
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول مرة أخرى",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (userId: string, permissions: Partial<User>) => {
    try {
      await apiRequest("PUT", "/api/admin/users/permissions", {
        userId,
        ...permissions
      });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...permissions } : u
      ));
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات المستخدم بنجاح",
      });
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول مرة أخرى",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصلاحيات",
        variant: "destructive",
      });
    }
  };

  const monitorSession = async (sessionId: number) => {
    try {
      await apiRequest("POST", "/api/admin/monitor-session", { sessionId });
      toast({
        title: "تم بدء المراقبة",
        description: "يتم الآن مراقبة هذه الجلسة",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في بدء المراقبة",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-50 to-secondary/10 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-50 to-secondary/10 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
            <p className="text-gray-600 mb-6">تحتاج صلاحيات الإدارة للوصول لهذه الصفحة</p>
            <Button asChild className="w-full">
              <Link href="/">العودة للصفحة الرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-50 to-secondary/10">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">لوحة الإدارة</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                <Crown className="mr-1" size={16} />
                إدارة
              </Badge>
              <Button variant="outline" asChild>
                <Link href="/">الصفحة الرئيسية</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">جلسات نشطة</p>
                  <p className="text-2xl font-bold">{chatSessions.length}</p>
                </div>
                <Activity className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">البلاغات</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <AlertTriangle className="text-orange-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المشتركين</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.isSubscribed).length}
                  </p>
                </div>
                <Crown className="text-secondary" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="sessions">مراقبة الجلسات</TabsTrigger>
            <TabsTrigger value="reports">البلاغات</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{u.firstName || u.email}</h3>
                          {u.isAdmin && <Badge variant="destructive">إدارة</Badge>}
                          {u.isSubscribed && <Badge variant="secondary">مشترك</Badge>}
                          {u.isBanned && <Badge variant="outline">محظور</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-xs text-gray-500">
                          انضم في: {new Date(u.createdAt).toLocaleDateString('ar')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">اشتراك</label>
                          <Switch
                            checked={u.isSubscribed}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(u.id, { isSubscribed: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">ترقية</label>
                          <Switch
                            checked={u.canPromoteUsers}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(u.id, { canPromoteUsers: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">حظر</label>
                          <Switch
                            checked={u.isBanned}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(u.id, { isBanned: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Monitoring */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>مراقبة الجلسات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatSessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد جلسات نشطة حالياً</p>
                  ) : (
                    chatSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">جلسة #{session.id}</h3>
                          <p className="text-sm text-gray-600">
                            المستخدمان: {session.userId} ↔ {session.partnerId}
                          </p>
                          <p className="text-sm text-gray-600">
                            الدولة: {session.country} | بدأت: {new Date(session.startedAt).toLocaleString('ar')}
                          </p>
                        </div>
                        <Button
                          onClick={() => monitorSession(session.id)}
                          className="bg-orange-500 hover:bg-orange-600"
                          size="sm"
                        >
                          <Eye className="mr-2" size={16} />
                          مراقبة
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>البلاغات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد بلاغات</p>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-600">بلاغ #{report.id}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>من:</strong> {report.reporter?.firstName || report.reporter?.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>ضد:</strong> {report.reported?.firstName || report.reported?.email}
                            </p>
                            <p className="text-sm text-gray-800 mt-2">
                              <strong>السبب:</strong> {report.reason}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(report.createdAt).toLocaleString('ar')}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="destructive">
                              <Ban className="mr-1" size={16} />
                              حظر
                            </Button>
                            <Button size="sm" variant="outline">
                              <CheckCircle className="mr-1" size={16} />
                              تم التعامل
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}