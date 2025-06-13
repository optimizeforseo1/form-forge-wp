
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Form {
  id: string;
  name: string;
  title: string;
  description?: string;
  notification_email: string;
  recaptcha_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

interface FormListProps {
  forms: Form[];
  onCreateNew: () => void;
  onEdit: (formId: string) => void;
}

const FormList = ({ forms, onCreateNew, onEdit }: FormListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFormMutation = useMutation({
    mutationFn: async ({ formId, isActive }: { formId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("forms")
        .update({ is_active: isActive })
        .eq("id", formId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({
        title: "Success!",
        description: "Form status updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update form status.",
        variant: "destructive",
      });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", formId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({
        title: "Success!",
        description: "Form deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete form.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (formId: string, formName: string) => {
    if (window.confirm(`Are you sure you want to delete "${formName}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(formId);
    }
  };

  if (forms.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No forms yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first contact form to get started.
          </p>
          <Button onClick={onCreateNew}>Create New Form</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <Card key={form.id} className="relative">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <CardDescription>{form.name}</CardDescription>
              </div>
              <div className="flex space-x-1">
                <Badge variant={form.is_active ? "default" : "secondary"}>
                  {form.is_active ? "Active" : "Inactive"}
                </Badge>
                {form.recaptcha_enabled && (
                  <Badge variant="outline">reCAPTCHA</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {form.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {form.description}
                </p>
              )}
              
              <div className="text-xs text-muted-foreground">
                Notifications: {form.notification_email}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Created: {new Date(form.created_at).toLocaleDateString()}
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(form.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => 
                      toggleFormMutation.mutate({
                        formId: form.id,
                        isActive: !form.is_active
                      })
                    }
                  >
                    {form.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(form.id, form.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Button size="sm" variant="default">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FormList;
