import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Upload, 
  Bot, 
  FileText, 
  Shield, 
  History,
  TrendingUp,
  FolderOpen,
  GitMerge,
  Table,
  MessageCircle,
  Settings,
  Brain,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Document Upload", href: "/documents", icon: Upload },
  { name: "Document Management", href: "/document-management", icon: FolderOpen },
  { name: "Agent Workflows", href: "/workflows", icon: Bot },
  { name: "Financial Reports", href: "/reports", icon: FileText },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Compliance Tutorial", href: "/compliance-tutorial", icon: BookOpen },
  { name: "Audit Trail", href: "/audit", icon: History },
  { name: "Reconciliation", href: "/reconciliation", icon: GitMerge },
  { name: "Data Tables", href: "/data-tables", icon: Table },
  { name: "Agent Chat", href: "/agent-chat", icon: MessageCircle },
  { name: "ML Anomaly Detection", href: "/ml-anomaly-detection", icon: Brain },
  { name: "MCA Filing", href: "/mca-filing", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const agents = [
  { name: "ClassifierBot", status: "running" },
  { name: "JournalBot", status: "running" },
  { name: "GSTValidator", status: "processing" },
  { name: "ConsoAI", status: "running" },
  { name: "AuditAgent", status: "running" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border fixed h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">QRT Closure</h1>
            <p className="text-sm text-muted-foreground">Agent Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "sidebar-nav-item",
                  isActive ? "active" : "inactive"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            LangGraph Agents
          </h3>
          <div className="mt-2 space-y-1">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center px-3 py-2 text-sm">
                <div className={cn(
                  "agent-status-dot mr-3",
                  agent.status === "running" ? "agent-status-running" : 
                  agent.status === "processing" ? "agent-status-processing" : 
                  "agent-status-completed"
                )} />
                <span className="text-foreground">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
