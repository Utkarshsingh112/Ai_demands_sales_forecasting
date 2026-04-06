import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Moon, Sun, Save, LogOut } from 'lucide-react';

export default function Settings() {
  const [profile, setProfile] = useState({
    businessName: 'Acme Corporation',
    email: 'admin@acme.com',
    industry: 'Retail',
    currency: 'INR',
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Call profile.update tRPC mutation
      console.log('Saving profile:', profile);
      // Show success toast
    } finally {
      setIsSaving(false);
    }
  };

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
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">Business Profile</h2>
          </div>

          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Name
              </label>
              <Input
                type="text"
                value={profile.businessName}
                onChange={(e) => handleProfileChange('businessName', e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Industry
              </label>
              <select
                value={profile.industry}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleProfileChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="Retail">Retail</option>
                <option value="Restaurant">Restaurant</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <select
                value={profile.currency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleProfileChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6">
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-serif font-bold">Appearance</h2>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground mb-4">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ].map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as 'light' | 'dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === option.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <p className="font-medium">{option.label}</p>
                  </button>
                );
              })}
            </div>
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
                Sign out from all devices
              </p>
              <Button variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="border-t border-border/50 pt-4">
              <h3 className="font-serif font-bold mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data
              </p>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
