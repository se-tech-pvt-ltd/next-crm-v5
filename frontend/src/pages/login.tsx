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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const user = await response.json();
        onLogin({
          id: user.id,
          email: user.email,
          role: user.role,
          branch: user.branchId,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center p-2">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">SetCrm</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Sign in to your account to access the system
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="flex items-center space-x-1.5 text-sm">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Address</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        className="h-9"
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
                  <FormItem className="space-y-1">
                    <FormLabel className="flex items-center space-x-1.5 text-sm">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Password</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        className="h-9"
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
                className="w-full h-9 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>


        </CardContent>
      </Card>
    </div>
  );
}
