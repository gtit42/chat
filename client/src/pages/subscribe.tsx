import { useState, useEffect } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, X, ArrowRight, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Use a test publishable key for development
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "فشل في الدفع",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "نجح الدفع!",
        description: "مرحباً بك في العضوية المميزة!",
      });
    }

    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 font-semibold"
        size="lg"
      >
        {isProcessing ? (
          "جاري المعالجة..."
        ) : (
          <>
            <CreditCard className="mr-2" size={20} />
            دفع آمن - $3.00
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.isSubscribed) {
      toast({
        title: "مشترك بالفعل",
        description: "أنت مشترك بالفعل في العضوية المميزة",
      });
      return;
    }

    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء الاشتراك",
          variant: "destructive",
        });
      });
  }, [user, toast]);

  if (user?.isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-50 to-secondary/10 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">مشترك بالفعل!</h2>
            <p className="text-gray-600 mb-6">أنت مشترك بالفعل في العضوية المميزة</p>
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
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/">
              <ArrowRight className="mr-2" size={16} />
              العودة للصفحة الرئيسية
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">اختر خطتك المناسبة</h1>
          <p className="text-xl text-gray-600">احصل على مميزات إضافية لتجربة أفضل</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Free Plan */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">المجاني</CardTitle>
              <div className="text-4xl font-bold text-gray-900">
                $0<span className="text-lg text-gray-600">/شهر</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>دردشة فيديو أساسية</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>دولة واحدة فقط</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>5 دقائق كحد أقصى</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <X className="text-red-400 mr-3" size={20} />
                  <span>مع إعلانات</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/video-chat">ابدأ مجاناً</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="shadow-2xl border-4 border-primary/20 relative bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-semibold">
                الأكثر شعبية
              </span>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">المميز</CardTitle>
              <div className="text-4xl font-bold text-gray-900">
                $3<span className="text-lg text-gray-600">/شهر</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>دردشة فيديو HD</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>جميع الدول (190+)</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>وقت غير محدود</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>بدون إعلانات</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>فلاتر متقدمة</span>
                </li>
              </ul>

              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              ) : (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-600 mt-2">جاري التحضير...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">طرق الدفع المقبولة:</p>
          <div className="flex justify-center space-x-6">
            <div className="text-blue-600 text-3xl">💳</div>
            <div className="text-red-500 text-3xl">💳</div>
            <div className="text-blue-500 text-3xl">💰</div>
            <div className="text-gray-800 text-3xl">🍎</div>
          </div>
        </div>
      </div>
    </div>
  );
}
