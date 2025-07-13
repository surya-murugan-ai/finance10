import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DocumentUpload from "@/pages/document-upload";
import AgentWorkflows from "@/pages/agent-workflows";
import FinancialReports from "@/pages/financial-reports";
import Compliance from "@/pages/compliance";
import AuditTrail from "@/pages/audit-trail";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/documents" component={DocumentUpload} />
          <Route path="/workflows" component={AgentWorkflows} />
          <Route path="/reports" component={FinancialReports} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/audit" component={AuditTrail} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
