import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Mail, KeyRound, CheckCircle } from 'lucide-react';

type Step = 'details' | 'otp';

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const trpcUtils = trpc.useUtils();
  const sendOtpMutation = trpc.auth.sendRegistrationOtp.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const profileMutation = trpc.profile.update.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Step 1: validate form + send OTP ─────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      await sendOtpMutation.mutateAsync({ email: formData.email });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
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

  // ── Step 2: verify OTP + register ─────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the full 6-digit code.'); return; }

    try {
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.businessName,
        otp: otpStr,
      });
      if (formData.businessName) {
        await profileMutation.mutateAsync({ businessName: formData.businessName }).catch(() => {});
      }
      await trpcUtils.auth.me.invalidate();
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold mb-2">ForecastIQ</h1>
          <p className="text-muted-foreground font-serif">Create your free account</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {(['details', 'otp'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-sm ${step === s ? 'text-foreground' : step === 'otp' && s === 'details' ? 'text-accent' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s ? 'border-accent bg-accent/10 text-accent' : step === 'otp' && s === 'details' ? 'border-accent bg-accent text-white' : 'border-border/50'}`}>
                  {step === 'otp' && s === 'details' ? '✓' : i + 1}
                </div>
                <span className="hidden sm:inline">{s === 'details' ? 'Your details' : 'Verify email'}</span>
              </div>
              {i < 1 && <div className="flex-1 h-px bg-border/40" />}
            </React.Fragment>
          ))}
        </div>

        <Card className="p-8 space-y-6">
          {/* ── STEP 1: Fill in details ── */}
          {step === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Business Name</label>
                <Input
                  type="text"
                  name="businessName"
                  placeholder="Your Business"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  disabled={sendOtpMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={sendOtpMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={sendOtpMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={sendOtpMutation.isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sendOtpMutation.isPending}>
                <Mail className="w-4 h-4 mr-2" />
                {sendOtpMutation.isPending ? 'Sending code…' : 'Send Verification Code'}
              </Button>
            </form>
          )}

          {/* ── STEP 2: Enter OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit verification code to{' '}
                  <span className="text-foreground font-medium">{formData.email}</span>.
                  Enter it below to confirm your email and create your account.
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

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={registerMutation.isPending || otp.join('').length < 6}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {registerMutation.isPending ? 'Creating account…' : 'Verify & Create Account'}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setStep('details');
                  setError('');
                  setOtp(['', '', '', '', '', '']);
                }}
              >
                ← Change email or resend code
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
            Already have an account?{' '}
            <Link href="/login">
              <span className="text-accent font-medium transition-colors cursor-pointer">Sign in</span>
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
