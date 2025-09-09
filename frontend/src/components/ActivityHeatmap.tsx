import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Daily } from "@/lib/schemas";
import { formatDuration } from "@/lib/api";
import { GitCommit } from "lucide-react";

interface ActivityHeatmapProps {
  dailyData: Daily[] | null;
  isLoading?: boolean;
}

const ActivityHeatmap = ({ dailyData, isLoading }: ActivityHeatmapProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Coding Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 91 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-sm"></div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Less</span>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 52 weeks of dates arranged by weeks (like GitHub)
  const generateWeeklyData = () => {
    const weeks = [];
    const today = new Date();
    const endDate = new Date(today);
    
    // Start from 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7));
    
    // Find the start of the week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    for (let week = 0; week < 53; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        // Only include dates up to today
        if (date <= today) {
          weekDays.push(date.toISOString().split('T')[0]);
        } else {
          weekDays.push(null); // Empty cell for future dates
        }
      }
      weeks.push(weekDays);
    }
    return weeks;
  };

  // Generate month labels that align with the weeks
  const generateMonthLabels = (weeks) => {
    const monthLabels = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let currentMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstValidDate = week.find(date => date !== null);
      if (firstValidDate) {
        const date = new Date(firstValidDate);
        const month = date.getMonth();
        
        if (month !== currentMonth && weekIndex < weeks.length - 2) {
          monthLabels.push({
            week: weekIndex,
            label: monthNames[month]
          });
          currentMonth = month;
        }
      }
    });
    
    return monthLabels;
  };

  const weeklyData = generateWeeklyData();
  const monthLabels = generateMonthLabels(weeklyData);
  const dataMap = new Map(dailyData?.map(d => [d.date, d]) || []);

  const getIntensity = (totalTime: number) => {
    if (totalTime === 0) return 0;
    if (totalTime < 1800000) return 1; // < 30 min
    if (totalTime < 3600000) return 2; // < 1 hour
    if (totalTime < 7200000) return 3; // < 2 hours
    return 4; // 2+ hours
  };

  const getIntensityColor = (intensity: number) => {
    const colors = [
      "bg-muted", // 0 - no activity
      "bg-primary/20", // 1 - light
      "bg-primary/40", // 2 - medium-light
      "bg-primary/70", // 3 - medium
      "bg-primary", // 4 - high
    ];
    return colors[intensity];
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-primary" />
          Coding Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Month labels aligned with weeks */}
            <div className="flex">
              <div className="w-10"></div> {/* Space for weekday labels */}
              <div className="flex-1 relative">
                {monthLabels.map((month, index) => (
                  <div 
                    key={index}
                    className="absolute text-xs text-muted-foreground"
                    style={{ 
                      left: `${(month.week * 16)}px`, // 16px = w-3 (12px) + gap (4px)
                      top: '0px'
                    }}
                  >
                    {month.label}
                  </div>
                ))}
                <div className="h-4"></div> {/* Space for month labels */}
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1">
              {/* Weekday labels */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                {weekdays.map((day, index) => (
                  <div key={day} className="h-3 flex items-center text-right w-8">
                    {index % 2 === 1 ? day : ''} {/* Show every other day to avoid crowding */}
                  </div>
                ))}
              </div>

              {/* Activity Grid by Weeks */}
              <div className="flex gap-1 overflow-x-auto">
                {weeklyData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1 flex-shrink-0">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return <div key={dayIndex} className="w-3 h-3"></div>; // Empty space for future dates
                      }
                      
                      const dayData = dataMap.get(date);
                      const totalTime = dayData?.total_time_spent || 0;
                      const sessions = dayData?.number_of_sessions || 0;
                      const intensity = getIntensity(totalTime);
                      
                      return (
                        <Tooltip key={date}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                w-3 h-3 rounded-sm border border-border/50 
                                ${getIntensityColor(intensity)} 
                                hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer
                              `}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <div className="font-semibold">
                                {new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <div className="text-sm">
                                {sessions > 0 ? (
                                  <>
                                    <div>{sessions} session{sessions !== 1 ? 's' : ''}</div>
                                    <div>{formatDuration(totalTime)}</div>
                                    {dayData?.topics_on_that_day && dayData.topics_on_that_day.length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {dayData.topics_on_that_day.slice(0, 2).join(', ')}
                                        {dayData.topics_on_that_day.length > 2 && ` +${dayData.topics_on_that_day.length - 2}`}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  "No activity"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend and Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map(intensity => (
                    <div 
                      key={intensity}
                      className={`w-3 h-3 rounded-sm border border-border/50 ${getIntensityColor(intensity)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>

              {/* Quick Stats */}
              {dailyData && dailyData.length > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {dailyData.filter(d => d.number_of_sessions > 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {Math.round(dailyData.reduce((acc, d) => acc + d.total_time_spent, 0) / (1000 * 60 * 60))}h
                    </div>
                    <div className="text-xs text-muted-foreground">Total Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {Math.round(dailyData.reduce((acc, d) => acc + d.number_of_sessions, 0) / dailyData.filter(d => d.number_of_sessions > 0).length) || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Sessions</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;