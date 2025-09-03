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
import { GraduationCap, Mail, Lock, AlertCircle, Eye, EyeOff, BookOpen, Users, BarChart3, Shield } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
      const user = await (await import('@/services/auth')).login(data);
      onLogin({
        id: user.id,
        email: user.email,
        role: user.role,
        branch: user.branchId,
      });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main role="main" className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <aside aria-label="Branding" className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern (decorative) */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-white rounded-full"></div>
        </div>

        {/* Logo and Title */}
        <header className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center" aria-hidden="true">
              <GraduationCap className="w-7 h-7 text-blue-600" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-white">SetCrm</h1>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Streamline Your<br />
              Education Management
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Comprehensive solution for student admissions, lead tracking,
              and institutional management all in one powerful platform.
            </p>
          </div>
        </header>

        {/* Features */}
        <ul className="relative z-10 grid grid-cols-2 gap-6" aria-label="Key features">
          <li className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Course Management</h3>
              <p className="text-blue-100 text-sm">Organize programs & curriculum</p>
            </div>
          </li>

          <li className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
              <Users className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Student Portal</h3>
              <p className="text-blue-100 text-sm">Manage enrollments & data</p>
            </div>
          </li>

          <li className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
              <BarChart3 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Analytics & Reports</h3>
              <p className="text-blue-100 text-sm">Data-driven insights</p>
            </div>
          </li>

          <li className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Secure Access</h3>
              <p className="text-blue-100 text-sm">Role-based permissions</p>
            </div>
          </li>
        </ul>
      </aside>

      {/* Right Side - Login Form */}
      <section aria-labelledby="login-title" className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center" aria-hidden="true">
                <GraduationCap className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SetCrm</h1>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 id="login-title" className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Please sign in to your account to continue</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-describedby={error ? "login-error" : undefined} aria-busy={isLoading}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            inputMode="email"
                            className="h-12 pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                          />
                        </div>
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
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="h-12 pl-10 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-pressed={showPassword}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" aria-hidden="true" />
                            ) : (
                              <Eye className="w-5 h-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    aria-label="Forgot password"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <Alert id="login-error" variant="destructive" className="bg-red-50 border-red-200 text-red-800" aria-live="assertive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2" aria-live="polite">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <button className="text-blue-600 hover:text-blue-500 font-medium" aria-label="Contact Administrator">
                  Contact Administrator
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
