import { 
  Zap, 
  Tv, 
  Wifi, 
  Smartphone, 
  Droplets, 
  Flame, 
  Shirt, 
  Utensils, 
  ShoppingBag, 
  Home, 
  Truck, 
  ClipboardList, 
  TrendingUp, 
  Heart, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard,
  LucideIcon
} from "lucide-react";

export interface TransactionCategoryInfo {
  icon: LucideIcon;
  categoryName: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
  iconBgClass: string;
  iconColorClass: string;
  key: string;
}

/**
 * Derives a distinct icon, color scheme, and category label for a transaction
 * based on its explicit category, service type, transaction type, or description keywords.
 */
export function getTransactionCategoryInfo(tx: {
  type?: string;
  description?: string;
  category?: string;
  serviceType?: string;
}): TransactionCategoryInfo {
  const desc = (tx.description || '').toLowerCase();
  const category = (tx.category || '').toLowerCase();
  const serviceType = (tx.serviceType || '').toLowerCase();
  const txType = tx.type || '';

  // 1. Electricity / Power
  if (
    category.includes('electric') ||
    category.includes('utility') ||
    serviceType.includes('electric') ||
    desc.includes('electricity') ||
    desc.includes('electric') ||
    desc.includes('power') ||
    desc.includes('meter') ||
    desc.includes('disco') ||
    desc.includes('ikedc') ||
    desc.includes('aedc') ||
    desc.includes('ekedc') ||
    desc.includes('ibedc') ||
    desc.includes('eedc') ||
    desc.includes('kedco') ||
    desc.includes('jedc') ||
    desc.includes('phedc') ||
    desc.includes('kaedco') ||
    desc.includes('bedc')
  ) {
    return {
      icon: Zap,
      categoryName: 'Electricity Utility',
      badgeBgClass: 'bg-amber-500/10',
      badgeTextClass: 'text-amber-600 dark:text-amber-400',
      badgeBorderClass: 'border-amber-500/20',
      iconBgClass: 'bg-amber-500/10',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
      key: 'electricity'
    };
  }

  // 2. Airtime Recharge
  if (
    category.includes('airtime') ||
    serviceType.includes('airtime') ||
    desc.includes('airtime') ||
    desc.includes('recharge') ||
    desc.includes('vtu')
  ) {
    return {
      icon: Smartphone,
      categoryName: 'Airtime Recharge',
      badgeBgClass: 'bg-emerald-500/10',
      badgeTextClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBorderClass: 'border-emerald-500/20',
      iconBgClass: 'bg-emerald-500/10',
      iconColorClass: 'text-emerald-600 dark:text-emerald-400',
      key: 'airtime'
    };
  }

  // 3. Data & Internet
  if (
    category.includes('data') ||
    category.includes('internet') ||
    serviceType.includes('data') ||
    desc.includes('data') ||
    desc.includes('internet') ||
    desc.includes('broadband') ||
    desc.includes('wifi') ||
    desc.includes('bundle') ||
    desc.includes('smile') ||
    desc.includes('spectranet')
  ) {
    return {
      icon: Wifi,
      categoryName: 'Data & Internet',
      badgeBgClass: 'bg-blue-500/10',
      badgeTextClass: 'text-blue-600 dark:text-blue-400',
      badgeBorderClass: 'border-blue-500/20',
      iconBgClass: 'bg-blue-500/10',
      iconColorClass: 'text-blue-600 dark:text-blue-400',
      key: 'data'
    };
  }

  // 4. Cable TV Subscription
  if (
    category.includes('cable') ||
    category.includes('tv') ||
    serviceType.includes('cable') ||
    desc.includes('dstv') ||
    desc.includes('gotv') ||
    desc.includes('startimes') ||
    desc.includes('cable') ||
    desc.includes('showmax') ||
    desc.includes('television')
  ) {
    return {
      icon: Tv,
      categoryName: 'Cable TV',
      badgeBgClass: 'bg-purple-500/10',
      badgeTextClass: 'text-purple-600 dark:text-purple-400',
      badgeBorderClass: 'border-purple-500/20',
      iconBgClass: 'bg-purple-500/10',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      key: 'cable_tv'
    };
  }

  // 5. Water Utility
  if (
    category.includes('water') ||
    desc.includes('water') ||
    desc.includes('borehole')
  ) {
    return {
      icon: Droplets,
      categoryName: 'Water Utility',
      badgeBgClass: 'bg-sky-500/10',
      badgeTextClass: 'text-sky-600 dark:text-sky-400',
      badgeBorderClass: 'border-sky-500/20',
      iconBgClass: 'bg-sky-500/10',
      iconColorClass: 'text-sky-600 dark:text-sky-400',
      key: 'water'
    };
  }

  // 6. Gas & Fuel
  if (
    category.includes('gas') ||
    desc.includes('gas') ||
    desc.includes('fuel') ||
    desc.includes('petrol') ||
    desc.includes('cooking gas')
  ) {
    return {
      icon: Flame,
      categoryName: 'Gas & Fuel',
      badgeBgClass: 'bg-orange-500/10',
      badgeTextClass: 'text-orange-600 dark:text-orange-400',
      badgeBorderClass: 'border-orange-500/20',
      iconBgClass: 'bg-orange-500/10',
      iconColorClass: 'text-orange-600 dark:text-orange-400',
      key: 'gas'
    };
  }

  // 7. Laundry & Garment
  if (
    category.includes('laundry') ||
    serviceType.includes('laundry') ||
    desc.includes('laundry') ||
    desc.includes('dry clean') ||
    desc.includes('wash') ||
    desc.includes('garment') ||
    desc.includes('ironing') ||
    desc.includes('apparel')
  ) {
    return {
      icon: Shirt,
      categoryName: 'Laundry Service',
      badgeBgClass: 'bg-teal-500/10',
      badgeTextClass: 'text-teal-600 dark:text-teal-400',
      badgeBorderClass: 'border-teal-500/20',
      iconBgClass: 'bg-teal-500/10',
      iconColorClass: 'text-teal-600 dark:text-teal-400',
      key: 'laundry'
    };
  }

  // 8. Food & Dining
  if (
    category.includes('food') ||
    serviceType.includes('food') ||
    desc.includes('food') ||
    desc.includes('dining') ||
    desc.includes('restaurant') ||
    desc.includes('meal') ||
    desc.includes('lunch') ||
    desc.includes('dinner') ||
    desc.includes('breakfast') ||
    desc.includes('pizza') ||
    desc.includes('burger') ||
    desc.includes('eats') ||
    desc.includes('grill') ||
    desc.includes('cafe') ||
    desc.includes('kitchen')
  ) {
    return {
      icon: Utensils,
      categoryName: 'Food & Dining',
      badgeBgClass: 'bg-rose-500/10',
      badgeTextClass: 'text-rose-600 dark:text-rose-400',
      badgeBorderClass: 'border-rose-500/20',
      iconBgClass: 'bg-rose-500/10',
      iconColorClass: 'text-rose-600 dark:text-rose-400',
      key: 'food'
    };
  }

  // 9. Shopping & Mart
  if (
    category.includes('shop') ||
    category.includes('store') ||
    serviceType.includes('shop') ||
    desc.includes('shop') ||
    desc.includes('store') ||
    desc.includes('mart') ||
    desc.includes('groceries') ||
    desc.includes('retail') ||
    desc.includes('supermarket') ||
    desc.includes('purchase')
  ) {
    return {
      icon: ShoppingBag,
      categoryName: 'Shopping & Store',
      badgeBgClass: 'bg-indigo-500/10',
      badgeTextClass: 'text-indigo-600 dark:text-indigo-400',
      badgeBorderClass: 'border-indigo-500/20',
      iconBgClass: 'bg-indigo-500/10',
      iconColorClass: 'text-indigo-600 dark:text-indigo-400',
      key: 'shop'
    };
  }

  // 10. Shortlet & Apartments
  if (
    category.includes('shortlet') ||
    serviceType.includes('shortlet') ||
    desc.includes('shortlet') ||
    desc.includes('apartment') ||
    desc.includes('stay') ||
    desc.includes('booking') ||
    desc.includes('hotel') ||
    desc.includes('suite') ||
    desc.includes('lodging')
  ) {
    return {
      icon: Home,
      categoryName: 'Shortlet & Stay',
      badgeBgClass: 'bg-violet-500/10',
      badgeTextClass: 'text-violet-600 dark:text-violet-400',
      badgeBorderClass: 'border-violet-500/20',
      iconBgClass: 'bg-violet-500/10',
      iconColorClass: 'text-violet-600 dark:text-violet-400',
      key: 'shortlet'
    };
  }

  // 11. Logistics & Shipping
  if (
    category.includes('logistics') ||
    category.includes('shipping') ||
    serviceType.includes('logistics') ||
    desc.includes('logistics') ||
    desc.includes('shipping') ||
    desc.includes('courier') ||
    desc.includes('delivery') ||
    desc.includes('dispatch') ||
    desc.includes('parcel') ||
    desc.includes('cargo') ||
    desc.includes('freight')
  ) {
    return {
      icon: Truck,
      categoryName: 'Logistics & Shipping',
      badgeBgClass: 'bg-cyan-500/10',
      badgeTextClass: 'text-cyan-600 dark:text-cyan-400',
      badgeBorderClass: 'border-cyan-500/20',
      iconBgClass: 'bg-cyan-500/10',
      iconColorClass: 'text-cyan-600 dark:text-cyan-400',
      key: 'logistics'
    };
  }

  // 12. Errands & Tasks
  if (
    category.includes('errand') ||
    serviceType.includes('errand') ||
    desc.includes('errand') ||
    desc.includes('task') ||
    desc.includes('assistant') ||
    desc.includes('runner')
  ) {
    return {
      icon: ClipboardList,
      categoryName: 'Errand & Task',
      badgeBgClass: 'bg-lime-500/10',
      badgeTextClass: 'text-lime-600 dark:text-lime-400',
      badgeBorderClass: 'border-lime-500/20',
      iconBgClass: 'bg-lime-500/10',
      iconColorClass: 'text-lime-600 dark:text-lime-400',
      key: 'errands'
    };
  }

  // 13. Investment
  if (
    category.includes('invest') ||
    serviceType.includes('invest') ||
    desc.includes('investment') ||
    desc.includes('invest') ||
    desc.includes('yield') ||
    desc.includes('roi') ||
    desc.includes('portfolio') ||
    desc.includes('fixed deposit')
  ) {
    return {
      icon: TrendingUp,
      categoryName: 'Investment',
      badgeBgClass: 'bg-emerald-500/10',
      badgeTextClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBorderClass: 'border-emerald-500/20',
      iconBgClass: 'bg-emerald-500/10',
      iconColorClass: 'text-emerald-600 dark:text-emerald-400',
      key: 'investment'
    };
  }

  // 14. Crowdfunding
  if (
    category.includes('crowdfund') ||
    desc.includes('crowdfund') ||
    desc.includes('campaign') ||
    desc.includes('donate') ||
    desc.includes('donation') ||
    desc.includes('backer') ||
    desc.includes('pledge')
  ) {
    return {
      icon: Heart,
      categoryName: 'Crowdfunding',
      badgeBgClass: 'bg-pink-500/10',
      badgeTextClass: 'text-pink-600 dark:text-pink-400',
      badgeBorderClass: 'border-pink-500/20',
      iconBgClass: 'bg-pink-500/10',
      iconColorClass: 'text-pink-600 dark:text-pink-400',
      key: 'crowdfunding'
    };
  }

  // 15. Wallet Funding / Deposit
  if (
    txType === 'Deposit' ||
    desc.includes('top-up') ||
    desc.includes('topup') ||
    desc.includes('monnify') ||
    desc.includes('wallet funding') ||
    desc.includes('deposit') ||
    desc.includes('inflow')
  ) {
    return {
      icon: ArrowDownLeft,
      categoryName: 'Wallet Funding',
      badgeBgClass: 'bg-emerald-500/10',
      badgeTextClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBorderClass: 'border-emerald-500/20',
      iconBgClass: 'bg-emerald-500/10',
      iconColorClass: 'text-emerald-600 dark:text-emerald-400',
      key: 'deposit'
    };
  }

  // 16. Withdrawal
  if (
    txType === 'Withdrawal' ||
    desc.includes('withdraw') ||
    desc.includes('payout') ||
    desc.includes('transfer out')
  ) {
    return {
      icon: ArrowUpRight,
      categoryName: 'Withdrawal',
      badgeBgClass: 'bg-amber-500/10',
      badgeTextClass: 'text-amber-600 dark:text-amber-400',
      badgeBorderClass: 'border-amber-500/20',
      iconBgClass: 'bg-amber-500/10',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
      key: 'withdrawal'
    };
  }

  // Default fallback
  return {
    icon: CreditCard,
    categoryName: txType || 'Service Payment',
    badgeBgClass: 'bg-primary/10',
    badgeTextClass: 'text-primary',
    badgeBorderClass: 'border-primary/20',
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary',
    key: 'default'
  };
}
