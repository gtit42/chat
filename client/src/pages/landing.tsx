import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Globe, Shield, Zap, Crown, Play } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Video className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ChatConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                عربي
              </Button>
              <Button asChild>
                <a href="/api/login">تسجيل الدخول</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              تواصل مع العالم
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                بدردشة فيديو عشوائية
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              اكتشف أشخاص جدد من حول العالم، اختر دولتك المفضلة وابدأ محادثات فيديو ممتعة وآمنة
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <a href="/api/login">
                  <Play className="mr-2" size={20} />
                  ابدأ الدردشة مجاناً
                </a>
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-primary text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary hover:text-white transition-all duration-200"
                asChild
              >
                <Link href="/subscribe">
                  <Crown className="mr-2" size={20} />
                  احصل على المميزات الإضافية
                </Link>
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">اختيار الدولة</h3>
                  <p className="text-gray-600">
                    اختر من أكثر من 190 دولة للتواصل مع أشخاص من الثقافات التي تفضلها
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-secondary to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">آمن ومحمي</h3>
                  <p className="text-gray-600">
                    تشفير end-to-end لجميع المحادثات مع إمكانية الإبلاغ والحظر
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-accent to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">اتصال فوري</h3>
                  <p className="text-gray-600">
                    تقنية WebRTC للحصول على أفضل جودة فيديو وصوت في الوقت الفعلي
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
