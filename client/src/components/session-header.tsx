import { Play, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SessionHeaderProps {
  sessionId: string;
  syncStatus: 'synced' | 'syncing' | 'error';
}

export function SessionHeader({ sessionId, syncStatus }: SessionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy session ID:', error);
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-success';
      case 'syncing':
        return 'bg-warning';
      case 'error':
        return 'bg-error';
      default:
        return 'bg-gray-500';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="relative z-50 surface-variant/90 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold on-surface">SyncStream</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 text-sm on-surface-variant">
            <span>Session:</span>
            <div className="flex items-center space-x-2">
              <code className="surface px-2 py-1 rounded text-xs font-mono">
                {sessionId}
              </code>
              <Button
                onClick={handleCopySessionId}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sync Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${getSyncStatusColor()} rounded-full ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`}></div>
            <span className={`text-sm ${
              syncStatus === 'synced' ? 'text-success' : 
              syncStatus === 'syncing' ? 'text-warning' : 
              'text-error'
            }`}>
              {getSyncStatusText()}
            </span>
          </div>
          

        </div>
      </div>
      
      {/* Mobile Session ID */}
      <div className="md:hidden mt-2 flex items-center space-x-2 text-sm on-surface-variant">
        <span>Session:</span>
        <div className="flex items-center space-x-2">
          <code className="surface px-2 py-1 rounded text-xs font-mono">
            {sessionId}
          </code>
          <Button
            onClick={handleCopySessionId}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-700"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
