import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/25 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
    purple: 'bg-violet-500/10 text-violet-300 border-violet-500/25 shadow-[0_0_12px_rgba(139,92,246,0.15)]',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  const dotColors = {
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    purple: 'bg-violet-400',
    cyan: 'bg-cyan-400',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wide',
    md: 'text-xs px-3 py-1 tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border backdrop-blur-md ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      <span>{children}</span>
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'occupied':
    case 'paid':
    case 'resolved':
    case 'accepted':
      return 'success';
    case 'available':
    case 'open':
    case 'info':
      return 'cyan';
    case 'pending':
    case 'in progress':
    case 'semi-furnished':
      return 'warning';
    case 'maintenance':
    case 'under maintenance':
    case 'overdue':
    case 'terminated':
    case 'disabled':
    case 'expired':
    case 'high':
      return 'danger';
    case 'closed':
    case 'inactive':
    case 'unfurnished':
    case 'low':
      return 'neutral';
    case 'furnished':
    case 'medium':
      return 'purple';
    default:
      return 'neutral';
  }
}
