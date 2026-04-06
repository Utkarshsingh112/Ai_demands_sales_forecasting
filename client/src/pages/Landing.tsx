import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import { ArrowRight, BarChart3, Zap, FileUp, PieChart, AlertCircle } from 'lucide-react';
import { getLoginUrl } from '@/const';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/10 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="text-2xl font-serif font-bold">ForecastIQ</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href={getLoginUrl()}>Login</a>
            </Button>
            <Button variant="primary" asChild>
              <a href={getLoginUrl()}>Get Started Free</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit">
              Powered by Predictive AI
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black leading-tight">
              Know What Your Business Will Sell — Before It Happens.
            </h1>
            
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-lg">
              Upload your sales history. Get accurate demand forecasts. Make smarter inventory, staffing, and revenue decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="primary" size="lg" asChild className="gap-2">
                <a href={getLoginUrl()}>
                  Start Forecasting Free
                  <ArrowRight size={18} />
                </a>
              </Button>
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </div>

            <div className="pt-8 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-4">Works with any business</p>
              <div className="flex gap-4 flex-wrap">
                {['Retail', 'Restaurant', 'E-Commerce', 'Manufacturing'].map(industry => (
                  <span key={industry} className="text-sm font-medium text-foreground/70">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview Dashboard */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg">Sales Forecast</h3>
                <TrendBadge trend="up" value={12.5} />
              </div>
              
              <div className="h-32 bg-secondary rounded-lg flex items-end justify-around px-4 gap-2">
                {[40, 60, 45, 70, 55, 65, 50].map((height, i) => (
                  <div key={i} className="flex-1 bg-accent rounded-t opacity-70 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-serif font-bold">₹45,230</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Next 30 Days</p>
                  <p className="text-2xl font-serif font-bold">₹50,890</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 md:py-32 border-t border-border/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Everything You Need to Forecast with Confidence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
            Powerful analytics, simple interface, actionable insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: FileUp,
              title: 'Upload Any Data',
              description: 'CSV, Excel, or manual entry. We handle any format and automatically clean your data.'
            },
            {
              icon: Zap,
              title: 'AI Demand Forecasting',
              description: 'Predicts demand for the next 7, 30, or 90 days with confidence scores.'
            },
            {
              icon: AlertCircle,
              title: 'Trend Alerts',
              description: 'Get notified before demand drops or spikes so you can react quickly.'
            },
            {
              icon: BarChart3,
              title: 'Product-Level Insights',
              description: 'See which SKUs are rising or falling and get inventory recommendations.'
            },
            {
              icon: PieChart,
              title: 'Revenue Projections',
              description: 'Estimated future revenue with confidence ranges for better planning.'
            },
            {
              icon: FileUp,
              title: 'Export Reports',
              description: 'Download PDF and CSV reports anytime for presentations and analysis.'
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="group">
                <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 h-full hover:shadow-md transition-shadow">
                  <Icon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground font-serif leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20 md:py-32 border-t border-border/10">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-16">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            { number: '1', title: 'Upload Your Data', description: 'Paste your sales history or upload a file. Takes 2 minutes.' },
            { number: '2', title: 'Analyze Patterns', description: 'Our engine detects trends, seasonality, and anomalies.' },
            { number: '3', title: 'Get Forecast', description: 'Receive predictions with confidence scores and actionable insights.' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-serif font-black text-accent mb-4">{step.number}</div>
              <h3 className="text-2xl font-serif font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground font-serif leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32 border-t border-border/10">
        <div className="text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Ready to Stop Guessing?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
            Join businesses that are making smarter decisions with ForecastIQ.
          </p>
          <Button variant="primary" size="lg" asChild>
            <a href={getLoginUrl()}>Create Your Free Account</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/10 py-12 mt-20">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 ForecastIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
