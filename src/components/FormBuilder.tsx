
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id?: string;
  field_type: string;
  label: string;
  name: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  options?: string[];
  sort_order: number;
}

interface FormBuilderProps {
  onBack: () => void;
  formId?: string | null;
}

const FormBuilder = ({ onBack, formId }: FormBuilderProps) => {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    notification_email: "",
    recaptcha_enabled: false,
    is_active: true,
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingForm } = useQuery({
    queryKey: ["form", formId],
    queryFn: async () => {
      if (!formId) return null;
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          form_fields (*)
        `)
        .eq("id", formId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  useEffect(() => {
    if (existingForm) {
      setFormData({
        name: existingForm.name,
        title: existingForm.title,
        description: existingForm.description || "",
        notification_email: existingForm.notification_email,
        recaptcha_enabled: existingForm.recaptcha_enabled,
        is_active: existingForm.is_active,
      });
      setFields(
        existingForm.form_fields
          ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((field: any) => ({
            id: field.id,
            field_type: field.field_type,
            label: field.label,
            name: field.name,
            placeholder: field.placeholder || "",
            required: field.required,
            enabled: field.enabled,
            options: field.options || [],
            sort_order: field.sort_order,
          })) || []
      );
    }
  }, [existingForm]);

  const saveFormMutation = useMutation({
    mutationFn: async () => {
      let formResponse;
      
      if (formId) {
        // Update existing form
        formResponse = await supabase
          .from("forms")
          .update(formData)
          .eq("id", formId)
          .select()
          .single();
      } else {
        // Create new form
        formResponse = await supabase
          .from("forms")
          .insert([formData])
          .select()
          .single();
      }

      if (formResponse.error) throw formResponse.error;

      const currentFormId = formResponse.data.id;

      // Delete existing fields if updating
      if (formId) {
        await supabase
          .from("form_fields")
          .delete()
          .eq("form_id", formId);
      }

      // Insert new fields
      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field, index) => ({
          form_id: currentFormId,
          field_type: field.field_type,
          label: field.label,
          name: field.name,
          placeholder: field.placeholder,
          required: field.required,
          enabled: field.enabled,
          options: field.options,
          sort_order: index,
        }));

        const { error: fieldsError } = await supabase
          .from("form_fields")
          .insert(fieldsToInsert);

        if (fieldsError) throw fieldsError;
      }

      return formResponse.data;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Form ${formId ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      onBack();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
      console.error("Save form error:", error);
    },
  });

  const addField = () => {
    const newField: FormField = {
      field_type: "text",
      label: "New Field",
      name: `field_${fields.length + 1}`,
      placeholder: "",
      required: false,
      enabled: true,
      sort_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "textarea", label: "Textarea" },
    { value: "dropdown", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">
          {formId ? "Edit Form" : "Create New Form"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
            <CardDescription>Configure your form details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact Form"
              />
            </div>
            
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Get in Touch"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please fill out this form to contact us"
              />
            </div>

            <div>
              <Label htmlFor="email">Notification Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.notification_email}
                onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recaptcha"
                checked={formData.recaptcha_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, recaptcha_enabled: checked })
                }
              />
              <Label htmlFor="recaptcha">Enable reCAPTCHA</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="active">Form Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Form Fields
              <Button onClick={addField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </CardTitle>
            <CardDescription>Configure the fields for your form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {fields.map((field, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(value) =>
                            updateField(index, { field_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          placeholder="Field Label"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, { name: e.target.value })
                          }
                          placeholder="field_name"
                        />
                      </div>

                      <div>
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(index, { placeholder: e.target.value })
                          }
                          placeholder="Enter placeholder"
                        />
                      </div>
                    </div>

                    {(field.field_type === "dropdown" || field.field_type === "radio") && (
                      <div>
                        <Label>Options (one per line)</Label>
                        <Textarea
                          value={(field.options || []).join("\n")}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value.split("\n").filter(Boolean),
                            })
                          }
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateField(index, { required: checked })
                          }
                        />
                        <Label>Required</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) =>
                            updateField(index, { enabled: checked })
                          }
                        />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={() => saveFormMutation.mutate()} disabled={saveFormMutation.isPending}>
          {saveFormMutation.isPending ? "Saving..." : "Save Form"}
        </Button>
      </div>
    </div>
  );
};

export default FormBuilder;
