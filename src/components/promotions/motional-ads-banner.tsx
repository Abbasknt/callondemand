'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Zap, 
  Utensils, 
  Truck, 
  Shirt, 
  Home, 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Percent, 
  Clock, 
  ShieldCheck, 
  Gift
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MotionalAdItem {
  id: string;
  tag: string;
  tagColor: string;
  badgeIcon: any;
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  gradientBg: string;
  accentColor: string;
  discountBadge?: string;
  statsLabel?: string;
  statsValue?: string;
}

const DEFAULT_MOTIONAL_ADS: MotionalAdItem[] = [
  {
    id: 'ad-data-fest',
    tag: 'Flash Deal • Monnify VAS',
    tagColor: 'bg-amber-400 text-slate-950 font-bold',
    badgeIcon: Zap,
    title: 'Superfast 4G/5G Data Bundles',
    highlight: 'Instant Top-Up on MTN, Airtel, Glo & 9ja',
    description: 'Get high-speed data from ₦50 with instant automated crediting to any Nigerian phone number. Enjoy 5% cashback on all wallet recharges.',
    ctaText: 'Search & Buy Data',
    ctaLink: '/services/data',
    secondaryCtaText: 'Quick Airtime Top-Up',
    secondaryCtaLink: '/services/utility',
    gradientBg: 'from-emerald-950 via-slate-900 to-teal-950',
    accentColor: '#10B981',
    discountBadge: 'Up to 25% Off',
    statsLabel: 'Average Delivery',
    statsValue: '< 3 seconds'
  },
  {
    id: 'ad-food-express',
    tag: 'Hot & Fresh • Unit Kitchens',
    tagColor: 'bg-rose-500 text-white font-bold',
    badgeIcon: Utensils,
    title: 'Authentic Local & Continental Delicacies',
    highlight: 'Smoky Jollof, Gourmet Soups & Suya',
    description: 'Prepared in certified hygienic kitchens and delivered steaming hot right to your doorstep in under 30 minutes.',
    ctaText: 'Order Delicious Meal',
    ctaLink: '/services/food',
    secondaryCtaText: 'View Food Menu',
    secondaryCtaLink: '/services/food',
    gradientBg: 'from-orange-950 via-rose-950 to-slate-950',
    accentColor: '#F43F5E',
    discountBadge: 'Free Delivery on First 2 Orders',
    statsLabel: 'Chef Rating',
    statsValue: '4.9 ★ (2.4k+ orders)'
  },
  {
    id: 'ad-logistics-nationwide',
    tag: 'Same-Day Dispatch • Door-to-Door',
    tagColor: 'bg-blue-500 text-white font-bold',
    badgeIcon: Truck,
    title: 'Express Interstate & Intra-City Couriers',
    highlight: 'Real-Time GPS Tracking & Secured Escrow',
    description: 'Reliable errand runners, parcel dispatch, and freight haulage between Lagos, Abuja, Port Harcourt, Ibadan, and all 36 states.',
    ctaText: 'Book Fast Dispatch',
    ctaLink: '/logistics',
    secondaryCtaText: 'Track Consignment',
    secondaryCtaLink: '/logistics',
    gradientBg: 'from-blue-950 via-indigo-950 to-slate-950',
    accentColor: '#3B82F6',
    discountBadge: 'Secure Delivery Guaranteed',
    statsLabel: 'Dispatch Time',
    statsValue: 'Within 15 mins'
  },
  {
    id: 'ad-laundry-weekend',
    tag: 'Premium Fabric Care • Wash & Fold',
    tagColor: 'bg-violet-500 text-white font-bold',
    badgeIcon: Shirt,
    title: 'Professional Laundry & Dry Cleaning',
    highlight: 'Complimentary Doorstep Pickup & Ironing',
    description: 'Expert fabric restoration, starching, and fragrant folding delivered back in immaculate packaging within 24–48 hours.',
    ctaText: 'Schedule Laundry Pickup',
    ctaLink: '/services/laundry',
    gradientBg: 'from-purple-950 via-violet-950 to-slate-950',
    accentColor: '#8B5CF6',
    discountBadge: '15% Off Laundry Bundles',
    statsLabel: 'Turnaround',
    statsValue: '24–48 Hours'
  },
  {
    id: 'ad-shortlet-luxury',
    tag: 'Verified Luxury Stays • Instant Booking',
    tagColor: 'bg-amber-500 text-slate-950 font-bold',
    badgeIcon: Home,
    title: 'Serviced Stays & Executive Shortlets',
    highlight: '24/7 Power, Fast WiFi & Guarded Security',
    description: 'Explore prime residences in Victoria Island, Lekki Phase 1, Ikoyi, Ikeja GRA, and Abuja Central for work retreats or holidays.',
    ctaText: 'Browse Available Stays',
    ctaLink: '/services/shortlet',
    gradientBg: 'from-amber-950 via-slate-950 to-stone-950',
    accentColor: '#F59E0B',
    discountBadge: 'Weekend Deals from ₦35,000',
    statsLabel: 'Power & Security',
    statsValue: '100% Guaranteed'
  }
];

interface MotionalAdsBannerProps {
  ads?: MotionalAdItem[];
  autoPlayInterval?: number;
  className?: string;
}

