import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: implement actual password reset logic
    setTimeout(() => {
      setMessage('If an account exists with that email, a password reset link has been sent.');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold mb-2">ForecastIQ</h1>
          <p className="text-muted-foreground font-serif">Reset your password</p>
        </div>

        {/* Card */}
        <Card className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Message */}
            {message && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          {/* Back to Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login">
              <span className="text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer">
                Sign in
              </span>
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
