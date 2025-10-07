import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Lock, ShieldCheck } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Button } from '@/components/ui/button';
import { resetPassword, verifyResetToken } from '@/services/auth';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

type VerificationStatus = 'loading' | 'valid' | 'invalid';

const ResetPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [status, setStatus] = React.useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState<{ email: string; token: string }>({ email: '', token: '' });

  React.useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    setQuery({
      email: (params.get('email') || '').trim(),
      token: (params.get('token') || '').trim(),
    });
  }, [location]);

  React.useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!query.email || !query.token) {
        if (isMounted) {
          setStatus('invalid');
          setErrorMessage('Reset link is invalid. Please request a new one.');
        }
        return;
      }

      try {
        setStatus('loading');
        const response = await verifyResetToken(query.email, query.token);
        if (!isMounted) return;
        setExpiresAt(response?.expiresAt ?? null);
        setStatus('valid');
        setErrorMessage('');
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('invalid');
        setErrorMessage(err?.message || 'Reset link is invalid or has expired.');
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [query.email, query.token]);

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetForm) => {
    try {
      await resetPassword({
        email: query.email,
        token: query.token,
        password: values.password,
      });
      toast({
        title: 'Password updated',
        description: 'Your password has been reset. You can now sign in.',
      });
      setLocation('/login');
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: err?.message || 'Unable to reset password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const isFormDisabled = status !== 'valid' || isSubmitting;

  return (
    <main className="min-h-screen bg-gray-50 flex items-stretch">
      <div className="w-full h-screen bg-white overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1d4ed8] p-10 text-white h-full">
          <div className="rounded-full bg-white/10 p-6 mb-6">
            <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-16 h-16 text-white/90" />
            </div>
          </div>

          <h3 className="text-2xl font-semibold">Secure your account</h3>
          <p className="mt-3 text-center text-white/90 max-w-xs">
            Choose a strong password to keep your account protected. Make sure it&apos;s unique to this system.
          </p>

          {expiresAt ? (
            <div className="mt-6 text-sm text-white/80 text-center">
              <p>Reset link expires at:</p>
              <p className="font-semibold">{new Date(expiresAt).toLocaleString()}</p>
            </div>
          ) : (
            <div className="mt-6 text-sm text-white/80 text-center">
              <p>Reset links remain active for one hour from when they are requested.</p>
            </div>
          )}

          <div className="mt-8 text-xs text-white/80 opacity-90 text-center max-w-xs">
            Use a mix of letters, numbers, and symbols. Avoid passwords you reuse elsewhere.
          </div>
        </div>

        <div className="p-8 md:p-10 flex items-center h-full">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
              <p className="text-gray-600">Set a new password for {query.email || 'your account'}.</p>
            </div>

            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-3 py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1d4ed8]"></div>
                <p className="text-gray-600">Verifying reset link...</p>
              </div>
            )}

            {status === 'invalid' && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Reset link cannot be used</h3>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setLocation('/forgot-password')}
                >
                  Request a new link
                </Button>
              </div>
            )}

            {status === 'valid' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">New password</FormLabel>
                        <FormControl>
                          <InputWithIcon
                            leftIcon={<Lock className="w-5 h-5" />}
                            {...field}
                            type="password"
                            placeholder="Enter your new password"
                            autoComplete="new-password"
                            className="h-12 border-gray-300 focus:border-[#1d4ed8] focus:ring-[#1d4ed8] bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Confirm password</FormLabel>
                        <FormControl>
                          <InputWithIcon
                            leftIcon={<Lock className="w-5 h-5" />}
                            {...field}
                            type="password"
                            placeholder="Re-enter your new password"
                            autoComplete="new-password"
                            className="h-12 border-gray-300 focus:border-[#1d4ed8] focus:ring-[#1d4ed8] bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-[#1d4ed8] text-white" disabled={isFormDisabled}>
                    {isSubmitting ? 'Updating password...' : 'Update password'}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-sm text-gray-500 text-center">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setLocation('/login')}
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
