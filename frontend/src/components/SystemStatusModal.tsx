import { useEffect, useState } from 'react';
import { X, CheckCircle2, Activity, Database, Globe, Shield, Search, FileText, Zap, Server } from 'lucide-react';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemStatusModal({ isOpen, onClose }: SystemStatusModalProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  const services = [
    { 
      name: 'AI Analysis Engine', 
      status: 'operational', 
      latency: '42ms', 
      icon: Activity,
      description: 'GPT-4 powered security assessment'
    },
    { 
      name: 'Vulnerability Database', 
      status: 'operational', 
      latency: '18ms', 
      icon: Database,
      description: 'NVD, CVE, GitHub Advisories'
    },
    { 
      name: 'Threat Intelligence', 
      status: 'operational', 
      latency: '67ms', 
      icon: Shield,
      description: 'Real-time threat feeds'
    },
    { 
      name: 'Web Scraper', 
      status: 'operational', 
      latency: '134ms', 
      icon: Globe,
      description: 'Vendor compliance data collection'
    },
    { 
      name: 'Search Engine', 
      status: 'operational', 
      latency: '23ms', 
      icon: Search,
      description: 'Tavily, Perplexity API'
    },
    { 
      name: 'Report Generator', 
      status: 'operational', 
      latency: '56ms', 
      icon: FileText,
      description: 'CISO brief synthesis'
    },
    { 
      name: 'Cache Layer', 
      status: 'operational', 
      latency: '4ms', 
      icon: Zap,
      description: 'Redis distributed cache'
    },
    { 
      name: 'API Gateway', 
      status: 'operational', 
      latency: '12ms', 
      icon: Server,
      description: 'Rate limiting & routing'
    },
  ];

  const sources = [
    { name: 'NVD (National Vulnerability Database)', count: '210K+ CVEs', status: 'synced' },
    { name: 'GitHub Security Advisories', count: '5K+ advisories', status: 'synced' },
    { name: 'US-CERT Alerts', count: '12K+ alerts', status: 'synced' },
    { name: 'HaveIBeenPwned', count: '600+ breaches', status: 'synced' },
    { name: 'MalwareBazaar', count: '2M+ samples', status: 'synced' },
    { name: 'URLhaus', count: '500K+ URLs', status: 'synced' },
    { name: 'AlienVault OTX', count: '19M+ indicators', status: 'synced' },
    { name: 'Snyk Vulnerability DB', count: '1M+ vulns', status: 'synced' },
    { name: 'G2 Software Catalog', count: '100K+ products', status: 'synced' },
    { name: 'AlternativeTo', count: '50K+ alternatives', status: 'synced' },
    { name: 'Gartner Categories', count: '868 taxonomies', status: 'synced' },
    { name: 'FedRAMP Marketplace', count: '300+ providers', status: 'synced' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity duration-300 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl max-h-[85vh] bg-black border border-slate-700 rounded-lg shadow-2xl shadow-slate-900/50 z-50 transition-all duration-300 ${
          animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Gradient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 rounded-lg pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(71, 85, 105, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(51, 65, 85, 0.2) 0%, transparent 50%)
          `
        }}></div>

        {/* Header */}
        <div className="relative border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-xl font-mono bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                  System Status
                </h2>
                <p className="text-sm text-slate-400 font-mono">All systems operational</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-900/50 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-6">
          {/* Backend Services */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm text-slate-300 uppercase tracking-wide font-mono">Backend Services</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.name}
                    className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-slate-700/30 animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-slate-600/0 to-slate-700/0 group-hover:from-slate-600/10 group-hover:to-slate-700/10 transition-all pointer-events-none"></div>
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      
                      <h4 className="text-sm text-slate-200 font-mono mb-1">{service.name}</h4>
                      <p className="text-xs text-slate-500 mb-2 font-mono">{service.description}</p>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-slate-400 font-mono">{service.latency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm text-slate-300 uppercase tracking-wide font-mono">Data Sources</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((source, index) => (
                <div
                  key={source.name}
                  className="group relative bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-all hover:shadow-lg hover:shadow-slate-700/20 animate-fadeIn"
                  style={{ animationDelay: `${(services.length * 50) + (index * 30)}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs text-slate-300 font-mono mb-1 truncate">{source.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{source.count}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-500 font-mono">Synced</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Stats Footer */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl text-slate-300 font-mono mb-1">99.9%</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-slate-300 font-mono mb-1">8</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-slate-300 font-mono mb-1">12</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-slate-300 font-mono mb-1">{'<200ms'}</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">Avg Response</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}