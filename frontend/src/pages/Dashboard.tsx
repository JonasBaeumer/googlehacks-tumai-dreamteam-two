import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api, calculateStreaks, calculateXPProgress } from "@/lib/api";
import { type Session, type TopicStats, type Daily, type Github, type XP, type Streak } from "@/lib/schemas";

// Components
import Navbar from "@/components/Navbar";
import StreakBanner from "@/components/StreakBanner";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import XPBar from "@/components/XPBar";
import MonthlyProgress from "@/components/MonthlyProgress";
import GithubStats from "@/components/GithubStats";
import SessionList from "@/components/SessionList";

const Dashboard = () => {
  // State
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [topics, setTopics] = useState<TopicStats[] | null>(null);
  const [dailyData, setDailyData] = useState<Daily[] | null>(null);
  const [githubData, setGithubData] = useState<Github | null>(null);
  const [xpData, setXPData] = useState<XP | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 Starting data fetch...");
      setIsLoading(true);
      
      try {
        console.log("📡 Making API calls...");
        // Fetch all data in parallel
        const [sessionsResponse, topicsResponse, dailyResponse, githubResponse, xpResponse] = 
          await Promise.all([
            api.getSessions(1, 20),
            api.getTopics(),
            api.getDaily(),
            api.getGithub(),
            api.getXP(),
          ]);

        console.log("📊 API Responses:", {
          sessions: sessionsResponse,
          topics: topicsResponse,
          daily: dailyResponse,
          github: githubResponse,
          xp: xpResponse
        });

        // Update state
        setSessions(sessionsResponse?.data || null);
        setTopics(topicsResponse);
        setDailyData(dailyResponse);
        setGithubData(githubResponse);
        setXPData(xpResponse);

        // Calculate streak from daily data
        if (dailyResponse) {
          const calculatedStreak = calculateStreaks(dailyResponse);
          console.log("🔥 Calculated streak:", calculatedStreak);
          setStreak(calculatedStreak);
        }

        // Show success message if we have data
        if (sessionsResponse || topicsResponse || dailyResponse || githubResponse || xpResponse) {
          toast({
            title: "Data loaded successfully",
            description: "Your coding activity has been updated.",
          });
        } else {
          console.warn("⚠️ No data received from any endpoint");
        }
      } catch (error) {
        console.error("❌ Failed to fetch dashboard data:", error);
        toast({
          title: "Failed to load dashboard",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log("✅ Data fetch completed");
      }
    };

    fetchData();
  }, [toast]);

  // Calculate current level from XP
  const currentLevel = xpData ? calculateXPProgress(xpData.total_xp).currentTier : null;
  const currentLevelIndex = currentLevel ? 
    ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'].indexOf(currentLevel.name) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero / Streak Banner */}
        <StreakBanner 
          streak={streak} 
          currentLevel={currentLevelIndex}
          githubData={githubData}
          isLoading={isLoading} 
        />

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* Top Row: Activity Heatmap + XP Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityHeatmap 
                dailyData={dailyData} 
                isLoading={isLoading} 
              />
            </div>
            <div className="lg:col-span-1">
              <XPBar 
                xpData={xpData} 
                isLoading={isLoading} 
              />
            </div>
          </div>

          {/* Monthly Progress - Full Width */}
          <MonthlyProgress 
            dailyData={dailyData} 
            isLoading={isLoading} 
          />

          {/* Bottom Row: GitHub Stats + Recent Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GithubStats 
              githubData={githubData} 
              isLoading={isLoading} 
            />
            <SessionList 
              sessions={sessions} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">
            CodeStreak - Turn your coding journey into an epic adventure 🚀
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Built with React, TypeScript, Tailwind CSS, and lots of ☕
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;