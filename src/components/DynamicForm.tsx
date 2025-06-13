
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DynamicFormProps {
  formId: string;
}

const DynamicForm = ({ formId }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: form, isLoading } = useQuery({
    queryKey: ["form-with-fields", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          form_fields (*)
        `)
        .eq("id", formId)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { error } = await supabase
        .from("form_submissions")
        .insert([{
          form_id: formId,
          data: data,
          ip_address: null, // You could capture this from a server-side function
          user_agent: navigator.userAgent,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your form has been submitted successfully.",
      });
      setFormData({});
      setErrors({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const enabledFields = form?.form_fields?.filter(field => field.enabled) || [];

    enabledFields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === "")) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.field_type === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = "Please enter a valid email address";
        }
      }

      if (field.field_type === "phone" && formData[field.name]) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(formData[field.name])) {
          newErrors[field.name] = "Please enter a valid phone number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      submitFormMutation.mutate(formData);
    }
  };

  const renderField = (field: any) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder || "",
      required: field.required,
    };

    switch (field.field_type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            {...commonProps}
            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            rows={4}
          />
        );

      case "dropdown":
        return (
          <Select
            value={formData[field.name] || ""}
            onValueChange={(value) => handleInputChange(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup
            value={formData[field.name] || ""}
            onValueChange={(value) => handleInputChange(field.name, value)}
          >
            {field.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.name}_${index}`} />
                <Label htmlFor={`${field.name}_${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
            />
            <Label htmlFor={field.name}>
              {field.placeholder || field.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading form...</div>;
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Form not found or not active.</p>
        </CardContent>
      </Card>
    );
  }

  const enabledFields = form.form_fields?.filter(field => field.enabled)
    .sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {enabledFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              
              {renderField(field)}
              
              {errors[field.name] && (
                <p className="text-sm text-red-500">{errors[field.name]}</p>
              )}
            </div>
          ))}

          {form.recaptcha_enabled && (
            <div className="text-sm text-muted-foreground">
              <p>This form is protected by reCAPTCHA.</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitFormMutation.isPending}
          >
            {submitFormMutation.isPending ? "Submitting..." : "Submit Form"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicForm;
