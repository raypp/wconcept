import { cn } from '../lib/utils';

interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
    className?: string;
}

export function MetricCard({ label, value, unit, className }: MetricCardProps) {
    return (
        <div className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}>
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {unit && <span className="text-sm text-gray-600">{unit}</span>}
            </div>
        </div>
    );
}
