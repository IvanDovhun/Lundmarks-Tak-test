import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, MapPin, Clock, Cloud, Sun, CloudRain, Thermometer } from "lucide-react";
import GanttChart from "@/components/ui/gant";

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
  windSpeed: number;
}

export default function ScheduleTVPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWeather] = useState<WeatherData>({
    date: new Date().toISOString(),
    temperature: 22,
    condition: 'Sunny',
    icon: 'sun',
    precipitation: 0,
    windSpeed: 5
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/montage/projects'],
  });

  // Get today's projects
  const today = new Date().toISOString().split('T')[0];
  const todaysProjects = projects.filter((project: ScheduleProject) => {
    const startDate = new Date(project.startDatum).toISOString().split('T')[0];
    const endDate = new Date(project.slutDatum).toISOString().split('T')[0];
    return startDate <= today && endDate >= today;
  });

  // Get upcoming projects (next 7 days)
  const upcomingProjects = projects.filter((project: ScheduleProject) => {
    const startDate = new Date(project.startDatum);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return startDate > new Date() && startDate <= weekFromNow;
  });

  // Convert projects to Gantt chart format
  const ganttData = projects.map((project: ScheduleProject) => ({
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
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'snow':
        return <Cloud className="h-8 w-8 text-blue-200" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTeamCount = () => {
    const teams = new Set(projects.filter((p: ScheduleProject) => p.teamName).map((p: ScheduleProject) => p.teamName));
    return teams.size;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-4xl">Laddar tidplan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-hidden">
      {/* Header with Company Info, Time and Weather */}
      <div className="mb-8 grid grid-cols-3 gap-8">
        {/* Company Info */}
        <div className="text-left">
          <h1 className="text-5xl font-bold text-white mb-2">Lundmarks Tak & Montage</h1>
          <p className="text-2xl text-gray-300">Projektschema</p>
        </div>

        {/* Current Time and Date */}
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">
            {currentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-2xl text-gray-300">
            {currentTime.toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Weather */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-4 mb-2">
            {getWeatherIcon(currentWeather.condition)}
            <div className="text-4xl font-bold">{currentWeather.temperature}°C</div>
          </div>
          <div className="text-xl text-gray-300">{currentWeather.condition}</div>
          <div className="text-lg text-gray-400">Vind: {currentWeather.windSpeed} m/s</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <Card className="bg-blue-900 border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-lg">Aktiva projekt</p>
                <p className="text-4xl font-bold text-white">{projects.length}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-900 border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-lg">Pågående idag</p>
                <p className="text-4xl font-bold text-white">{todaysProjects.length}</p>
              </div>
              <Clock className="h-12 w-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-900 border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-lg">Aktiva team</p>
                <p className="text-4xl font-bold text-white">{getTeamCount()}</p>
              </div>
              <Users className="h-12 w-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-900 border-orange-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-lg">Kommande (7 dagar)</p>
                <p className="text-4xl font-bold text-white">{upcomingProjects.length}</p>
              </div>
              <MapPin className="h-12 w-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-8 h-[calc(100vh-400px)]">
        {/* Gantt Chart */}
        <div className="col-span-2">
          <Card className="bg-gray-800 border-gray-700 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Calendar className="h-6 w-6" />
                Projektschema - Gantt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <div className="h-full overflow-auto">
                <GanttChart cards={ganttData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Projects and Upcoming */}
        <div className="space-y-6">
          {/* Today's Projects */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pågående idag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {todaysProjects.length > 0 ? (
                todaysProjects.map((project: ScheduleProject) => (
                  <div key={project.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{project.kundFirstName} {project.kundLastName}</p>
                        <p className="text-sm text-gray-300">{project.address}</p>
                      </div>
                      {project.teamName && (
                        <Badge 
                          className="text-xs"
                          style={{ backgroundColor: project.teamColor || '#3b82f6' }}
                        >
                          {project.teamName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{project.typAvTak}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Inga projekt pågår idag</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Projects */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Kommande (7 dagar)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {upcomingProjects.length > 0 ? (
                upcomingProjects.slice(0, 5).map((project: ScheduleProject) => (
                  <div key={project.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{project.kundFirstName} {project.kundLastName}</p>
                        <p className="text-sm text-gray-300">{project.address}</p>
                      </div>
                      {project.teamName && (
                        <Badge 
                          className="text-xs"
                          style={{ backgroundColor: project.teamColor || '#3b82f6' }}
                        >
                          {project.teamName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">{project.typAvTak}</p>
                      <p className="text-xs text-blue-400">
                        {new Date(project.startDatum).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Inga kommande projekt</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer with update time */}
      <div className="fixed bottom-4 right-4 text-gray-400 text-sm">
        Senast uppdaterad: {currentTime.toLocaleTimeString('sv-SE')}
      </div>
    </div>
  );
}