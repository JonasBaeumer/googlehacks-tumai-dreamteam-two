import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Code, GitBranch, Calendar, Play } from "lucide-react";
import { type XP } from "@/lib/schemas";
import { calculateXPProgress } from "@/lib/api";

interface XPBarProps {
  xpData: XP | null;
  isLoading?: boolean;
  timeframe?: "daily" | "weekly" | "monthly";
}

const XPBar = ({ xpData, isLoading, timeframe = "daily" }: XPBarProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Experience Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!xpData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Experience Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No XP data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateXPProgress(xpData.total_xp);
  
  const xpSources = [
    { 
      name: "Sessions", 
      value: xpData.session_xp, 
      icon: Code, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      name: "GitHub", 
      value: xpData.github_xp, 
      icon: GitBranch, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      name: "Topics", 
      value: xpData.topic_xp, 
      icon: Zap, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      name: "Daily", 
      value: xpData.daily_xp, 
      icon: Calendar, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      name: "Stream", 
      value: xpData.stream_xp, 
      icon: Play, 
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Experience Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={timeframe} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            <XPContent xpData={xpData} progress={progress} xpSources={xpSources} />
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4">
            <XPContent xpData={xpData} progress={progress} xpSources={xpSources} />
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            <XPContent xpData={xpData} progress={progress} xpSources={xpSources} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface XPContentProps {
  xpData: XP;
  progress: ReturnType<typeof calculateXPProgress>;
  xpSources: Array<{
    name: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
  }>;
}

const XPContent = ({ xpData, progress, xpSources }: XPContentProps) => {
  return (
    <>
      {/* Current Level & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              className="px-3 py-1"
              style={{ 
                backgroundColor: `hsl(var(--${progress.currentTier.color}))`,
                color: "white"
              }}
            >
              {progress.currentTier.name}
            </Badge>
            <span className="text-2xl font-bold">{xpData.total_xp.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">XP</span>
          </div>
          
          {progress.nextTier !== progress.currentTier && (
            <div className="text-right">
              <div className="text-sm font-medium">{progress.xpToNextTier} XP to {progress.nextTier.name}</div>
              <div className="text-xs text-muted-foreground">
                {progress.progressInCurrentTier} / {progress.nextTier.threshold - progress.currentTier.threshold}
              </div>
            </div>
          )}
        </div>
        
        {progress.nextTier !== progress.currentTier && (
          <div className="space-y-2">
            <Progress 
              value={progress.progressPercent} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.currentTier.name} ({progress.currentTier.threshold})</span>
              <span>{progress.nextTier.name} ({progress.nextTier.threshold})</span>
            </div>
          </div>
        )}
      </div>

      {/* XP Sources Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">XP Sources</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {xpSources.map((source) => {
            const Icon = source.icon;
            const percentage = xpData.total_xp > 0 ? (source.value / xpData.total_xp) * 100 : 0;
            
            return (
              <div key={source.name} className={`p-3 rounded-lg ${source.bgColor} border`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${source.color}`} />
                  <span className="text-sm font-medium">{source.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold">{source.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default XPBar;