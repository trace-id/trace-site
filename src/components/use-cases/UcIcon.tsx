import {
  Ban, Bot, Coins, CreditCard, Gamepad2, Gift, Globe, KeyRound, Landmark, LayoutDashboard, LockKeyhole, type LucideIcon, MapPin,
  MessageSquare, MessagesSquare, Newspaper, Plane, PlaySquare, Receipt, ScanSearch, Share2, ShieldCheck, ShoppingCart, Sparkles, Star,
  Store, Ticket, Timer, Trophy, UserPlus, Users, WalletCards,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ban: Ban, bot: Bot, coins: Coins, 'credit-card': CreditCard, 'gamepad-2': Gamepad2, gift: Gift, globe: Globe, 'key-round': KeyRound,
  landmark: Landmark, 'layout-dashboard': LayoutDashboard, 'lock-keyhole': LockKeyhole, 'map-pin': MapPin, 'message-square': MessageSquare,
  'messages-square': MessagesSquare, newspaper: Newspaper, plane: Plane, 'play-square': PlaySquare, receipt: Receipt,
  'scan-search': ScanSearch, 'share-2': Share2, 'shield-check': ShieldCheck, 'shopping-cart': ShoppingCart, sparkles: Sparkles,
  star: Star, store: Store, ticket: Ticket, timer: Timer, trophy: Trophy, 'user-plus': UserPlus, users: Users, 'wallet-cards': WalletCards,
};

export function UcIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? ShieldCheck;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
