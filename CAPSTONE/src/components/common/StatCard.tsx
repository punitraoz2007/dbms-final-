import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-400/40',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:border-blue-400/40',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-400/40',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20 group-hover:border-amber-400/40',
    purple: 'bg-violet-500/10 text-violet-300 border-violet-500/20 group-hover:border-violet-400/40',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-400/40',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-400/40',
  };

  const glowMap = {
    cyan: 'from-cyan-500/10 via-transparent to-transparent',
    blue: 'from-blue-500/10 via-transparent to-transparent',
    emerald: 'from-emerald-500/10 via-transparent to-transparent',
    amber: 'from-amber-500/10 via-transparent to-transparent',
    purple: 'from-violet-500/10 via-transparent to-transparent',
    rose: 'from-rose-500/10 via-transparent to-transparent',
    indigo: 'from-indigo-500/10 via-transparent to-transparent',
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative overflow-hidden rounded-2xl bg-slate-900/70 p-5 border border-white/10 backdrop-blur-xl shadow-lg hover:border-cyan-500/40 transition-all duration-300"
    >
      {/* Ambient gradient aura */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br ${glowMap[color]} blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${colorMap[color]}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium font-mono ${
              trendUp ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="relative z-10 text-xs text-slate-400 mt-1 truncate font-medium">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
