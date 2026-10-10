import { Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

export default function NotFoundPage() {
  const location = useLocation();
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description={`Nothing exists at ${location.pathname}. Check the address or return to the SOC overview.`}
      className="mt-10"
      action={
        <Button asChild>
          <Link to="/dashboard">Go to SOC Overview</Link>
        </Button>
      }
    />
  );
}
