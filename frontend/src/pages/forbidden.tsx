import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">403 Access Denied</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You don’t have permission to view this page. Please contact your administrator if you believe this is a mistake.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
