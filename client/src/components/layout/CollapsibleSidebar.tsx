import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Database, 
  MessageSquare, 
  Upload, 
  Calendar,
  GitBranch,
  BookOpen,
  TrendingUp,
  FileSpreadsheet,
  Building,
  UserCheck,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  description: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Main dashboard' },
  { name: 'Document Upload', href: '/document-upload', icon: Upload, description: 'Upload financial documents' },
  { name: 'Document Management', href: '/document-management', icon: FileText, description: 'Manage uploaded documents' },
  { name: 'Agent Chat', href: '/agent-chat', icon: MessageSquare, description: 'Chat with AI agents' },
  { name: 'Agent Workflows', href: '/agent-workflows', icon: Bot, description: 'Manage AI workflows' },
  { name: 'Financial Reports', href: '/financial-reports', icon: BarChart3, description: 'Generate financial reports' },
  { name: 'Reconciliation', href: '/reconciliation', icon: GitBranch, description: 'Reconcile transactions' },
  { name: 'Data Tables', href: '/data-tables', icon: FileSpreadsheet, description: 'View data tables' },
  { name: 'Compliance', href: '/compliance', icon: Shield, description: 'Compliance management' },
  { name: 'Compliance Tutorial', href: '/compliance-tutorial', icon: BookOpen, description: 'Learn compliance workflows' },
  { name: 'ML Anomaly Detection', href: '/ml-anomaly-detection', icon: TrendingUp, description: 'Detect anomalies' },
  { name: 'MCA Filing', href: '/mca-filing', icon: Building, description: 'MCA filing management' },
  { name: 'Audit Trail', href: '/audit-trail', icon: UserCheck, description: 'View audit logs' },
  { name: 'Data Source Config', href: '/data-source-config', icon: Database, description: 'Configure data sources' },
  { name: 'Onboarding', href: '/onboarding', icon: Users, description: 'User onboarding' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Application settings' },
];

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            QRT Closure
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <Icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                {!isCollapsed && <span>{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}