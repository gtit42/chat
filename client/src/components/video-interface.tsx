import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  SkipForward, 
  Flag, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Play
} from "lucide-react";

interface VideoInterfaceProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isSearching: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  onStartChat: () => void;
  onNextUser: () => void;
  onReportUser: () => void;
  onEndChat: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export function VideoInterface({
  localStream,
  remoteStream,
  isConnected,
  isSearching,
  isMuted,
  isCameraOff,
  onStartChat,
  onNextUser,
  onReportUser,
  onEndChat,
  onToggleMute,
  onToggleCamera,
}: VideoInterfaceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!localStream) {
    return (
      <div className="text-center py-16">
        <Card className="bg-white/10 backdrop-blur-sm max-w-md mx-auto">
          <div className="p-12">
            <h3 className="text-2xl font-bold text-white mb-4">جاري الإعداد...</h3>
            <p className="text-gray-300 mb-8">انتظر قليلاً أثناء إعداد الكاميرا</p>
            <Button onClick={onStartChat} className="bg-primary text-white" size="lg">
              <Play className="mr-2" size={20} />
              ابدأ الدردشة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Remote User Video */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="text-gray-400" size={40} />
                </div>
                <p className="text-white text-lg">
                  {isSearching ? "البحث عن شخص..." : "لا يوجد اتصال"}
                </p>
              </div>
            </div>
          )}

          {/* User info overlay */}
          {isConnected && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌍</span>
                <span className="text-white font-medium">مستخدم عشوائي</span>
              </div>
            </div>
          )}

          {/* Connection status */}
          {isConnected && (
            <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">HD</span>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isSearching && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">البحث عن شخص جديد...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local User Video */}
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Self label */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-white font-medium">أنت</span>
          </div>

          {/* Video controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm rounded-full px-4 py-3">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "secondary"}
                onClick={onToggleMute}
                className="w-12 h-12 rounded-full"
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              <Button
                size="sm"
                variant={isCameraOff ? "destructive" : "secondary"}
                onClick={onToggleCamera}
                className="w-12 h-12 rounded-full"
              >
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        {!isConnected && !isSearching ? (
          <Button 
            onClick={onStartChat}
            className="bg-accent hover:bg-green-600 text-white px-8 py-3 font-semibold"
            size="lg"
          >
            <Play className="mr-2" size={20} />
            ابدأ الدردشة
          </Button>
        ) : (
          <>
            <Button 
              onClick={onNextUser}
              className="bg-accent hover:bg-green-600 text-white px-8 py-3 font-semibold"
              size="lg"
            >
              <SkipForward className="mr-2" size={20} />
              التالي
            </Button>
            <Button 
              onClick={onReportUser}
              variant="destructive"
              className="px-6 py-3 font-semibold"
              size="lg"
            >
              <Flag className="mr-2" size={20} />
              إبلاغ
            </Button>
            <Button 
              onClick={onEndChat}
              variant="secondary"
              className="px-6 py-3 font-semibold"
              size="lg"
            >
              <PhoneOff className="mr-2" size={20} />
              إنهاء
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
