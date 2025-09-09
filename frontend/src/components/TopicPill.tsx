import { Badge } from "@/components/ui/badge";
import { 
  Code2, 
  Palette, 
  Database, 
  Server, 
  Smartphone,
  Globe,
  Cpu,
  Shield,
  BarChart3,
  Zap
} from "lucide-react";

interface TopicPillProps {
  topic: string;
  size?: "sm" | "md";
}

const TopicPill = ({ topic, size = "sm" }: TopicPillProps) => {
  const getTopicConfig = (topic: string) => {
    const lowerTopic = topic.toLowerCase();
    
    const topicMap: Record<string, {
      icon: any;
      color: string;
      bgColor: string;
    }> = {
      // Frontend
      react: { icon: Code2, color: "text-blue-600", bgColor: "bg-blue-50" },
      vue: { icon: Code2, color: "text-green-600", bgColor: "bg-green-50" },
      angular: { icon: Code2, color: "text-red-600", bgColor: "bg-red-50" },
      javascript: { icon: Code2, color: "text-yellow-600", bgColor: "bg-yellow-50" },
      typescript: { icon: Code2, color: "text-blue-700", bgColor: "bg-blue-50" },
      html: { icon: Globe, color: "text-orange-600", bgColor: "bg-orange-50" },
      css: { icon: Palette, color: "text-pink-600", bgColor: "bg-pink-50" },
      
      // Backend
      nodejs: { icon: Server, color: "text-green-600", bgColor: "bg-green-50" },
      python: { icon: Server, color: "text-green-700", bgColor: "bg-green-50" },
      java: { icon: Server, color: "text-orange-700", bgColor: "bg-orange-50" },
      go: { icon: Server, color: "text-cyan-600", bgColor: "bg-cyan-50" },
      rust: { icon: Server, color: "text-red-700", bgColor: "bg-red-50" },
      
      // Database
      database: { icon: Database, color: "text-purple-600", bgColor: "bg-purple-50" },
      sql: { icon: Database, color: "text-purple-600", bgColor: "bg-purple-50" },
      mongodb: { icon: Database, color: "text-green-600", bgColor: "bg-green-50" },
      postgresql: { icon: Database, color: "text-blue-600", bgColor: "bg-blue-50" },
      
      // Mobile
      mobile: { icon: Smartphone, color: "text-purple-600", bgColor: "bg-purple-50" },
      ios: { icon: Smartphone, color: "text-gray-700", bgColor: "bg-gray-50" },
      android: { icon: Smartphone, color: "text-green-600", bgColor: "bg-green-50" },
      
      // DevOps/Infrastructure
      docker: { icon: Cpu, color: "text-blue-600", bgColor: "bg-blue-50" },
      kubernetes: { icon: Cpu, color: "text-blue-700", bgColor: "bg-blue-50" },
      aws: { icon: Cpu, color: "text-orange-600", bgColor: "bg-orange-50" },
      
      // Security
      security: { icon: Shield, color: "text-red-600", bgColor: "bg-red-50" },
      auth: { icon: Shield, color: "text-red-600", bgColor: "bg-red-50" },
      
      // Data/Analytics
      analytics: { icon: BarChart3, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      data: { icon: BarChart3, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      
      // General/API
      api: { icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
      apis: { icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
      rest: { icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
      graphql: { icon: Zap, color: "text-purple-600", bgColor: "bg-purple-50" },
    };

    // Try exact match first
    if (topicMap[lowerTopic]) {
      return topicMap[lowerTopic];
    }

    // Try partial matches for compound topics
    for (const [key, config] of Object.entries(topicMap)) {
      if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
        return config;
      }
    }

    // Default fallback
    return {
      icon: Code2,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    };
  };

  const config = getTopicConfig(topic);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <Badge 
      variant="outline"
      className={`
        ${sizeClasses[size]} 
        ${config.bgColor} 
        ${config.color} 
        border-current/20
        hover:opacity-80 
        transition-opacity
        flex items-center gap-1
      `}
    >
      <Icon className="h-3 w-3" />
      {topic}
    </Badge>
  );
};

export default TopicPill;