
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubmissionsListProps {
  onBack: () => void;
}

const SubmissionsList = ({ onBack }: SubmissionsListProps) => {
  const [selectedFormId, setSelectedFormId] = useState<string>("all");

  const { data: forms } = useQuery({
    queryKey: ["forms-for-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("id, name, title")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions", selectedFormId],
    queryFn: async () => {
      let query = supabase
        .from("form_submissions")
        .select(`
          *,
          forms (name, title)
        `)
        .order("submitted_at", { ascending: false });

      if (selectedFormId !== "all") {
        query = query.eq("form_id", selectedFormId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Form Submissions</h2>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedFormId} onValueChange={setSelectedFormId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms?.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">
              Submissions will appear here once users fill out your forms.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {submission.forms?.title || "Unknown Form"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.submitted_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {submission.forms?.name || "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(submission.data as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="font-medium capitalize">
                        {key.replace(/_/g, " ")}:
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {Array.isArray(value) 
                          ? value.join(", ") 
                          : value != null 
                            ? String(value) 
                            : "N/A"
                        }
                      </div>
                    </div>
                  ))}
                  
                  {submission.ip_address && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      IP: {submission.ip_address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
