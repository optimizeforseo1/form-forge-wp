
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Submission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
}

interface SubmissionsListProps {
  submissions: Submission[];
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({ submissions }) => {
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

  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions</CardTitle>
          <CardDescription>No submissions found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Form Submissions</h2>
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
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </Badge>
                </div>
                <CardDescription>
                  Form ID: {submission.formId} • 
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
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
