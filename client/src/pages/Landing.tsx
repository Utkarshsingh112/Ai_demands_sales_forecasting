import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import { ArrowRight, BarChart3, Zap, FileUp, PieChart, AlertCircle } from 'lucide-react';
import { getLoginUrl } from '@/const';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-foreground relative overflow-hidden">
      
      {/* Hero Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden h-screen">
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] w-[35vw] h-[35vw] bg-amber-500/10 rounded-full blur-3xl mix-blend-screen"
        />
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] bg-teal-500/10 rounded-full blur-3xl mix-blend-screen"
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/[0.03] backdrop-blur-md border-b border-white/[0.06]">
        <div className="container flex items-center justify-between py-4">
          <div className="text-2xl font-display font-bold">ForecastIQ</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white" asChild>
              <a href={getLoginUrl()}>Login</a>
            </Button>
            <Button 
              asChild 
              className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 hover:shadow-glow transition-all"
            >
              <motion.a whileHover={{ boxShadow: '0 0 24px rgba(245,158,11,0.15)' }} href={getLoginUrl()}>
                Get Started Free
              </motion.a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit bg-white/[0.03] border border-white/[0.06] text-slate-300 backdrop-blur-md">
              Powered by Predictive AI
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black leading-tight bg-gradient-to-r from-amber-400 to-teal-400 bg-clip-text text-transparent pb-2">
              Know What Your Business Will Sell — Before It Happens.
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Upload your sales history. Get accurate demand forecasts. Make smarter inventory, staffing, and revenue decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="gap-2 bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 transition-all border-none">
                <motion.a whileHover={{ boxShadow: '0 0 24px rgba(245,158,11,0.15)' }} href={getLoginUrl()}>
                  Start Forecasting Free
                  <ArrowRight size={18} />
                </motion.a>
              </Button>
                      <Button variant="outline" size="lg" className="border border-white/20 text-slate-300 hover:border-white/40 hover:bg-transparent bg-transparent backdrop-blur-md" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                See How It Works
              </Button>
            </div>

            <div className="pt-8 border-t border-white/[0.06]">
              <p className="text-sm text-slate-400 mb-4 font-mono">Works with any business</p>
              <div className="flex gap-4 flex-wrap">
                {['Retail', 'Restaurant', 'E-Commerce', 'Manufacturing'].map(industry => (
                  <span key={industry} className="text-sm font-medium text-slate-400">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview Dashboard */}
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/5 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative bg-[#0F1117] border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <h3 className="font-display font-bold text-lg text-slate-200">Sales Forecast</h3>
                <TrendBadge trend="up" value={12.5} />
              </div>
              
              <div className="h-32 bg-[#1C1E26] rounded-lg flex items-end justify-around px-4 gap-2 border border-white/[0.03]">
                {[40, 60, 45, 70, 55, 65, 50].map((height, i) => (
                  <div key={i} className="flex-1 bg-amber-400 rounded-t opacity-80 hover:opacity-100 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all" style={{ height: `${height}%` }} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1C1E26] border border-white/[0.03] rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1 font-mono uppercase">This Month</p>
                  <p className="text-2xl font-mono font-bold text-slate-200">₹45,230</p>
                </div>
                <div className="bg-[#1C1E26] border border-white/[0.03] rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1 font-mono uppercase">Next 30 Days</p>
                  <p className="text-2xl font-mono font-bold text-teal-400">₹50,890</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 md:py-32 border-t border-white/[0.06] relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-slate-200">
            Everything You Need to Forecast with Confidence
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powerful analytics, simple interface, actionable insights.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
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
              <motion.div variants={itemVariants} key={i}>
                <div className="bg-white/[0.03] border border-white/[0.06] hover:border-amber-400/30 rounded-xl p-6 md:p-8 h-full transition-colors duration-300">
                  <Icon className="w-8 h-8 text-teal-500 mb-4" />
                  <h3 className="text-xl font-display font-bold mb-3 text-slate-200">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container py-20 md:py-32 border-t border-white/[0.06] relative z-10">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-slate-200">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          <div className="absolute top-[36px] left-[calc(100%/6)] right-[calc(100%/6)] h-px bg-white/[0.06] hidden md:block" />

          {[
            { number: '1', title: 'Upload Your Data', description: 'Paste your sales history or upload a file. Takes 2 minutes.' },
            { number: '2', title: 'Analyze Patterns', description: 'Our engine detects trends, seasonality, and anomalies.' },
            { number: '3', title: 'Get Forecast', description: 'Receive predictions with confidence scores and actionable insights.' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center relative z-10">
              <div className="w-[72px] h-[72px] flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
                <span className="text-3xl font-mono font-black text-amber-400">{step.number}</span>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-slate-200">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32 border-t border-white/[0.06] relative z-10">
        <div className="text-center space-y-8 bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-display font-bold relative z-10 text-slate-200">
            Ready to Stop Guessing?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto relative z-10">
            Join businesses that are making smarter decisions with ForecastIQ.
          </p>
          <Button size="lg" asChild className="relative z-10 bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 transition-all border-none">
            <motion.a whileHover={{ boxShadow: '0 0 24px rgba(245,158,11,0.15)' }} href="/register">
              Create Your Free Account
            </motion.a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 mt-20 relative z-10 bg-[#0F1117]">
        <div className="container text-center text-sm text-slate-500 font-mono">
          <p>© 2026 ForecastIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
