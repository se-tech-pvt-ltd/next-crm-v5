import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import * as NotificationsService from '@/services/notifications';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Mail, User, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const forgotSchema = z.object({ email: z.string().email('Please enter a valid email address') });

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ForgotForm) => {
    try {
      await NotificationsService.forgotPassword(data.email);
      toast({ title: 'Request received', description: 'If an account with that email exists, we have sent instructions to reset the password.' });
      setLocation('/login');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to submit request', variant: 'destructive' });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-stretch">
      <div className="w-full h-screen bg-white overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left art panel */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#223E7D] to-[#375aa0] p-10 text-white h-full">
          <div className="rounded-full bg-white/10 p-6 mb-6">
            <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-16 h-16 text-white/90" />
            </div>
          </div>

          <h3 className="text-2xl font-semibold">Forgot your password?</h3>
          <p className="mt-3 text-center text-white/90 max-w-xs">No worries — happens to the best of us. Enter your email and we'll send a magic reset link.</p>

          <div className="mt-6 flex items-center space-x-3 text-sm text-white/90">
            <HelpCircle className="w-5 h-5" />
            <span>Tip: Check spam if you don't see the email.</span>
          </div>

          <div className="mt-8 text-xs text-white/80 opacity-90 text-center max-w-xs">
            <em>Pro tip:</em> Use the same email you signed up with — or ask your admin for help if you're still stuck.
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 md:p-10 flex items-center h-full">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Forgot password</h2>
              <p className="text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-busy={isSubmitting}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <InputWithIcon
                          leftIcon={<Mail className="w-5 h-5" />}
                          {...field}
                          type="email"
                          placeholder="your.name@example.com"
                          autoComplete="email"
                          inputMode="email"
                          disabled={isSubmitting}
                          className="h-12 border-gray-300 focus:border-[#223E7D] focus:ring-[#223E7D] bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <Button type="submit" className="bg-[#223E7D] text-white" disabled={isSubmitting}>
                    {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>) : 'Send reset link'}
                  </Button>
                  <button type="button" className="text-sm text-gray-500 hover:underline" onClick={() => setLocation('/login')}>Back to sign in</button>
                </div>
              </form>
            </Form>

            <div className="mt-6 text-xs text-gray-500 text-center">
              <span>If you continue to have trouble, contact your administrator.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
