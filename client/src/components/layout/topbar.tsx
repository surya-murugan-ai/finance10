import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play } from "lucide-react";

export default function TopBar() {
  const { user } = useAuth();

  return (
    <div className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">QRT Closure Dashboard</h2>
          <p className="text-sm text-muted-foreground">Q3 FY2025 • Last updated: 2 minutes ago</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Play className="w-4 h-4 mr-2" />
            Start QRT Process
          </Button>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
