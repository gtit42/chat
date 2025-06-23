import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Users, UserX, Shield, Activity, AlertTriangle, Crown, 
  Ban, CheckCircle, XCircle, Eye, MessageSquare, Server,
  TrendingUp, Globe, Clock, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { COUNTRIES, getCountryName } from "@shared/countries";

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

interface AdminAction {
  id: number;
  action: string;
  targetUserId?: string;
  reason?: string;
  details?: any;
  createdAt: string;
  admin: {
    email: string;
    firstName: string;
  };
}

interface Report {
  id: number;
  reason: string;
  status: string;
  adminAction?: string;
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

interface ServerStats {
  totalUsers: number;
  activeChats: number;
  queueStats: { [countryCode: string]: number };
  serverPools: any[];
}

export default function EnhancedAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null);

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
  });

  const { data: adminActions = [] } = useQuery({
    queryKey: ["/api/admin/actions"],
  });

  const { data: serverStats } = useQuery({
    queryKey: ["/api/admin/server-stats"],
    refetchInterval: 30000, // كل 30 ثانية
  });

  // Mutations
  const banUserMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string; duration?: number }) =>
      apiRequest("POST", "/api/admin/ban-user", data),
    onSuccess: () => {
      toast({
        title: "تم حظر المستخدم",
        description: "تم حظر المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/actions"] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("POST", "/api/admin/unban-user", { userId }),
    onSuccess: () => {
      toast({
        title: "تم إلغاء حظر المستخدم",
        description: "تم إلغاء حظر المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/actions"] });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { userId: string; isAdmin?: boolean; canPromoteUsers?: boolean }) =>
      apiRequest("PUT", "/api/admin/users/permissions", data),
    onSuccess: () => {
      toast({
        title: "تم تحديث الصلاحيات",
        description: "تم تحديث صلاحيات المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const reviewReportMutation = useMutation({
    mutationFn: (data: { reportId: number; status: string; adminAction: string }) =>
      apiRequest("POST", "/api/admin/review-report", data),
    onSuccess: () => {
      toast({
        title: "تم مراجعة البلاغ",
        description: "تم مراجعة البلاغ وتسجيل الإجراء",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/actions"] });
    },
  });

  const createServerPoolMutation = useMutation({
    mutationFn: (data: { region: string; countries: string[]; capacity: number }) =>
      apiRequest("POST", "/api/admin/server-pools", data),
    onSuccess: () => {
      toast({
        title: "تم إنشاء مجموعة سيرفرات",
        description: "تم إنشاء مجموعة السيرفرات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/server-stats"] });
    },
  });

  const handleBanUser = (user: User) => {
    if (!banReason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سبب الحظر",
        variant: "destructive",
      });
      return;
    }

    banUserMutation.mutate({
      userId: user.id,
      reason: banReason,
      duration: banDuration || undefined,
    });

    setBanReason("");
    setBanDuration(null);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة الإدارة المتقدمة
          </h1>
          <p className="text-gray-600">
            إدارة شاملة للمستخدمين والنظام والسيرفرات
          </p>
        </div>

        {/* إحصائيات السيرفر */}
        {serverStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{serverStats.totalUsers}</p>
                  </div>
                  <Users className="text-blue-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">المحادثات النشطة</p>
                    <p className="text-2xl font-bold">{serverStats.activeChats}</p>
                  </div>
                  <MessageSquare className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">مجموعات السيرفرات</p>
                    <p className="text-2xl font-bold">{serverStats.serverPools.length}</p>
                  </div>
                  <Server className="text-purple-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">الدول النشطة</p>
                    <p className="text-2xl font-bold">
                      {Object.keys(serverStats.queueStats || {}).length}
                    </p>
                  </div>
                  <Globe className="text-orange-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Users className="mr-2" size={16} />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="mr-2" size={16} />
              البلاغات
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Activity className="mr-2" size={16} />
              سجل الإجراءات
            </TabsTrigger>
            <TabsTrigger value="servers">
              <Server className="mr-2" size={16} />
              السيرفرات
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="mr-2" size={16} />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* تبويب المستخدمين */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                          {user.isAdmin && <Badge variant="destructive">أدمن</Badge>}
                          {user.isSubscribed && <Badge>مشترك</Badge>}
                          {user.isBanned && <Badge variant="secondary">محظور</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          انضم في: {new Date(user.createdAt).toLocaleDateString('ar')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* تبديل صلاحية الأدمن */}
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">أدمن</Label>
                          <Switch
                            checked={user.isAdmin}
                            onCheckedChange={(checked) =>
                              updatePermissionsMutation.mutate({
                                userId: user.id,
                                isAdmin: checked,
                              })
                            }
                          />
                        </div>

                        {/* زر الحظر/إلغاء الحظر */}
                        {user.isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanUserMutation.mutate(user.id)}
                          >
                            <UserCheck className="mr-1" size={16} />
                            إلغاء الحظر
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Ban className="mr-1" size={16} />
                                حظر
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حظر المستخدم</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حظر {user.firstName} {user.lastName}؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>سبب الحظر</Label>
                                  <Textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="اكتب سبب الحظر..."
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>مدة الحظر (بالساعات)</Label>
                                  <Input
                                    type="number"
                                    value={banDuration || ""}
                                    onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="اتركه فارغاً للحظر الدائم"
                                  />
                                </div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => selectedUser && handleBanUser(selectedUser)}>
                                  حظر المستخدم
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب البلاغات */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>مراجعة البلاغات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report: Report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">
                            بلاغ ضد: {report.reported.firstName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            من: {report.reporter.firstName} ({report.reporter.email})
                          </p>
                        </div>
                        <Badge variant={
                          report.status === "pending" ? "secondary" :
                          report.status === "reviewed" ? "default" : "destructive"
                        }>
                          {report.status === "pending" ? "معلق" :
                           report.status === "reviewed" ? "تمت المراجعة" : "محلول"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-2">السبب: {report.reason}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        تاريخ البلاغ: {new Date(report.createdAt).toLocaleDateString('ar')}
                      </p>

                      {report.adminAction && (
                        <p className="text-sm text-blue-600 mb-2">
                          إجراء الأدمن: {report.adminAction}
                        </p>
                      )}

                      {report.status === "pending" && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => reviewReportMutation.mutate({
                              reportId: report.id,
                              status: "reviewed",
                              adminAction: "تم رفض البلاغ - لا يوجد مخالفة"
                            })}
                          >
                            <XCircle className="mr-1" size={16} />
                            رفض
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewReportMutation.mutate({
                              reportId: report.id,
                              status: "resolved",
                              adminAction: "تم قبول البلاغ وتنفيذ إجراء"
                            })}
                          >
                            <CheckCircle className="mr-1" size={16} />
                            قبول وتنفيذ إجراء
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب سجل الإجراءات */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>سجل الإجراءات الإدارية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminActions.map((action: AdminAction) => (
                    <div key={action.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {action.action === "ban_user" ? "حظر مستخدم" :
                             action.action === "unban_user" ? "إلغاء حظر مستخدم" :
                             action.action === "review_report" ? "مراجعة بلاغ" :
                             action.action}
                          </p>
                          <p className="text-sm text-gray-600">
                            بواسطة: {action.admin?.firstName} ({action.admin?.email})
                          </p>
                          {action.reason && (
                            <p className="text-sm text-gray-600">السبب: {action.reason}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(action.createdAt).toLocaleString('ar')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب السيرفرات */}
          <TabsContent value="servers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات قوائم الانتظار</CardTitle>
                </CardHeader>
                <CardContent>
                  {serverStats?.queueStats && (
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(serverStats.queueStats).map(([countryCode, count]) => (
                        <div key={countryCode} className="p-3 border rounded-lg">
                          <div className="flex justify-between">
                            <span className="font-semibold">{getCountryName(countryCode)}</span>
                            <Badge>{count} في الانتظار</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>مجموعات السيرفرات</CardTitle>
                </CardHeader>
                <CardContent>
                  {serverStats?.serverPools && (
                    <div className="space-y-3">
                      {serverStats.serverPools.map((pool: any) => (
                        <div key={pool.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{pool.region}</h3>
                              <p className="text-sm text-gray-600">
                                الحمولة: {pool.currentLoad}/{pool.capacity}
                              </p>
                            </div>
                            <Badge variant={pool.isActive ? "default" : "secondary"}>
                              {pool.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب التحليلات */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>المستخدمين المشتركين</span>
                      <span className="font-semibold">
                        {users.filter((u: User) => u.isSubscribed).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>المستخدمين المحظورين</span>
                      <span className="font-semibold">
                        {users.filter((u: User) => u.isBanned).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الأدمنز</span>
                      <span className="font-semibold">
                        {users.filter((u: User) => u.isAdmin).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات البلاغات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>البلاغات المعلقة</span>
                      <span className="font-semibold">
                        {reports.filter((r: Report) => r.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>البلاغات المراجعة</span>
                      <span className="font-semibold">
                        {reports.filter((r: Report) => r.status === "reviewed").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>البلاغات المحلولة</span>
                      <span className="font-semibold">
                        {reports.filter((r: Report) => r.status === "resolved").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}