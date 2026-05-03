
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
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
        <div className="relative h-48 w-full">
          <Image
            src={campaign.imageUrl || "https://picsum.photos/seed/flash/600/400"}
            alt={campaign.title}
            fill
            className="object-cover"
            data-ai-hint="promotional offer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-white border-none font-black uppercase tracking-widest text-[9px]">
              Special Demand
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-8 text-center space-y-6">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
            <Gift className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-black tracking-tight">{campaign.title}</DialogTitle>
            <DialogDescription className="text-base font-medium">
              {campaign.description}
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="h-14 w-full rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-2 bg-primary hover:bg-primary/90" onClick={handleClose}>
              Claim This Offer <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest opacity-50" onClick={handleClose}>
              No thanks, maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
