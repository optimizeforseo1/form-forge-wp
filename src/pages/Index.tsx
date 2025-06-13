
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/AdminDashboard";
import FormViewer from "@/components/FormViewer";
import { Settings, Eye } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Contact Form Builder</h1>
          <p className="text-xl text-muted-foreground">
            Create and manage dynamic contact forms with ease
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Dashboard
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Forms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="forms">
            <FormViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
