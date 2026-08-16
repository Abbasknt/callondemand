'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  Zap, 
  Sparkles, 
  Flame, 
  Tag, 
  Clock, 
  CheckCircle2,
  Percent,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TickerPromoItem {
  id: string;
  badge: string;
  badgeColor: string;
  text: string;
  linkText: string;
  href: string;
  icon: any;
}

const DEFAULT_TICKER_ITEMS: TickerPromoItem[] = [
  {
    id: 't-1',
    badge: 'HOT DATA',
    badgeColor: 'bg-emerald-500 text-white',
    text: 'MTN, Airtel, Glo & 9ja Data active at wholesale rates',
    linkText: 'Top Up Data',
    href: '/services/data',
    icon: Zap
  },
  {
    id: 't-2',
    badge: 'CASHBACK',
    badgeColor: 'bg-amber-500 text-slate-950',
    text: 'Earn instant 5% cashback on Monnify Wallet deposits today',
    linkText: 'Deposit',
    href: '/wallet',
    icon: Percent
  },
  {
    id: 't-3',
    badge: 'FLASH FOOD',
    badgeColor: 'bg-rose-500 text-white',
    text: 'Unit Kitchens Jollof & Grill combo dispatching under 25 mins',
    linkText: 'Order Food',
    href: '/services/food',
    icon: Flame
  },
  {
    id: 't-4',
    badge: 'LOGISTICS',
    badgeColor: 'bg-blue-500 text-white',
    text: 'Interstate courier between Lagos, Abuja, PH & all 36 states',
    linkText: 'Ship Now',
    href: '/logistics',
    icon: Clock
  },
  {
    id: 't-5',
    badge: 'SHORTLETS',
    badgeColor: 'bg-purple-500 text-white',
    text: 'Weekend serviced stays in Lekki & Abuja with 24/7 solar power',
    linkText: 'View Stays',
    href: '/services/shortlet',
    icon: Gift
  }
];

interface MotionalAdsTickerProps {
  items?: TickerPromoItem[];
  className?: string;
}

export function MotionalAdsTicker({
  items = DEFAULT_TICKER_ITEMS,
  className
}: MotionalAdsTickerProps) {
  // Duplicate array for seamless infinite marquee loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div className={cn("relative overflow-hidden bg-slate-900 border-y border-slate-800 text-white py-2 sm:py-2.5 shadow-xs w-full select-none group", className)}>
      {/* Left/Right Vignette gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-12 md:w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-12 md:w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      {/* Floating Animated Marquee */}
      <motion.div
        animate={{
          x: ['0%', '-50%']
        }}
        transition={{
          duration: 35,
          ease: 'linear',
          repeat: Infinity
        }}
        className="flex items-center gap-4 xs:gap-5 sm:gap-7 whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
      >
        {displayItems.map((item, idx) => {
          const Icon = item.icon || Sparkles;
          return (
            <div 
              key={`${item.id}-${idx}`}
              className="inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 text-[11px] xs:text-xs sm:text-sm font-medium text-slate-200 shrink-0 hover:text-white transition-colors"
            >
              <span className={cn("text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase px-1.5 xs:px-2 py-0.5 rounded-full shrink-0", item.badgeColor)}>
                {item.badge}
              </span>
              <Icon className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-normal text-[11px] xs:text-xs sm:text-sm">{item.text}</span>
              <Link 
                href={item.href}
                className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1 shrink-0 text-[11px] xs:text-xs sm:text-sm"
              >
                {item.linkText} →
              </Link>
              <span className="text-slate-700 ml-2 xs:ml-3 sm:ml-4">•</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
