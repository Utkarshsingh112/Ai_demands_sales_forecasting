import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { CheckCircle, Mail, KeyRound, Lock } from 'lucide-react';

type Step = 'email' | 'otp';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = trpc.auth.forgotPassword.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await sendOtp.mutateAsync({ email });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Try again.');
    }
  };

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 2: verify OTP + set new password ─────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    try {
      await resetPassword.mutateAsync({ email, otp: otpStr, newPassword });
      setDone(true);
      setTimeout(() => setLocation('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-10 text-center max-w-md w-full space-y-4">
          <CheckCircle className="w-14 h-14 text-accent mx-auto" />
          <h2 className="text-2xl font-serif font-bold">Password updated!</h2>
          <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold mb-2">ForecastIQ</h1>
          <p className="text-muted-foreground font-serif">
            {step === 'email' ? 'Reset your password' : 'Check your email'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {(['email', 'otp'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-sm ${step === s ? 'text-foreground' : step === 'otp' && s === 'email' ? 'text-accent' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s ? 'border-accent bg-accent/10 text-accent' : step === 'otp' && s === 'email' ? 'border-accent bg-accent text-white' : 'border-border/50'}`}>
                  {step === 'otp' && s === 'email' ? '✓' : i + 1}
                </div>
                <span className="hidden sm:inline">{s === 'email' ? 'Enter email' : 'Set new password'}</span>
              </div>
              {i < 1 && <div className="flex-1 h-px bg-border/40" />}
            </React.Fragment>
          ))}
        </div>

        <Card className="p-8 space-y-6">
          {/* ── STEP 1 ── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  Enter the email address on your account and we'll send you a 6-digit reset code.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={sendOtp.isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sendOtp.isPending}>
                {sendOtp.isPending ? 'Sending code…' : 'Send Reset Code'}
              </Button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 'otp' && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>.
                  Enter it below along with your new password.
                </p>
              </div>

              {/* OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Verification Code</label>
                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-mono font-bold border-2 border-border rounded-lg bg-background text-foreground focus:border-accent focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />New Password
                </label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  disabled={resetPassword.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={resetPassword.isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? 'Updating password…' : 'Reset Password'}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']); }}
              >
                Didn't receive a code? Send again
              </button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login">
              <span className="text-accent font-medium transition-colors cursor-pointer">Sign in</span>
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
