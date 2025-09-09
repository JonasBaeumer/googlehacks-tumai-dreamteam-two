import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { type Daily } from "@/lib/schemas";
import { formatDuration } from "@/lib/api";

interface MonthlyProgressProps {
  dailyData: Daily[] | null;
  isLoading?: boolean;
}

const MonthlyProgress = ({ dailyData, isLoading }: MonthlyProgressProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
            <div className="flex justify-between mt-4">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Monthly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No progress data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get current month data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyData = dailyData
    .filter(day => {
      const date = new Date(day.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(day => ({
      date: new Date(day.date).getDate(),
      minutes: Math.round(day.total_time_spent / (1000 * 60)),
      sessions: day.number_of_sessions,
      formattedDate: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));

  // Calculate monthly stats
  const totalMinutes = monthlyData.reduce((sum, day) => sum + day.minutes, 0);
  const totalSessions = monthlyData.reduce((sum, day) => sum + day.sessions, 0);
  const activeDays = monthlyData.filter(day => day.minutes > 0).length;
  const averageDaily = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Monthly Progress - {monthName}
          </div>
          <div className="text-sm text-muted-foreground">
            {activeDays} active days
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(totalMinutes * 60 * 1000)}
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{activeDays}</div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{averageDaily}m</div>
              <div className="text-xs text-muted-foreground">Daily Avg</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ 
                    value: 'Minutes', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
                  }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.formattedDate}</p>
                          <p className="text-primary">
                            {data.minutes} minutes ({data.sessions} session{data.sessions !== 1 ? 's' : ''})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMinutes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Insights */}
          {monthlyData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {activeDays > 15 
                    ? "Great consistency this month! 🔥" 
                    : activeDays > 7 
                    ? "Good progress, keep it up! 💪"
                    : "Room for improvement - try to code more regularly 📈"
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyProgress;