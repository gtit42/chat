import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoInterface } from "@/components/video-interface";
import { PermissionRequest } from "@/components/permission-request";
import { X, Globe, Crown, Wifi } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { COUNTRIES } from "@shared/countries";

export default function VideoChat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [hasPermissions, setHasPermissions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("any");
  const [isSearching, setIsSearching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("منقطع");

  const { 
    localStream, 
    remoteStream, 
    isConnected, 
    startCall, 
    endCall,
    toggleMute,
    toggleCamera,
    isMuted,
    isCameraOff 
  } = useWebRTC();

  const { sendMessage, isConnected: wsConnected } = useWebSocket();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("متصل");
    } else if (wsConnected) {
      setConnectionStatus("في الانتظار");
    } else {
      setConnectionStatus("منقطع");
    }
  }, [isConnected, wsConnected]);

  const handleRequestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setHasPermissions(true);
      toast({
        title: "تم منح الإذن",
        description: "يمكنك الآن بدء الدردشة",
      });
    } catch (error) {
      toast({
        title: "فشل في الإذن",
        description: "نحتاج إذن الوصول إلى الكاميرا والميكروفون",
        variant: "destructive",
      });
    }
  };

  const handleStartChat = async () => {
    if (!user?.isSubscribed && selectedCountry !== "any") {
      toast({
        title: "ترقية مطلوبة",
        description: "اختيار الدولة متاح للأعضاء المميزين فقط",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      await apiRequest("POST", "/api/chat/start", { country: selectedCountry });
      if (sendMessage && user) {
        sendMessage({
          type: 'auth',
          userId: user.id
        });
      }
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
        description: "فشل في بدء الدردشة",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextUser = () => {
    endCall();
    handleStartChat();
  };

  const handleReportUser = async () => {
    // TODO: Implement reporting logic
    toast({
      title: "تم الإبلاغ",
      description: "شكراً لك على الإبلاغ",
    });
    handleNextUser();
  };

  const handleEndChat = async () => {
    try {
      await apiRequest("POST", "/api/chat/end");
      endCall();
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
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Top Control Bar */}
      <div className="bg-dark/90 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <X className="text-gray-300 hover:text-white" size={20} />
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "متصل" ? "bg-green-500 animate-pulse" :
                connectionStatus === "في الانتظار" ? "bg-yellow-500 animate-pulse" :
                "bg-red-500"
              }`} />
              <span className="text-white font-medium">{connectionStatus}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px] bg-gray-800 text-white border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="any">
                  <div className="flex items-center space-x-2">
                    <span>🌍</span>
                    <span>جميع الدول</span>
                  </div>
                </SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center space-x-2">
                      <span>🌐</span>
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!user?.isSubscribed && (
              <Button 
                size="sm"
                className="bg-gradient-to-r from-secondary to-pink-500 text-white hover:shadow-lg"
                asChild
              >
                <Link href="/subscribe">
                  <Crown className="mr-1" size={16} />
                  ترقية
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {!hasPermissions ? (
            <PermissionRequest onRequestPermissions={handleRequestPermissions} />
          ) : (
            <VideoInterface
              localStream={localStream}
              remoteStream={remoteStream}
              isConnected={isConnected}
              isSearching={isSearching}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              onStartChat={handleStartChat}
              onNextUser={handleNextUser}
              onReportUser={handleReportUser}
              onEndChat={handleEndChat}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
            />
          )}
        </div>
      </div>
    </div>
  );
}