export function MotionalAdsBanner({
  ads = DEFAULT_MOTIONAL_ADS,
  autoPlayInterval = 6000,
  className
}: MotionalAdsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const activeAd = ads[currentIndex] || ads[0];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    setProgress(0);
  }, [ads.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setProgress(0);
  }, [ads.length]);

  // Auto-play timer with progress bar
  useEffect(() => {
    if (!isPlaying) return;

    const intervalStep = 50; // ms
    const increment = (intervalStep / autoPlayInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPlaying, autoPlayInterval, nextSlide]);

  const IconComponent = activeAd.badgeIcon || Sparkles;

  return (
    <div 
      className={cn(
        "relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-800/80 group select-none w-full",
        className
      )}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      aria-label="Promotional Motional Advertisements"
    >
      {/* Background Animated Gradient Layer */}
      <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000", activeAd.gradientBg)} />
      
      {/* Animated Subtle Glowing Particles & Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div 
          animate={{
            scale: [1, 1.25, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-16 -right-16 w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full blur-3xl"
          style={{ backgroundColor: activeAd.accentColor }}
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -25, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 -left-20 w-60 h-60 sm:w-80 sm:h-80 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: activeAd.accentColor }}
        />
        {/* Shimmer line */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        />
      </div>

      {/* Main Animated Ad Content */}
      <div className="relative z-10 p-4 xs:p-5 sm:p-7 md:p-8 lg:p-9 flex flex-col justify-between min-h-[240px] xs:min-h-[260px] sm:min-h-[280px] md:min-h-[300px] text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAd.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center"
          >
            {/* Left/Primary Text & Actions Column */}
            <div className="md:col-span-8 lg:col-span-8 space-y-2.5 xs:space-y-3 sm:space-y-3.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                <Badge className={cn("text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 xs:px-3 py-0.5 xs:py-1 rounded-full border-none shadow-sm flex items-center gap-1 xs:gap-1.5", activeAd.tagColor)}>
                  <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>{activeAd.tag}</span>
                </Badge>
                {activeAd.discountBadge && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] xs:text-[10px] sm:text-xs font-semibold px-2 xs:px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-300 fill-amber-300 shrink-0" />
                      <span>{activeAd.discountBadge}</span>
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Headline & Subhead */}
              <div className="space-y-1">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug sm:leading-tight">
                  {activeAd.title}
                </h2>
                <p className="text-[11px] xs:text-xs sm:text-sm font-bold text-amber-300/95 tracking-wide flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="line-clamp-1">{activeAd.highlight}</span>
                </p>
              </div>

              {/* Description */}
              <p className="text-[11px] xs:text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl">
                {activeAd.description}
              </p>

              {/* Stat Pill */}
              {activeAd.statsValue && (
                <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-[10px] xs:text-[11px] font-medium text-slate-200">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                  <span>{activeAd.statsLabel}:</span>
                  <span className="font-bold text-white">{activeAd.statsValue}</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="pt-1 xs:pt-2 flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3">
                <Button 
                  asChild 
                  size="sm" 
                  className="h-10 min-h-[44px] px-4 xs:px-5 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-950 hover:bg-slate-100 shadow-md shadow-black/20 gap-1.5 group/btn justify-center"
                >
                  <Link href={activeAd.ctaLink}>
                    <span>{activeAd.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover/btn:translate-x-1 transition-transform shrink-0" />
                  </Link>
                </Button>

                {activeAd.secondaryCtaText && activeAd.secondaryCtaLink && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="h-10 min-h-[44px] px-3.5 xs:px-4 rounded-xl font-semibold text-xs sm:text-sm bg-transparent border-white/30 text-white hover:bg-white/15 backdrop-blur-xs justify-center"
                  >
                    <Link href={activeAd.secondaryCtaLink}>
                      {activeAd.secondaryCtaText}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Interactive Animated Feature Orb on MD+ Screens */}
            <div className="hidden md:flex md:col-span-4 lg:col-span-4 justify-center items-center">
              <motion.div 
                animate={{
                  y: [-4, 4, -4],
                  rotate: [-1, 1, -1]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-36 h-36 lg:w-44 lg:h-44 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center p-4 shadow-xl text-center group-hover:scale-105 transition-transform"
              >
                <div 
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
                  style={{ backgroundColor: activeAd.accentColor }}
                >
                  <IconComponent className="h-7 w-7 lg:h-8 lg:w-8 text-white stroke-[2.2]" />
                </div>
                <span className="text-xs lg:text-sm font-black text-white tracking-tight line-clamp-1">
                  {activeAd.statsValue || "On Demand"}
                </span>
                <span className="text-[10px] lg:text-[11px] text-slate-300 font-medium line-clamp-1">
                  {activeAd.statsLabel || "Instant Fulfillment"}
                </span>

                {/* Floating mini badge */}
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 font-black text-[9px] lg:text-[10px] uppercase px-2 py-0.5 rounded-full shadow-md">
                  Active
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Interactive Controls & Progress Bar */}
        <div className="pt-3 xs:pt-4 flex items-center justify-between gap-3 sm:gap-4 border-t border-white/10 mt-3 xs:mt-4">
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {ads.map((ad, idx) => (
              <button
                key={ad.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
                className={cn(
                  "rounded-full transition-all duration-300 min-h-[32px] min-w-[28px] xs:min-w-[32px] flex items-center justify-center p-0 cursor-pointer",
                  currentIndex === idx ? "w-7 sm:w-9" : "w-3 hover:opacity-80"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all block",
                  currentIndex === idx ? "w-6 sm:w-8 bg-white shadow-xs" : "w-1.5 sm:w-2 bg-white/40"
                )} />
              </button>
            ))}
          </div>

          {/* Controls: Play/Pause, Prev, Next */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 sm:p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title={isPlaying ? "Pause auto-rotation" : "Play auto-rotation"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            </button>
            <button
              onClick={prevSlide}
              className="p-1 sm:p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Previous promotion"
              aria-label="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="p-1 sm:p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Next promotion"
              aria-label="Next"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Continuous Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-white/10">
        <div 
          className="h-full bg-amber-400 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
