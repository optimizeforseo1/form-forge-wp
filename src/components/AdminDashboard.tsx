import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FormBuilder from "./FormBuilder";
import FormList from "./FormList";
import { SubmissionsList } from "./SubmissionsList";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("list");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const { data: forms, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["submissions-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("form_submissions")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const renderContent = () => {
    switch (activeView) {
      case "create":
        return (
          <FormBuilder 
            onBack={() => setActiveView("list")}
            formId={selectedFormId}
          />
        );
      case "submissions":
        return <SubmissionsList onBack={() => setActiveView("list")} />;
      default:
        return (
          <FormList 
            forms={forms || []}
            onCreateNew={() => {
              setSelectedFormId(null);
              setActiveView("create");
            }}
            onEdit={(formId) => {
              setSelectedFormId(formId);
              setActiveView("create");
            }}
          />
        );
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {activeView === "list" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{forms?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {forms?.filter(f => f.is_active).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Manage Forms</h2>
            <div className="space-x-2">
              <Button onClick={() => setActiveView("submissions")} variant="outline">
                View Submissions
              </Button>
              <Button onClick={() => setActiveView("create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Form
              </Button>
            </div>
          </div>
        </>
      )}

      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
