import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Check } from "lucide-react";

interface PermissionRequestProps {
  onRequestPermissions: () => void;
}

export function PermissionRequest({ onRequestPermissions }: PermissionRequestProps) {
  return (
    <div className="text-center py-16">
      <Card className="bg-white/10 backdrop-blur-sm max-w-md mx-auto">
        <CardContent className="p-12">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="text-white" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">نحتاج إذن الوصول</h3>
          <p className="text-gray-300 mb-8">
            للبدء في الدردشة، نحتاج إذن الوصول إلى الكاميرا والميكروفون
          </p>
          <Button 
            onClick={onRequestPermissions}
            className="bg-accent text-white hover:bg-green-600"
            size="lg"
          >
            <Check className="mr-2" size={20} />
            منح الإذن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
