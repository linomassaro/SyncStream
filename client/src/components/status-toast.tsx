import { useEffect, useState } from "react";
import { X, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusToastProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isVisible: boolean;
  onDismiss?: () => void;
}

export function StatusToast({ status, isVisible, onDismiss }: StatusToastProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (status === 'connected' && show) {
      // Auto-dismiss success message after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, show, onDismiss]);

  if (!show) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />,
          message: 'Connecting to sync server...',
          bgColor: 'bg-warning',
          textColor: 'text-warning'
        };
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          message: 'Connected and synced',
          bgColor: 'bg-success',
          textColor: 'text-success'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          message: 'Disconnected from sync server',
          bgColor: 'bg-warning',
          textColor: 'text-warning'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          message: 'Connection error - trying to reconnect...',
          bgColor: 'bg-error',
          textColor: 'text-error'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          message: 'Unknown status',
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-500'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 surface-variant border border-gray-600 rounded-lg px-4 py-3 shadow-xl z-50 flex items-center space-x-3 min-w-[300px]">
      <div className={`${config.bgColor} rounded-full p-1 flex-shrink-0`}>
        <div className="text-white">
          {config.icon}
        </div>
      </div>
      <span className="text-sm on-surface flex-1">{config.message}</span>
      <Button
        onClick={() => {
          setShow(false);
          onDismiss?.();
        }}
        variant="ghost"
        size="sm"
        className="p-1 hover:bg-gray-700 rounded"
      >
        <X className="h-3 w-3 on-surface-variant" />
      </Button>
    </div>
  );
}
