
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Gift, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface PromotionPopupProps {
  campaign: any;
}

export function PromotionPopup({ campaign }: PromotionPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeen = sessionStorage.getItem(`promo_${campaign.id}`);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [campaign.id]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem(`promo_${campaign.id}`, 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl sm:rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-card mx-auto">
        <div className="relative h-36 xs:h-44 sm:h-48 w-full">
          <Image
            src={campaign.imageUrl || "https://picsum.photos/seed/flash/600/400"}
            alt={campaign.title}
            fill
            className="object-cover"
            data-ai-hint="promotional offer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <Badge className="bg-primary text-white border-none font-black uppercase tracking-widest text-[8px] sm:text-[9px] px-2 py-0.5 shadow-sm">
              Special Demand
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 sm:top-4 right-3 sm:right-4 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md cursor-pointer"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 xs:p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
          <div className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
            <Gift className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 stroke-[2]" />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight leading-tight">{campaign.title}</DialogTitle>
            <DialogDescription className="text-xs xs:text-sm sm:text-base font-medium line-clamp-3">
              {campaign.description}
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2.5 sm:gap-3 pt-1">
            <Button className="h-11 xs:h-12 sm:h-14 w-full rounded-xl sm:rounded-2xl font-black text-sm xs:text-base sm:text-lg shadow-xl shadow-primary/20 gap-2 bg-primary hover:bg-primary/90 min-h-[44px]" onClick={handleClose}>
              <span>Claim This Offer</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" className="text-[9px] xs:text-[10px] font-black uppercase tracking-widest opacity-60 min-h-[36px]" onClick={handleClose}>
              No thanks, maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
