import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLogin: (userData: { id: string; email: string; role: string; branch?: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - in real app, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication logic
      const mockUsers = [
        { id: '1', email: 'admin@studybridge.com', password: 'admin123', role: 'admin_staff' },
        { id: '2', email: 'manager@studybridge.com', password: 'manager123', role: 'branch_manager', branch: 'branch_alpha' },
        { id: '3', email: 'counselor@studybridge.com', password: 'counselor123', role: 'counselor', branch: 'branch_beta' },
      ];

      const user = mockUsers.find(u => u.email === data.email && u.password === data.password);

      if (user) {
        onLogin({
          id: user.id,
          email: user.email,
          role: user.role,
          branch: user.branch,
        });
      } else {
        setError('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">StudyBridge CRM</CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your account to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="Enter your email"
                        className="pl-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="Enter your password"
                        className="pl-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p><strong>Admin:</strong> admin@studybridge.com / admin123</p>
              <p><strong>Manager:</strong> manager@studybridge.com / manager123</p>
              <p><strong>Counselor:</strong> counselor@studybridge.com / counselor123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}