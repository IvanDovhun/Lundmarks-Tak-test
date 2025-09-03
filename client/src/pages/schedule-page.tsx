import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Monitor, Users, MapPin, Clock, Cloud, Sun, CloudRain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GanttChart from "@/components/ui/gant";
import Navbar from "@/components/ui/navbar";

interface ScheduleProject {
  id: number;
  calculationId: number;
  kundFirstName: string;
  kundLastName: string;
  address: string;
  startDatum: string;
  slutDatum: string;
  typAvTak: string;
  status: string;
  teamName?: string;
  teamColor?: string;
  notes?: string;
}

interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/montage/projects'],
  });

  // Mock weather data (in real implementation, this would come from weather API)
  const mockWeatherData: WeatherData[] = [
    { date: '2025-07-09', temperature: 22, condition: 'Sunny', icon: 'sun', precipitation: 0 },
    { date: '2025-07-10', temperature: 18, condition: 'Cloudy', icon: 'cloud', precipitation: 10 },
    { date: '2025-07-11', temperature: 15, condition: 'Rain', icon: 'rain', precipitation: 80 },
    { date: '2025-07-12', temperature: 20, condition: 'Partly Cloudy', icon: 'cloud-sun', precipitation: 20 },
    { date: '2025-07-13', temperature: 25, condition: 'Sunny', icon: 'sun', precipitation: 0 },
    { date: '2025-07-14', temperature: 23, condition: 'Sunny', icon: 'sun', precipitation: 5 },
    { date: '2025-07-15', temperature: 16, condition: 'Rain', icon: 'rain', precipitation: 90 },
  ];

  // Get unique teams
  const teams = [...new Set(projects.filter((p: ScheduleProject) => p.teamName).map((p: ScheduleProject) => p.teamName))];

  // Filter projects based on team selection
  const filteredProjects = filterTeam === 'all' 
    ? projects 
    : projects.filter((p: ScheduleProject) => p.teamName === filterTeam);

  // Convert projects to Gantt chart format
  const ganttData = filteredProjects.map((project: ScheduleProject) => ({
    id: project.id,
    title: `${project.kundFirstName} ${project.kundLastName}`,
    subtitle: project.address,
    startDate: project.startDatum,
    endDate: project.slutDatum,
    color: project.teamColor || '#3b82f6',
    teamName: project.teamName || 'Ej tilldelat',
    roofType: project.typAvTak,
  }));

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'snow':
        return <Cloud className="h-4 w-4 text-blue-200" />;
      default:
        return <Cloud className="h-4 w-4 text-gray-500" />;
    }
  };

  const updateProjectTeam = useMutation({
    mutationFn: async (data: { projectId: number; teamName: string; teamColor: string }) => {
      return apiRequest('/api/projects/assign-team', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Team tilldelat" });
      queryClient.invalidateQueries({ queryKey: ['/api/montage/projects'] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Laddar tidplan...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tidplan & Schema</h1>
                <p className="text-gray-600">Hantera projektschema och teamtilldelningar</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open('/schedule/tv', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  TV-vy
                </Button>
                <Select value={viewMode} onValueChange={(value: 'gantt' | 'list') => setViewMode(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gantt">Gantt-schema</SelectItem>
                    <SelectItem value="list">Listvy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Filtrera team:</span>
            </div>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weather Strip */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Väderleksrapport - Närmaste 7 dagarna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {mockWeatherData.map((weather, index) => (
                  <div key={weather.date} className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium mb-1">
                      {new Date(weather.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(weather.condition)}
                    </div>
                    <div className="text-lg font-bold mb-1">{weather.temperature}°C</div>
                    <div className="text-xs text-gray-600">{weather.condition}</div>
                    <div className="text-xs text-blue-600">{weather.precipitation}% regn</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {viewMode === 'gantt' ? (
            <Card>
              <CardHeader>
                <CardTitle>Gantt-schema</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <GanttChart cards={ganttData} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: ScheduleProject) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Projekt #{project.id}</span>
                      <Badge variant={project.status === 'pågående' ? 'default' : 'secondary'}>
                        {project.status || 'Pågående'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{project.kundFirstName} {project.kundLastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{project.address}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Start: {new Date(project.startDatum).toLocaleDateString('sv-SE')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Slut: {new Date(project.slutDatum).toLocaleDateString('sv-SE')}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Team:</span>
                      {project.teamName ? (
                        <Badge 
                          className="ml-2" 
                          style={{ backgroundColor: project.teamColor || '#3b82f6' }}
                        >
                          {project.teamName}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">Ej tilldelat</Badge>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Taktyp:</span>
                      <span className="ml-2">{project.typAvTak}</span>
                    </div>

                    {project.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Anteckningar:</span>
                        <p className="text-gray-600 mt-1">{project.notes}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`/project-management?id=${project.id}`, '_blank')}
                    >
                      Hantera projekt
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}