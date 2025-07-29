import { useState } from "react";
import { Download, FileText, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { calculateGrowthAnalytics, generateDetailedGoalReport, generateActivityTrends, exportToCSV } from "@/lib/analytics";
import type { Goal, Action } from "@shared/schema";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  actions: Action[];
}

type ExportFormat = 'csv' | 'json' | 'pdf';
type ExportType = 'summary' | 'detailed' | 'analytics';

export function ExportModal({ isOpen, onClose, goals, actions }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportType, setExportType] = useState<ExportType>('summary');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const generateSummaryReport = () => {
    const analytics = calculateGrowthAnalytics(goals, actions);
    return {
      reportType: 'Growth Garden Summary Report',
      generatedAt: new Date().toISOString(),
      analytics,
      goals: goals.map(goal => ({
        name: goal.name,
        type: goal.plantType,
        level: goal.currentLevel,
        xp: goal.currentXP,
        status: goal.status,
        createdAt: goal.createdAt,
        lastWatered: goal.lastWatered
      }))
    };
  };

  const generateDetailedReport = () => {
    const detailedReport = generateDetailedGoalReport(goals, actions);
    const analytics = calculateGrowthAnalytics(goals, actions);
    
    return {
      reportType: 'Growth Garden Detailed Report',
      generatedAt: new Date().toISOString(),
      detailedGoals: detailedReport,
      summary: analytics
    };
  };

  const generateAnalyticsReport = () => {
    const analytics = calculateGrowthAnalytics(goals, actions);
    const trends = generateActivityTrends(actions, 30);
    
    const xpByGoal = goals.map(goal => {
      const goalActions = actions.filter(a => a.goalId === goal.id && a.isCompleted);
      return {
        goalName: goal.name,
        totalXP: goalActions.reduce((sum, a) => sum + a.xpReward, 0),
        actionCount: goalActions.length
      };
    });

    return {
      reportType: 'Growth Garden Analytics Report',
      generatedAt: new Date().toISOString(),
      analytics,
      trends,
      insights: {
        xpByGoal,
        mostActiveGoal: xpByGoal.sort((a, b) => b.totalXP - a.totalXP)[0]?.goalName || 'None',
        goalDistribution: {
          sprout: goals.filter(g => g.plantType === 'sprout').length,
          herb: goals.filter(g => g.plantType === 'herb').length,
          tree: goals.filter(g => g.plantType === 'tree').length,
          flower: goals.filter(g => g.plantType === 'flower').length
        }
      }
    };
  };

  const convertToCSV = (data: any): string => {
    switch (exportType) {
      case 'summary':
        return exportToCSV(data.analytics, 'summary');
      case 'detailed':
        return exportToCSV(data.detailedGoals, 'detailed');
      case 'analytics':
        return exportToCSV({ analytics: data.analytics, trends: data.trends }, 'analytics');
      default:
        return '';
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data;
      let filename;
      
      switch (exportType) {
        case 'summary':
          data = generateSummaryReport();
          filename = `growth-garden-summary-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'detailed':
          data = generateDetailedReport();
          filename = `growth-garden-detailed-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'analytics':
          data = generateAnalyticsReport();
          filename = `growth-garden-analytics-${new Date().toISOString().split('T')[0]}`;
          break;
      }

      if (exportFormat === 'csv') {
        const csvContent = convertToCSV(data);
        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      } else if (exportFormat === 'json') {
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
      } else if (exportFormat === 'pdf') {
        // For PDF, we'll download as JSON for now and suggest using a PDF service
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      type: 'summary' as ExportType,
      title: 'Summary Report',
      description: 'Quick overview of goals and progress',
      icon: FileText
    },
    {
      type: 'detailed' as ExportType,
      title: 'Detailed Report',
      description: 'Complete data including all actions',
      icon: BarChart3
    },
    {
      type: 'analytics' as ExportType,
      title: 'Analytics Report',
      description: 'Growth trends and insights',
      icon: Calendar
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl biomorphic-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sage-800">
            <Download size={20} />
            Export Garden Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <Label className="text-sm font-medium text-sage-700 mb-3 block">
              What would you like to export?
            </Label>
            <RadioGroup
              value={exportType}
              onValueChange={(value) => setExportType(value as ExportType)}
              className="space-y-3"
            >
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.type} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.type} id={option.type} />
                    <Label htmlFor={option.type} className="flex items-center space-x-3 cursor-pointer">
                      <Icon size={18} className="text-sage-600" />
                      <div>
                        <div className="font-medium text-sage-800">{option.title}</div>
                        <div className="text-sm text-sage-600">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-sage-700 mb-2 block">
              Export Format
            </Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <SelectTrigger className="organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="biomorphic-card">
                <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                <SelectItem value="json">JSON (Developer format)</SelectItem>
                <SelectItem value="pdf">PDF (Coming soon - exports as JSON)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div>
            <Label className="text-sm font-medium text-sage-700 mb-2 block">
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="biomorphic-card">
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <Card className="biomorphic-card">
            <CardContent className="p-4">
              <div className="text-sm text-sage-600">
                <strong>Preview:</strong> This will export{" "}
                {exportType === 'summary' && 'a summary of your goals and overall progress'}
                {exportType === 'detailed' && 'detailed information about all goals and actions'}
                {exportType === 'analytics' && 'analytics data with trends and insights'}
                {" "}in {exportFormat.toUpperCase()} format covering{" "}
                {dateRange === 'all' ? 'all your data' : `the last ${dateRange} days`}.
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="biomorphic-button"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}