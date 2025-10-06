import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import * as NotificationsService from '@/services/notifications';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const forgotSchema = z.object({ email: z.string().email('Please enter a valid email address') });

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

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
    <main className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Forgot password</h2>
          <p className="text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Enter your email"
                      autoComplete="email"
                      inputMode="email"
                      className="h-12 border-gray-300 focus:border-[#223E7D] focus:ring-[#223E7D] bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#223E7D] text-white">Send reset link</Button>
            </div>
          </form>
        </Form>

      </div>
    </main>
  );
}
