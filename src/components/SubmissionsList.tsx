
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Submission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
}

interface SubmissionsListProps {
  onBack: () => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({ onBack }) => {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      return data as Submission[];
    },
  });

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">No data</span>;
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Form Submissions</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Form Submissions</CardTitle>
            <CardDescription>No submissions found</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Form Submissions</h2>
        </div>
        <Badge variant="secondary">{submissions.length} submissions</Badge>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Submission #{submission.id.slice(-8)}</CardTitle>
                  <Badge variant="outline">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </Badge>
                </div>
                <CardDescription>
                  Form ID: {submission.form_id} • 
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(submission.data).map(([key, value]) => (
                    <div key={key} className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-gray-600">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <div className="text-sm bg-gray-50 p-2 rounded border">
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
