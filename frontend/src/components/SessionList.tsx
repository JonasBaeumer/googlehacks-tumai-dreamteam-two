import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { type Session } from "@/lib/schemas";
import { formatDuration, formatTimeAgo } from "@/lib/api";
import SourceBadge from "./SourceBadge";
import TopicPill from "./TopicPill";

interface SessionListProps {
  sessions: Session[] | null;
  isLoading?: boolean;
}

const SessionList = ({ sessions, isLoading }: SessionListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-16"></div>
                      <div className="h-5 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No sessions yet—start your streak!
            </h3>
            <p className="text-sm text-muted-foreground">
              Start coding to see your activity sessions here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 10).map((session, index) => {
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            
            return (
              <div 
                key={session.id || index} 
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  {/* Time Range */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {startTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                      {' - '}
                      {endTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      ({formatTimeAgo(session.start_time)})
                    </span>
                  </div>

                  {/* Sources */}
                  {session.sources.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Sources:</span>
                      <div className="flex gap-1 flex-wrap">
                        {session.sources.map((source) => (
                          <SourceBadge key={source} source={source} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {session.topics.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Topics:</span>
                      <div className="flex gap-1 flex-wrap">
                        {session.topics.slice(0, 3).map((topic) => (
                          <TopicPill key={topic} topic={topic} />
                        ))}
                        {session.topics.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{session.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    {formatDuration(session.duration)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {startTime.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 10 && (
          <div className="text-center mt-4">
            <button className="text-sm text-primary hover:underline">
              View all sessions ({sessions.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionList;