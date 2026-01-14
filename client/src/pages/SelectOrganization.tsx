import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Organization {
  id: number;
  name: string;
  role: string;
}

/**
 * Organization Selector
 * Shown when a user belongs to multiple organizations
 */
export default function SelectOrganization() {
  const navigate = useNavigate();
  const location = useLocation();
  const organizations = (location.state?.organizations || []) as Organization[];

  const selectOrgMutation = trpc.auth.selectOrganization.useMutation({
    onSuccess: (data) => {
      toast.success(`Switched to ${data.organizationName}`);
      // Navigate based on user role
      if (data.role === "owner") {
        navigate("/owner/dashboard");
      } else if (data.role === "staff" || data.role === "instructor") {
        navigate("/dashboard");
      } else {
        navigate("/student-dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSelectOrganization = (orgId: number) => {
    selectOrgMutation.mutate({ organizationId: orgId });
  };

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organizations Found</CardTitle>
            <CardDescription>
              You are not associated with any schools. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Select Your School
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            You have access to multiple schools. Choose one to continue.
          </p>
        </div>

        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700"
              onClick={() => handleSelectOrganization(org.id)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                      {org.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                      {org.role}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
