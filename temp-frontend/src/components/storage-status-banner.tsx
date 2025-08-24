import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Database, HardDrive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface StorageStatus {
  type: "database" | "memory";
  persistent: boolean;
  connected: boolean;
  warning?: string;
}

export function StorageStatusBanner() {
  const { data: storageStatus } = useQuery({
    queryKey: ["/api/storage-status"],
    queryFn: async (): Promise<StorageStatus> => {
      const response = await apiRequest("GET", "/api/storage-status");
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Don't show anything if database is connected
  if (!storageStatus || storageStatus.type === "database") {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <HardDrive className="h-4 w-4" />
        <span className="font-medium">Temporary Storage Active:</span>
        <span>
          Your data is stored temporarily and will not persist between sessions. 
          Database connection issues detected - working to restore full functionality.
        </span>
      </AlertDescription>
    </Alert>
  );
} 