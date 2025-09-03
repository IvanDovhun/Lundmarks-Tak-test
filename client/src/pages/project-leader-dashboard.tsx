import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import RoleImpersonationBar from "@/components/ui/role-impersonation-bar";
import Navbar from "@/components/ui/navbar";
import {
  Calculator,
  Handshake,
  FolderKanban,
  Calendar
} from "lucide-react";

export default function ProjectLeaderDashboard() {
  const { toast } = useToast();

  const { data: projectTickets, isLoading } = useQuery({
    queryKey: ['/api/project-leader/tickets'],
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    retry: false,
  });

  // Calculate task indicators
  const pendingTickets = projectTickets?.filter(ticket => ticket.status === 'new' || ticket.status === 'review').length || 0;
  const activeProjects = projects.filter(project => project.status === 'ongoing').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laddar projektkö...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <RoleImpersonationBar />
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Projektledare Dashboard</h1>
          <Badge variant="outline" className="px-3 py-1">
            {projectTickets?.length || 0} aktiva projekt
          </Badge>
        </div>
        <p className="text-gray-600 mb-8">Projektfokuserad översikt med uppgiftsindikatorer och snabblänkar</p>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Kalkyl
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/calculator">
                <Button className="w-full">Öppna Kalkyl</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Affärer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/deals">
                <Button className="w-full">Öppna Affärer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projekt
                {pendingTickets > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingTickets}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/project-leader-zendesk">
                <Button className="w-full">Zendesk Support</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planering
                {activeProjects > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeProjects}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/planning-gantt">
                <Button className="w-full">Öppna Planering</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}