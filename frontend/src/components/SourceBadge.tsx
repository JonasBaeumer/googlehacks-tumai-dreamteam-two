import { Badge } from "@/components/ui/badge";
import { 
  Github, 
  Globe, 
  FileText, 
  BookOpen, 
  Video, 
  Coffee,
  Code,
  Search
} from "lucide-react";

interface SourceBadgeProps {
  source: string;
  size?: "sm" | "md";
}

const SourceBadge = ({ source, size = "sm" }: SourceBadgeProps) => {
  const getSourceConfig = (source: string) => {
    const lowerSource = source.toLowerCase();
    
    // Map sources to their display configs
    const sourceMap: Record<string, {
      label: string;
      icon: any;
      color: string;
      bgColor: string;
    }> = {
      github: {
        label: "GitHub",
        icon: Github,
        color: "text-gray-700",
        bgColor: "bg-gray-100"
      },
      stackoverflow: {
        label: "Stack Overflow",
        icon: Search,
        color: "text-orange-600",
        bgColor: "bg-orange-50"
      },
      mdn: {
        label: "MDN",
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      documentation: {
        label: "Docs",
        icon: BookOpen,
        color: "text-green-600",
        bgColor: "bg-green-50"
      },
      youtube: {
        label: "YouTube",
        icon: Video,
        color: "text-red-600",
        bgColor: "bg-red-50"
      },
      tutorial: {
        label: "Tutorial",
        icon: BookOpen,
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      coding: {
        label: "Coding",
        icon: Code,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
      },
      web: {
        label: "Web",
        icon: Globe,
        color: "text-blue-500",
        bgColor: "bg-blue-50"
      }
    };

    // Try exact match first
    if (sourceMap[lowerSource]) {
      return sourceMap[lowerSource];
    }

    // Try partial matches
    for (const [key, config] of Object.entries(sourceMap)) {
      if (lowerSource.includes(key) || key.includes(lowerSource)) {
        return config;
      }
    }

    // Default fallback
    return {
      label: source.charAt(0).toUpperCase() + source.slice(1),
      icon: Globe,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    };
  };

  const config = getSourceConfig(source);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <Badge 
      variant="secondary"
      className={`
        ${sizeClasses[size]} 
        ${config.bgColor} 
        ${config.color} 
        border-0 
        hover:opacity-80 
        transition-opacity
        flex items-center gap-1
      `}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default SourceBadge;