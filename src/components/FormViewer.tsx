
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import DynamicForm from "./DynamicForm";

const FormViewer = () => {
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  const { data: forms, isLoading } = useQuery({
    queryKey: ["active-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading forms...</div>;
  }

  if (!forms || forms.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No active forms</h3>
          <p className="text-muted-foreground">
            No forms are currently available for submission.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Contact Forms</CardTitle>
          <CardDescription>
            Select a form below to view and submit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedFormId} onValueChange={setSelectedFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a form to view" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedFormId && (
        <DynamicForm formId={selectedFormId} />
      )}
    </div>
  );
};

export default FormViewer;
