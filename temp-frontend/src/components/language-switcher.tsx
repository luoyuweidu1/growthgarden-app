import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === 'en' ? '中文' : 'English'}
    </Button>
  );
} 