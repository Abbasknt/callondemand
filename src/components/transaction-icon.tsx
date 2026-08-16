'use client';

import React from 'react';
import { getTransactionCategoryInfo } from '@/lib/transaction-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionIconProps {
  tx: {
    type?: string;
    description?: string;
    category?: string;
    serviceType?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TransactionIcon({ tx, size = 'md', className }: TransactionIconProps) {
  const info = getTransactionCategoryInfo(tx);
  const IconComponent = info.icon;

  const sizeClasses = {
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-11 w-11 rounded-2xl',
    lg: 'h-14 w-14 rounded-[1.25rem]'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7'
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 shadow-inner transition-colors duration-200',
        sizeClasses[size],
        info.iconBgClass,
        info.iconColorClass,
        className
      )}
      title={info.categoryName}
    >
      <IconComponent className={iconSizeClasses[size]} />
    </div>
  );
}

interface TransactionCategoryBadgeProps {
  tx: {
    type?: string;
    description?: string;
    category?: string;
    serviceType?: string;
  };
  showType?: boolean;
  className?: string;
}

export function TransactionCategoryBadge({ tx, showType = true, className }: TransactionCategoryBadgeProps) {
  const info = getTransactionCategoryInfo(tx);

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Badge
        variant="outline"
        className={cn(
          'text-[8px] font-black uppercase px-2 py-0 border-none transition-colors duration-200',
          info.badgeBgClass,
          info.badgeTextClass
        )}
      >
        {info.categoryName}
      </Badge>
      {showType && tx.type && tx.type !== info.categoryName && (
        <Badge
          variant="outline"
          className="text-[8px] font-bold uppercase px-1.5 py-0 border-none bg-muted/60 text-muted-foreground"
        >
          {tx.type}
        </Badge>
      )}
    </div>
  );
}
