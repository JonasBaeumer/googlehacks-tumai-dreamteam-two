import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Code, FileText } from "lucide-react";
import { type Github } from "@/lib/schemas";
import MetricCard from "./MetricCard";

interface GithubStatsProps {
  githubData: Github | null;
  isLoading?: boolean;
}

const GithubStats = ({ githubData, isLoading }: GithubStatsProps) => {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MetricCard 
                key={i}
                title="Loading..."
                value="..."
                icon={Code}
                isLoading={true}
              />
            ))}
          </div>
          <div className="animate-pulse grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!githubData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <GitBranch className="h-5 w-5" />
            GitHub Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No GitHub data available
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Connect your GitHub account to see your coding stats
          </p>
        </CardContent>
      </Card>
    );
  }

  const languageColors: Record<string, string> = {
    TypeScript: "bg-blue-500",
    JavaScript: "bg-yellow-500",
    Python: "bg-green-500",
    Java: "bg-orange-500",
    "C++": "bg-purple-500",
    Go: "bg-cyan-500",
    Rust: "bg-red-500",
    CSS: "bg-pink-500",
    HTML: "bg-orange-600",
    JSON: "bg-gray-500",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          GitHub Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            title="Total Commits"
            value={githubData.number_of_commits}
            icon={GitBranch}
            subtitle="All time"
            trend={
              githubData.number_of_commits > 50 
                ? { value: 12, isPositive: true }
                : undefined
            }
          />
          
          <MetricCard
            title="Lines of Code"
            value={githubData.lines_of_code.toLocaleString()}
            icon={Code}
            subtitle="Total written"
            trend={
              githubData.lines_of_code > 1000 
                ? { value: 8, isPositive: true }
                : undefined
            }
          />
          
          <MetricCard
            title="Languages"
            value={githubData.languages_used.length}
            icon={FileText}
            subtitle="Different languages"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(githubData.lines_of_code / githubData.number_of_commits) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Lines per Commit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {githubData.number_of_commits > 0 ? "Active" : "Inactive"}
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GithubStats;