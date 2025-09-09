import { Trophy, Flame, Calendar, Target, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Streak, type Github } from "@/lib/schemas";
import { XP_TIERS } from "@/lib/schemas";
import LanguageBadges from "./LanguageBadges";

interface StreakBannerProps {
  streak: Streak | null;
  currentLevel?: number;
  githubData?: Github | null;
  isLoading?: boolean;
}

const StreakBanner = ({ streak, currentLevel = 0, githubData, isLoading }: StreakBannerProps) => {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-hero border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-primary/10 rounded w-48 mb-4"></div>
            <div className="h-12 bg-primary/10 rounded w-32 mb-4"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-16 bg-primary/10 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const lastActive = streak?.last_active_day;

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your coding streak today!";
    if (currentStreak === 1) return "Great start! Keep it going!";
    if (currentStreak < 7) return "Building momentum!";
    if (currentStreak < 30) return "You're on fire! 🔥";
    if (currentStreak < 100) return "Streak legend in the making!";
    return "Coding Master! 🚀";
  };

  const getNextMilestone = () => {
    const milestones = [7, 14, 30, 50, 100, 200, 300];
    const next = milestones.find(m => m > currentStreak);
    return next || null;
  };

  const nextMilestone = getNextMilestone();

  return (
    <Card className="relative overflow-hidden bg-gradient-hero border-primary/20 shadow-glow">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
      <CardContent className="relative p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Section: Streak Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-6 w-6 text-white animate-pulse" />
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {getStreakMessage()}
              </h2>
            </div>
            
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{currentStreak}</div>
                <div className="text-sm text-white/80">Current Streak</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{longestStreak}</div>
                <div className="text-sm text-white/80">Best Streak</div>
              </div>
              
              {lastActive && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {new Date(lastActive).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-white/80">Last Active</div>
                </div>
              )}
            </div>

            {nextMilestone && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Target className="h-4 w-4" />
                <span>{nextMilestone - currentStreak} days to {nextMilestone}-day milestone</span>
              </div>
            )}
          </div>

          {/* Right Section: Achievement Tiers + Languages */}
          <div className="flex-shrink-0 space-y-4">
            {/* Achievement Tiers */}
            <div>
              <div className="text-center mb-3">
                <Trophy className="h-6 w-6 text-white mx-auto mb-1" />
                <h3 className="text-sm font-medium text-white/80">Achievement Tiers</h3>
              </div>
              
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {XP_TIERS.slice(0, 6).map((tier, index) => {
                  const isUnlocked = currentLevel >= index;
                  const isCurrent = currentLevel === index;
                  
                  return (
                    <div key={tier.name} className="text-center">
                      <Badge 
                        variant={isCurrent ? "default" : isUnlocked ? "secondary" : "outline"}
                        className={`
                          px-2 py-1 text-xs transition-all duration-300
                          ${isCurrent ? "shadow-glow animate-pulse" : ""}
                          ${!isUnlocked ? "opacity-50" : ""}
                        `}
                        style={{ 
                          backgroundColor: isUnlocked ? `hsl(var(--${tier.color}))` : undefined,
                          color: isUnlocked ? "white" : undefined 
                        }}
                      >
                        {tier.name}
                      </Badge>
                      <div className="text-xs text-white/70 mt-1">
                        {tier.threshold}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Languages */}
            {githubData?.languages_used && githubData.languages_used.length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Code2 className="h-4 w-4 text-white/80" />
                  <span className="text-sm font-medium text-white/80">Top Languages</span>
                </div>
                <div className="flex justify-center">
                  <LanguageBadges languages={githubData.languages_used} />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakBanner;