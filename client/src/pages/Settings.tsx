import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, LogOut, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

import { useLocation } from 'wouter';

export default function Settings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Retail');
  const [currency, setCurrency] = useState('INR');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load profile from server
  const { data: profileData } = trpc.profile.get.useQuery();
  const updateProfile = trpc.profile.update.useMutation();
  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      setLocation('/login');
    },
  });

  useEffect(() => {
    if (profileData) {
      setBusinessName(profileData.businessName || '');
      setIndustry(profileData.industry || 'Retail');
      setCurrency(profileData.currency || 'INR');
    }
  }, [profileData]);

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    try {
      await updateProfile.mutateAsync({ businessName, industry, currency });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    await deleteAccount.mutateAsync();
  };

  const saveLabel = saveStatus === 'saving'
    ? 'Saving...'
    : saveStatus === 'saved'
    ? 'Saved!'
    : saveStatus === 'error'
    ? 'Error — try again'
    : 'Save Changes';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Settings</h1>
          <p className="text-lg text-muted-foreground font-serif">
            Manage your account and preferences
          </p>
        </div>

        {/* Business Profile */}
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-serif font-bold">Business Profile</h2>

          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Name
              </label>
              <Input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {['Retail', 'Restaurant', 'E-Commerce', 'Manufacturing', 'Other'].map(opt => (
                  <option key={opt} value={opt} style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {[
                  { value: 'INR', label: 'Indian Rupee (₹)' },
                  { value: 'USD', label: 'US Dollar ($)' },
                  { value: 'EUR', label: 'Euro (€)' },
                  { value: 'GBP', label: 'British Pound (£)' },
                ].map(opt => (
                  <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6">
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={saveStatus === 'saving'}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveLabel}
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-serif font-bold">Notifications</h2>

          <div className="space-y-4">
            {[
              { label: 'Demand spike alerts (>25% increase)', checked: true },
              { label: 'Demand drop alerts (>15% decrease)', checked: true },
              { label: 'Seasonal pattern alerts', checked: true },
              { label: 'Weekly forecast summary', checked: false },
            ].map((notification, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={notification.checked}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-foreground">{notification.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 space-y-6 border-destructive/50">
          <h2 className="text-2xl font-serif font-bold text-destructive">Danger Zone</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-bold mb-2">Sign Out</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out from your current session
              </p>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="border-t border-border/50 pt-4">
              <h3 className="font-serif font-bold mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <p className="text-sm font-medium text-destructive">
                    This will permanently delete your account, all datasets, forecasts, and reports.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="border-destructive/50"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deleteAccount.isPending}
                    >
                      {deleteAccount.isPending ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
