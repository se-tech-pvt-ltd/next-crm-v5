import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Forbidden() {
  const [seconds, setSeconds] = useState(5);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      setLocation('/');
    }
  }, [seconds, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">403 Access Denied</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You don’t have permission to view this page.
          </p>
          <p className="mt-4 text-sm text-gray-700">
            Redirecting to dashboard in <span className="font-semibold">{Math.max(seconds, 0)}</span>...
          </p>
          <button
            onClick={() => setLocation('/')}
            className="mt-4 inline-flex items-center px-3 py-1.5 rounded bg-primary text-white text-sm hover:opacity-90"
          >
            Go to Dashboard now
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
