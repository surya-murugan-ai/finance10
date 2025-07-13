import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import StatusCards from "@/components/dashboard/status-cards";
import FileUploadCard from "@/components/dashboard/file-upload-card";
import AgentWorkflowCard from "@/components/dashboard/agent-workflow-card";
import FinancialReportsSection from "@/components/dashboard/financial-reports-section";
import ComplianceCard from "@/components/dashboard/compliance-card";
import AuditTrailCard from "@/components/dashboard/audit-trail-card";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    retry: false,
  });

  const { data: auditTrail, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/audit-trail"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          {/* Status Cards */}
          <StatusCards stats={stats} isLoading={statsLoading} />

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FileUploadCard />
            <AgentWorkflowCard workflows={workflows} isLoading={workflowsLoading} />
          </div>

          {/* Financial Reports Section */}
          <FinancialReportsSection />

          {/* Compliance and Audit Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceCard />
            <AuditTrailCard auditTrail={auditTrail} isLoading={auditLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
