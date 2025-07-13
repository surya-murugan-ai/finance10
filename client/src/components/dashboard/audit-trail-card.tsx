import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { AuditTrail } from "@shared/schema";

interface AuditTrailCardProps {
  auditTrail?: AuditTrail[];
  isLoading: boolean;
}

export default function AuditTrailCard({ auditTrail, isLoading }: AuditTrailCardProps) {
  if (isLoading) {
    return (
      <Card className="status-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Audit Trail</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockAuditTrail = [
    {
      id: '1',
      action: 'GSTValidator Agent',
      entityType: 'agent_job',
      entityId: 'job-1',
      details: { description: 'Validated GST-2A reconciliation' },
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    },
    {
      id: '2',
      action: 'JournalBot',
      entityType: 'agent_job',
      entityId: 'job-2',
      details: { description: 'Generated 156 journal entries' },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    },
    {
      id: '3',
      action: 'User Action',
      entityType: 'document',
      entityId: 'doc-1',
      details: { description: 'Uploaded trial_balance_q3.xlsx' },
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      user: { firstName: 'Priya', lastName: 'Sharma' }
    },
    {
      id: '4',
      action: 'ConsoAI',
      entityType: 'agent_job',
      entityId: 'job-3',
      details: { description: 'Completed financial consolidation' },
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    }
  ];

  const trailToShow = auditTrail || mockAuditTrail;

  const getActionType = (action: string) => {
    if (action.includes('Agent') || action.includes('Bot') || action.includes('AI')) {
      return 'agent';
    } else if (action.includes('User')) {
      return 'user';
    } else {
      return 'system';
    }
  };

  return (
    <Card className="status-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Audit Trail</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trailToShow.slice(0, 4).map((entry) => (
            <div key={entry.id} className="audit-trail-entry">
              <div className={`audit-trail-dot ${getActionType(entry.action)}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.details?.description || 'No description available'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })} • 
                  {entry.entityType === 'agent_job' ? ` Job ID: ${entry.entityId.slice(-3)}` : 
                   entry.entityType === 'document' ? ` File ID: ${entry.entityId.slice(-3)}` : 
                   ` ID: ${entry.entityId.slice(-3)}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Actions Today</span>
            <span className="font-semibold text-foreground">47</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
