import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function KPICard({ label, value, icon: Icon, trend, className }: KPICardProps) {
    return (
        <div className={cn("rounded-xl border bg-white p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <div className="rounded-lg bg-gray-100 p-2">
                    <Icon className="h-4 w-4 text-gray-700" />
                </div>
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {trend && (
                    <div className="mt-1 flex items-center text-xs">
                        <span
                            className={cn(
                                "font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                        <span className="ml-1 text-gray-500">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
}
