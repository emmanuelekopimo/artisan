import {
  BadgeCheck, Car, Clock, Droplets, Hammer, MapPin, PaintRoller, Scissors, Star, Wrench, Zap, Search,
  ShieldCheck, MessageSquareQuote, Briefcase, Phone, CheckCircle2, XCircle, Hourglass, Upload, Trash2,
  ArrowRight, User, LogOut, LayoutDashboard, Users, FileText, Camera, CircleAlert, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  droplets: Droplets, zap: Zap, scissors: Scissors, car: Car, hammer: Hammer, "paint-roller": PaintRoller,
  wrench: Wrench, star: Star, "map-pin": MapPin, "badge-check": BadgeCheck, clock: Clock, search: Search,
  "shield-check": ShieldCheck, quote: MessageSquareQuote, briefcase: Briefcase, phone: Phone,
  check: CheckCircle2, x: XCircle, hourglass: Hourglass, upload: Upload, trash: Trash2, arrow: ArrowRight,
  user: User, logout: LogOut, dashboard: LayoutDashboard, users: Users, file: FileText, camera: Camera,
  alert: CircleAlert,
};

export function Icon({ name, size = 20, color, strokeWidth = 2, className }: {
  name: string; size?: number; color?: string; strokeWidth?: number; className?: string;
}) {
  const Cmp = ICONS[name] ?? Wrench;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} className={className} aria-hidden />;
}

/** Brand colour for each trade (matches the generated artwork). */
export const CATEGORY_COLOR: Record<string, string> = {
  plumber: "#276EF1", electrician: "#E8A500", tailor: "#7356BF",
  mechanic: "#E11900", carpenter: "#99644C", painter: "#05A357",
};
