'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Percent, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MotionalDealCardProps {
  network?: string;
  className?: string;
}

export function MotionalDealCard({ network = '9mobile', className }: MotionalDealCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -3 }}
      className={cn(
        "relative rounded-2xl overflow-hidden p-4 xs:p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white border border-emerald-500/30 shadow-md group w-full",
        className
      )}
    >
      {/* Animated Glow Halo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-12 -right-12 w-36 h-36 sm:w-48 sm:h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="space-y-1.5 xs:space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
            <Badge className="bg-emerald-500 text-slate-950 font-extrabold text-[9px] xs:text-[10px] uppercase tracking-wider px-2 xs:px-2.5 py-0.5">
              <Flame className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-1 fill-slate-950 shrink-0" /> Motional Flash Deal
            </Badge>
            <span className="text-[11px] xs:text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Zap className="h-3 w-3 shrink-0" /> 0% VAS Convenience Fee
            </span>
          </div>

          <h3 className="text-sm xs:text-base sm:text-lg font-black text-white tracking-tight leading-snug">
            Top Up 9ja / 9mobile, MTN, Airtel &amp; Glo Data Instantly
          </h3>

          <p className="text-[11px] xs:text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Direct biller delivery powered by Monnify Gateway. SME &amp; Direct bundles starting from ₦50 with automated real-time dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-1 md:pt-0">
          <Button 
            asChild
            size="sm"
            className="h-10 min-h-[44px] w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md gap-1.5 px-4 justify-center"
          >
            <Link href="/services/data">
              <span>View All Bundles</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
