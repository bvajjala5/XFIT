import React from 'react';
import { cn } from '@/lib/utils';
export default function GlassCard({ children, className, ...props }) {
  return <div className={cn('glass rounded-2xl p-4', className)} {...props}>{children}</div>;
}
