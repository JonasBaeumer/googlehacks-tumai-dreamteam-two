import { Badge } from "@/components/ui/badge";

interface LanguageBadgesProps {
  languages: string[];
}

const LanguageBadges = ({ languages }: LanguageBadgesProps) => {
  const languageLogos: Record<string, string> = {
    "TypeScript": "/lovable-uploads/034ce10b-6926-412d-b2b1-f3a318c1fdfc.png",
    "JavaScript": "/lovable-uploads/4e22a6c3-f836-4b2e-b155-4ee65eee0146.png", 
    "Python": "/lovable-uploads/ef3eda9c-d436-4a86-a65d-673ec3a2935c.png",
    "C++": "/lovable-uploads/7aa49e39-39d5-4afc-bb08-00cc7ddbee13.png",
    "React": "/lovable-uploads/6e8e30c5-e15b-4631-875c-16f96877d00b.png",
  };

  const languageColors: Record<string, string> = {
    "TypeScript": "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30",
    "JavaScript": "bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30", 
    "Python": "bg-green-500/20 border-green-500/30 hover:bg-green-500/30",
    "C++": "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30",
    "React": "bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30",
  };

  if (!languages || languages.length === 0) {
    return null;
  }

  // Filter to only show languages that have logos
  const languagesWithLogos = languages.filter(language => languageLogos[language]);
  
  if (languagesWithLogos.length === 0) {
    return null;
  }

  // Show top 5 languages with logos
  const topLanguages = languagesWithLogos.slice(0, 5);

  return (
    <div className="flex flex-wrap gap-2">
      {topLanguages.map((language) => {
        const logoUrl = languageLogos[language];
        const colorClass = languageColors[language] || "bg-muted/20 border-muted/30 hover:bg-muted/30";
        
        return (
          <Badge
            key={language}
            variant="outline"
            className={`
              flex items-center gap-2 px-3 py-1.5 
              ${colorClass}
              transition-all duration-200 
              backdrop-blur-sm
              text-white border
            `}
          >
            <img 
              src={logoUrl} 
              alt={`${language} logo`}
              className="w-4 h-4 object-contain"
            />
            <span className="text-sm font-medium">{language}</span>
          </Badge>
        );
      })}
    </div>
  );
};

export default LanguageBadges;