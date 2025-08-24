import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, TrendingUp, Lightbulb, Calendar, ChevronRight, History } from "lucide-react";
import type { Action } from "@shared/schema";
import { HistoricalReports } from "./historical-reports";
import { useLanguage } from "@/contexts/language-context";

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  feelingDistribution: {
    feeling: string;
    emoji: string;
    count: number;
    percentage: number;
    actions: string[];
  }[];
  accomplishments: {
    totalActions: number;
    totalXP: number;
    achievements: string[];
    streak: number;
    story: string;
  };
  learningSummary: {
    insights: string[];
    patterns: string[];
    recommendations: string[];
  };
  aiAnalysis: {
    positivePatterns: string;
    negativePatterns: string;
    growthAreas: string;
  };
}

interface WeeklyReflectionReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const feelingEmojis: Record<string, string> = {
  "Happy": "😊",
  "Excited": "🎉",
  "Relaxed": "😌",
  "Accomplished": "💪",
  "Relieved": "😌",
  "Confident": "😎",
  "Thoughtful": "🤔",
  "Tired": "😴",
  "Stressed": "😅",
  "Frustrated": "😤",
  "Grateful": "😇",
  "Proud": "🤗",
};

export function WeeklyReflectionReport({ isOpen, onClose }: WeeklyReflectionReportProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isHistoricalReportsOpen, setIsHistoricalReportsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports/weekly-reflection");
      return response.json();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to generate weekly report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const regenerateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports/regenerate-insights");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/weekly-reflection"] });
      toast({
        title: "AI Insights Regenerated!",
        description: "Your weekly insights have been updated with the latest data.",
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to regenerate AI insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: report, isLoading } = useQuery<WeeklyReport>({
    queryKey: ["/api/reports/weekly-reflection"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reports/weekly-reflection");
      return response.json();
    },
    enabled: isOpen,
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  const handleRegenerateInsights = () => {
    regenerateInsightsMutation.mutate();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto biomorphic-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-sage-800 flex items-center gap-2">
              <Sparkles className="text-primary" />
              {t('weeklyReport.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sage-600">{t('weeklyReport.generating')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto biomorphic-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sage-800 flex items-center gap-2">
            <Sparkles className="text-primary" />
            {t('weeklyReport.title')}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sage-600">
              {report?.weekStart && report?.weekEnd && (
                <>
                  <Calendar className="inline w-4 h-4 mr-1" />
                  {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                </>
              )}
            </p>
            {report && (
              <Button
                onClick={() => setIsHistoricalReportsOpen(true)}
                variant="ghost"
                size="sm"
                className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
              >
                <History className="w-4 h-4 mr-2" />
                {t('weeklyReport.viewHistorical')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {!report && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sage-800 mb-2">{t('weeklyReport.generate')}</h3>
            <p className="text-sage-600 mb-6">
              {t('weeklyReport.generateDescription')}
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="biomorphic-button"
            >
              {generateReportMutation.isPending ? t('weeklyReport.generating') : t('weeklyReport.generateButton')}
            </Button>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Feeling Distribution */}
            <Card className="biomorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-sage-800 flex items-center gap-2">
                  <TrendingUp className="text-primary" />
                  {t('weeklyReport.feelingDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {report.feelingDistribution.map((feeling) => (
                    <button
                      key={feeling.feeling}
                      onClick={() => setSelectedFeeling(feeling.feeling)}
                      className="organic-shape p-4 text-center transition-all duration-200 hover:scale-105 bg-sage-50 hover:bg-sage-100 border border-sage-200"
                    >
                      <div className="text-2xl mb-2">{feeling.emoji}</div>
                      <div className="text-sm font-medium text-sage-800">{feeling.feeling}</div>
                      <div className="text-xs text-sage-600">{feeling.count} times</div>
                      <div className="text-xs text-primary font-medium">{feeling.percentage}%</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accomplishment Celebration */}
            <Card className="biomorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-sage-800 flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  {t('weeklyReport.accomplishmentCelebration')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{report.accomplishments.totalActions}</div>
                    <div className="text-sm text-sage-600">{t('weeklyReport.actionsCompleted')}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-moss-500/10 to-moss-500/5 rounded-lg">
                    <div className="text-2xl font-bold text-moss-600">{report.accomplishments.totalXP}</div>
                    <div className="text-sm text-sage-600">{t('weeklyReport.xpEarned')}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-clay-500/10 to-clay-500/5 rounded-lg">
                    <div className="text-2xl font-bold text-clay-600">{report.accomplishments.streak}</div>
                    <div className="text-sm text-sage-600">{t('weeklyReport.dayStreak')}</div>
                  </div>
                </div>
                {report.accomplishments.story && (
                  <div className="mt-6">
                    <h4 className="font-medium text-sage-800 mb-3">{t('weeklyReport.yourWeeksStory')}</h4>
                    <div className="bg-gradient-to-r from-primary/5 to-moss-500/5 p-4 rounded-lg border border-primary/10">
                      <p className="text-sage-700 leading-relaxed text-sm">
                        {report.accomplishments.story}
                      </p>
                    </div>
                  </div>
                )}
                
                {report.accomplishments.achievements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sage-800 mb-2">{t('weeklyReport.achievementsUnlocked')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.accomplishments.achievements.map((achievement, index) => (
                        <Badge key={index} variant="secondary" className="biomorphic-button">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Summary */}
            <Card className="biomorphic-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-sage-800 flex items-center gap-2">
                  <Lightbulb className="text-primary" />
                  {t('weeklyReport.learningSummary')}
                  <Button
                    onClick={handleRegenerateInsights}
                    disabled={regenerateInsightsMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className="ml-auto organic-shape hover:bg-sage-100/50 transition-all duration-300"
                  >
                    {regenerateInsightsMutation.isPending ? t('weeklyReport.regenerating') : t('weeklyReport.regenerateAI')}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.learningSummary.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sage-800 mb-2">{t('weeklyReport.keyInsights')}:</h4>
                    <ul className="space-y-1">
                      {report.learningSummary.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.learningSummary.patterns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sage-800 mb-2">Patterns Noticed:</h4>
                    <ul className="space-y-1">
                      {report.learningSummary.patterns.map((pattern, index) => (
                        <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                          <span className="text-moss-600 mt-1">•</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.learningSummary.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sage-800 mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {report.learningSummary.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                          <span className="text-clay-600 mt-1">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feeling Detail Modal */}
        <Dialog open={!!selectedFeeling} onOpenChange={() => setSelectedFeeling(null)}>
          <DialogContent className="max-w-2xl biomorphic-card">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-sage-800 flex items-center gap-2">
                {selectedFeeling && feelingEmojis[selectedFeeling]} {selectedFeeling}
              </DialogTitle>
            </DialogHeader>
            {selectedFeeling && report && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sage-800 mb-2">Actions that led to this feeling:</h4>
                  <ul className="space-y-1">
                    {report.feelingDistribution
                      .find(f => f.feeling === selectedFeeling)
                      ?.actions.map((action, index) => (
                        <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {action}
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sage-800 mb-2">AI Analysis:</h4>
                  <div className="text-sm text-sage-600 space-y-2">
                    {selectedFeeling && ["Happy", "Excited", "Accomplished", "Confident", "Proud", "Grateful"].includes(selectedFeeling) ? (
                      <p>{report.aiAnalysis.positivePatterns}</p>
                    ) : (
                      <p>{report.aiAnalysis.negativePatterns}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Historical Reports Modal */}
        <HistoricalReports
          isOpen={isHistoricalReportsOpen}
          onClose={() => setIsHistoricalReportsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
} 