import {
  Book, BookOpen, Bot, Box, Braces, Code, EyeOff, Fingerprint, Gauge, Globe, type LucideIcon, Monitor, Package, Play, PlayCircle, Plug,
  Radar, Rocket, Server, Shield, Signpost, SlidersHorizontal, Smartphone, Sparkles, SquareTerminal, Target, UserPlus, Users,
} from 'lucide-react';
import { Brand, type BrandName } from '../brand';
import { UcIcon } from '../use-cases/UcIcon';

const ICONS: Record<string, LucideIcon> = {
  book: Book, 'book-open': BookOpen, bot: Bot, box: Box, braces: Braces, code: Code, 'eye-off': EyeOff, fingerprint: Fingerprint,
  gauge: Gauge, globe: Globe, monitor: Monitor, package: Package, play: Play, 'play-circle': PlayCircle, plug: Plug, radar: Radar,
  rocket: Rocket, server: Server, shield: Shield, signpost: Signpost, smartphone: Smartphone, sliders: SlidersHorizontal, sparkles: Sparkles,
  terminal: SquareTerminal, target: Target, 'user-plus': UserPlus, users: Users,
};

/** A lucide icon by name, or a technology logo for "brand:<name>" (single colour, so it follows the text colour). */
export function PageIcon({ name, size = 16 }: { name: string; size?: number }) {
  if (name.startsWith('brand:')) return <Brand name={name.slice(6) as BrandName} size={size} mono />;
  const Icon = ICONS[name];
  if (!Icon) return <UcIcon name={name} size={size} />;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
