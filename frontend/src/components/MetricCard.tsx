import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className = "",
  isLoading 
}: MetricCardProps) => {
  if (isLoading) {
    return (
      <Card className={`transition-all hover:shadow-md ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all hover:shadow-md hover:scale-105 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {subtitle && (
                <span className="text-muted-foreground">{subtitle}</span>
              )}
              
              {trend && (
                <span className={`flex items-center gap-1 ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`}>
                  {trend.isPositive ? '↗' : '↘'}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;