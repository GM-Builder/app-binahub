import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TrendIcon({ trend, size = 14 }: { trend: string; size?: number }) {
  if (trend === "up") return <TrendingUp size={size} className="text-emerald-500" />;
  if (trend === "down") return <TrendingDown size={size} className="text-red-500" />;
  return <Minus size={size} className="text-slate-400" />;
}
