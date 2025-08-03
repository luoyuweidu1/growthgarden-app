import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { History, Calendar, TrendingUp, Sparkles, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";

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

interface HistoricalReportsProps {
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

export function HistoricalReports({ isOpen, onClose }: HistoricalReportsProps) {
  const [selectedWeeks, setSelectedWeeks] = useState("8");
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: reports, isLoading } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/reports/historical", selectedWeeks],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/reports/historical?weeks=${selectedWeeks}`);
      return response.json();
    },
    enabled: isOpen,
  });

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getTopFeeling = (report: WeeklyReport) => {
    if (report.feelingDistribution.length === 0) return null;
    return report.feelingDistribution.reduce((prev, current) => 
      (prev.percentage > current.percentage) ? prev : current
    );
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto biomorphic-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-sage-800 flex items-center gap-2">
              <History className="text-primary" />
              Historical Reports
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sage-600">Loading your historical insights...</p>
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
            <History className="text-primary" />
            Historical Reports
          </DialogTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sage-600" />
              <span className="text-sm text-sage-600">Show last:</span>
              <Select value={selectedWeeks} onValueChange={setSelectedWeeks}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                  <SelectItem value="16">16 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {!reports || reports.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sage-800 mb-2">No Historical Data</h3>
            <p className="text-sage-600 mb-6">
              Complete some actions with reflections to generate historical reports.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => {
              const topFeeling = getTopFeeling(report);
              return (
                <Card key={index} className="biomorphic-card hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{topFeeling?.emoji || "📊"}</div>
                        <div>
                          <h3 className="font-semibold text-sage-800">
                            {formatWeekRange(report.weekStart, report.weekEnd)}
                          </h3>
                          <p className="text-sm text-sage-600">
                            {report.accomplishments.totalActions} actions • {report.accomplishments.totalXP} XP • {report.accomplishments.streak} day streak
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {topFeeling && (
                          <Badge variant="secondary" className="text-xs">
                            {topFeeling.feeling} ({topFeeling.percentage}%)
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-sage-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detailed Report Modal */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto biomorphic-card">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-sage-800 flex items-center gap-2">
                <Sparkles className="text-primary" />
                Weekly Report
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="ml-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </DialogTitle>
              <p className="text-sage-600">
                {selectedReport && (
                  <>
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {formatWeekRange(selectedReport.weekStart, selectedReport.weekEnd)}
                  </>
                )}
              </p>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6">
                {/* Feeling Distribution */}
                <Card className="biomorphic-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-sage-800 flex items-center gap-2">
                      <TrendingUp className="text-primary" />
                      Feeling Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {selectedReport.feelingDistribution.map((feeling) => (
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
                      Accomplishment Celebration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedReport.accomplishments.totalActions}</div>
                        <div className="text-sm text-sage-600">Actions Completed</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-moss-500/10 to-moss-500/5 rounded-lg">
                        <div className="text-2xl font-bold text-moss-600">{selectedReport.accomplishments.totalXP}</div>
                        <div className="text-sm text-sage-600">XP Earned</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-clay-500/10 to-clay-500/5 rounded-lg">
                        <div className="text-2xl font-bold text-clay-600">{selectedReport.accomplishments.streak}</div>
                        <div className="text-sm text-sage-600">Day Streak</div>
                      </div>
                    </div>
                    {selectedReport.accomplishments.story && (
                      <div className="mt-6">
                        <h4 className="font-medium text-sage-800 mb-3">Your Week's Story:</h4>
                        <div className="bg-gradient-to-r from-primary/5 to-moss-500/5 p-4 rounded-lg border border-primary/10">
                          <p className="text-sage-700 leading-relaxed text-sm">
                            {selectedReport.accomplishments.story}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedReport.accomplishments.achievements.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sage-800 mb-2">Achievements Unlocked:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.accomplishments.achievements.map((achievement, index) => (
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
                      Learning Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedReport.learningSummary.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sage-800 mb-2">Key Insights:</h4>
                        <ul className="space-y-1">
                          {selectedReport.learningSummary.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.learningSummary.patterns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sage-800 mb-2">Patterns Noticed:</h4>
                        <ul className="space-y-1">
                          {selectedReport.learningSummary.patterns.map((pattern, index) => (
                            <li key={index} className="text-sm text-sage-600 flex items-start gap-2">
                              <span className="text-moss-600 mt-1">•</span>
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReport.learningSummary.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sage-800 mb-2">Recommendations:</h4>
                        <ul className="space-y-1">
                          {selectedReport.learningSummary.recommendations.map((recommendation, index) => (
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
                {selectedFeeling && selectedReport && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sage-800 mb-2">Actions that led to this feeling:</h4>
                      <ul className="space-y-1">
                        {selectedReport.feelingDistribution
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
                          <p>{selectedReport.aiAnalysis.positivePatterns}</p>
                        ) : (
                          <p>{selectedReport.aiAnalysis.negativePatterns}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 