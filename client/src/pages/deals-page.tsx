import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarArrowDown, CalendarArrowUp, ArrowDownZA, ArrowUpZA, List, LayoutDashboard, Clock, XCircle, CheckCircle, Building, User, MapPin, Calendar, Euro } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Deal, Calculation } from "@shared/schema";
import Navbar from "@/components/ui/navbar";
import DealCard from "@/components/ui/deal-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Wrapper for existing DealCard to make it work in Kanban context
function KanbanDealCardWrapper({ deal, user, projectDealMutation }: { deal: Deal; user: any; projectDealMutation: any }) {
  return (
    <div className="cursor-grab active:cursor-grabbing">
      <DealCard
        deal={deal}
        onProjectMutation={() => projectDealMutation.mutate(deal)}
        isAdmin={user?.isAdmin || false}
      />
    </div>
  );
}

// Mobile-friendly deal card with status selection
function MobileDealCard({ 
  deal, 
  index, 
  user, 
  projectDealMutation, 
  updateStatusMutation, 
  kanbanColumns, 
  currentStatus 
}: { 
  deal: Deal; 
  index: number; 
  user: any; 
  projectDealMutation: any; 
  updateStatusMutation: any; 
  kanbanColumns: any[]; 
  currentStatus: string;
}) {
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      updateStatusMutation.mutate({
        dealId: deal.id,
        newStatus: newStatus
      });
    }
    setShowStatusSelector(false);
  };

  return (
    <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-transform ${
            snapshot.isDragging ? 'rotate-2 scale-105' : ''
          }`}
        >
          <div className="relative">
            <div 
              onClick={() => setShowStatusSelector(true)}
              className="cursor-pointer" // Enable click on all screens
            >
              <KanbanDealCardWrapper 
                deal={deal} 
                user={user}
                projectDealMutation={projectDealMutation}
              />
            </div>
            
            {/* Status Selection Modal for Mobile */}
            {showStatusSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Ändra Status</h3>
                  <p className="text-sm text-gray-600 mb-4">{deal.customerName}</p>
                  
                  <div className="space-y-3">
                    {kanbanColumns.map((column) => {
                      const Icon = column.icon;
                      const isSelected = column.id === currentStatus;
                      
                      return (
                        <button
                          key={column.id}
                          onClick={() => handleStatusChange(column.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                            isSelected 
                              ? `${column.bgColor} ${column.color} border-current` 
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{column.title}</span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setShowStatusSelector(false)}
                    className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function DealsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: calculations, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  // Sorting states
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'seller' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<'ongoing' | 'finished'>('ongoing');
  
  // View mode state - Always use kanban
  const viewMode = 'kanban';
  
  // Kanban tab state
  const [kanbanTab, setKanbanTab] = useState<'pågående' | 'klara'>('pågående');

  // Kanban columns and deal organization
  type DealStatus = 'väntande' | 'ånger' | 'redo_for_projektering';

  interface KanbanColumn {
    id: DealStatus;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
  }

  const kanbanColumns: KanbanColumn[] = [
    {
      id: 'väntande',
      title: 'Väntande',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'ånger',
      title: 'Ånger',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200'
    },
    {
      id: 'redo_for_projektering',
      title: 'Redo För Projektering',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    }
  ];

  // Map deal status to column
  const mapDealStatusToColumn = (status?: string): DealStatus => {
    if (!status) return 'väntande';
    switch (status.toLowerCase()) {
      case 'väntande':
      case 'waiting':
      case 'pending':
        return 'väntande';
      case 'ånger':
      case 'declined':
      case 'no':
        return 'ånger';
      case 'redo_for_projektering':
      case 'ready_for_project':
      case 'approved':
        return 'redo_for_projektering';
      // projekterad deals are moved to "Klara Affärer" tab automatically
      case 'projekterad':
      case 'projected':
      case 'completed':
        return 'redo_for_projektering'; // Will be filtered out to Klara tab
      default:
        return 'väntande';
    }
  };

  // Filter deals for Kanban based on the selected tab
  const filteredKanbanDeals = useMemo(() => {
    if (!calculations) return [];
    
    console.log('All calculations with full data:', calculations.map(d => ({ 
      id: d.id, 
      calculationType: d.calculationType, 
      dealStatus: d.dealStatus,
      customerName: d.customerName,
      price: d.price
    })));
    
    if (kanbanTab === 'pågående') {
      // Ongoing deals: Exclude projekterad and Klar (they go to Klara tab)
      const filtered = calculations.filter(deal => {
        const status = deal.status || deal.dealStatus;
        return !status || !['projekterad', 'Klar'].includes(status);
      });
      console.log('Showing ongoing deals for pågående tab:', filtered.length);
      return filtered;
    } else {
      // Finished deals: Show deals that are projekterad or marked as "Klar" 
      const filtered = calculations.filter(deal => {
        const status = deal.status || deal.dealStatus;
        return status === 'Klar' || status === 'projekterad';
      });
      console.log('Filtered finished deals:', filtered.length);
      return filtered;
    }
  }, [calculations, kanbanTab]);

  // Organize deals by status for Kanban view
  const dealsByStatus = useMemo(() => {
    if (!filteredKanbanDeals || viewMode !== 'kanban') return {};
    
    console.log('Reorganizing deals by status:', filteredKanbanDeals.map(d => ({ id: d.id, dealStatus: d.dealStatus, status: d.status })));
    
    const organized = filteredKanbanDeals.reduce((acc, deal) => {
      // The backend returns 'status' for kanban updates, but older deals might have 'dealStatus'
      const dealStatus = deal.status || deal.dealStatus;
      const status = mapDealStatusToColumn(dealStatus);
      if (!acc[status]) acc[status] = [];
      acc[status].push(deal);
      return acc;
    }, {} as Record<DealStatus, Deal[]>);

    // Ensure all columns exist even if empty
    const fullOrganized: Record<DealStatus, Deal[]> = {
      väntande: organized.väntande || [],
      ånger: organized.ånger || [],
      redo_for_projektering: organized.redo_for_projektering || []
    };

    console.log('Final organized deals:', fullOrganized);
    return fullOrganized;
  }, [filteredKanbanDeals, viewMode]);

  // Handle drag end for Kanban
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const destColumn = destination.droppableId as DealStatus;
    updateStatusMutation.mutate({
      dealId: parseInt(draggableId),
      newStatus: destColumn
    });
  };

  const filteredDeals = useMemo(() => {
    if (!user || !calculations) return [];

    let filtered = [...calculations];

    // Apply status filter based on dealStatus
    filtered = filtered.filter(deal => {
      if (statusFilter === 'ongoing') {
        return deal.dealStatus === 'Väntande' || deal.dealStatus === 'Pågående';
      } else {
        return deal.dealStatus === 'Klar';
      }
    });

    // Apply sorting
    if (sortBy && filtered.length > 0) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'seller':
            if (user?.isAdmin) {
              comparison = (a.sellerName || '').localeCompare(b.sellerName || '');
            }
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [calculations, user, sortBy, sortOrder, statusFilter]);

  // Sorting handlers
  const handleSort = (type: 'price' | 'date' | 'seller') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'price' ? 'desc' : type === 'date' ? 'desc' : 'asc');
    }
  };

  const projectDealMutation = useMutation({
    mutationFn: async (deal: Deal) => {
      console.log("Projecting deal: ", deal.id);
      const res = await apiRequest("POST", `/api/admin/project-deal/${deal.id}`, deal);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "Affär projekterad!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Affärs projektering misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kanban status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ dealId, newStatus }: { dealId: number; newStatus: string }) => {
      console.log('Updating deal status:', { dealId, newStatus });
      return apiRequest('PATCH', `/api/deals/${dealId}/status`, { status: newStatus });
    },
    onSuccess: (data, variables) => {
      console.log('Status update successful:', variables);
      // Force refetch to ensure we get the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.refetchQueries({ queryKey: ["/api/deals"], type: 'active' });
      // Also remove the specific query from cache to force fresh fetch
      queryClient.removeQueries({ queryKey: ["/api/deals"] });
      toast({ 
        title: "Status uppdaterad", 
        description: "Affärens status har uppdaterats framgångsrikt" 
      });
    },
    onError: (error) => {
      console.error('Error updating deal status:', error);
      toast({ 
        title: "Fel", 
        description: "Kunde inte uppdatera affärens status", 
        variant: "destructive" 
      });
    }
  });

  return (
    <div className="min-h-screen">
      <header className="title-area">
        <Navbar/>
      </header>

      <main className="base pt-16">
        <div className="demonstrations-page-container">
          {/* Kanban Tabs */}
          <div className="status-toggle-container mb-4">
            <button 
              onClick={() => setKanbanTab('pågående')}
              className={`status-toggle-button ${kanbanTab === 'pågående' ? 'active' : 'inactive'}`}
            >
              Pågående Affärer
            </button>
            <button 
              onClick={() => setKanbanTab('klara')}
              className={`status-toggle-button ${kanbanTab === 'klara' ? 'active' : 'inactive'}`}
            >
              Klara Affärer
            </button>
            <Link href="/demos">
              <button className="status-toggle-button inactive">
                Demo
              </button>
            </Link>
            <Link href="/customer-registry">
              <button className="status-toggle-button inactive">
                Kundregister
              </button>
            </Link>
          </div>

          {/* Kanban View */}
            <div className="p-4 md:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {kanbanTab === 'pågående' ? 'Pågående Affärer - Kanban Board' : 'Klara Affärer'}
                </h2>
                {kanbanTab === 'pågående' ? (
                  <>
                    <p className="text-gray-600 hidden md:block">Dra och släpp affärer mellan kolumner för att uppdatera status</p>
                    <p className="text-gray-600 md:hidden">Tryck på en affär för att ändra status</p>
                  </>
                ) : (
                  <p className="text-gray-600">Affärer som har projek​terats av projektledare</p>
                )}
              </div>

              {kanbanTab === 'pågående' ? (
                <>
                  {/* Mobile: Vertical Stack with Status Selection */}
                  <div className="md:hidden">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <div className="space-y-6">
                        {kanbanColumns.map((column) => {
                          const Icon = column.icon;
                          const dealsInColumn = dealsByStatus[column.id] || [];
                          
                          return (
                            <Card key={column.id} className={`${column.bgColor} border-2`}>
                              <CardHeader className="pb-3">
                                <CardTitle className={`flex items-center gap-2 text-lg ${column.color}`}>
                                  <Icon className="w-5 h-5" />
                                  {column.title}
                                  <Badge variant="secondary" className="ml-auto">
                                    {dealsInColumn.length}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              
                              <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                  <CardContent
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`space-y-3 min-h-[200px] transition-colors ${
                                      snapshot.isDraggingOver ? 'bg-white/50' : ''
                                    }`}
                                  >
                                    {dealsInColumn.map((deal, index) => (
                                      <MobileDealCard
                                        key={deal.id}
                                        deal={deal}
                                        index={index}
                                        user={user}
                                        projectDealMutation={projectDealMutation}
                                        updateStatusMutation={updateStatusMutation}
                                        kanbanColumns={kanbanColumns}
                                        currentStatus={column.id}
                                      />
                                    ))}
                                    {provided.placeholder}
                                    
                                    {dealsInColumn.length === 0 && (
                                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                        Inga affärer här
                                      </div>
                                    )}
                                  </CardContent>
                                )}
                              </Droppable>
                            </Card>
                          );
                        })}
                      </div>
                    </DragDropContext>
                  </div>

                  {/* Desktop: Grid Layout with Drag & Drop */}
                  <div className="hidden md:block">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kanbanColumns.map((column) => {
                          const Icon = column.icon;
                          const dealsInColumn = dealsByStatus[column.id] || [];
                          
                          return (
                            <Card key={column.id} className={`${column.bgColor} border-2`}>
                              <CardHeader className="pb-3">
                                <CardTitle className={`flex items-center gap-2 text-lg ${column.color}`}>
                                  <Icon className="w-5 h-5" />
                                  {column.title}
                                  <Badge variant="secondary" className="ml-auto">
                                    {dealsInColumn.length}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              
                              <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                  <CardContent
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`space-y-3 min-h-[400px] transition-colors ${
                                      snapshot.isDraggingOver ? 'bg-white/50' : ''
                                    }`}
                                  >
                                    {dealsInColumn.map((deal, index) => (
                                      <MobileDealCard
                                        key={deal.id}
                                        deal={deal}
                                        index={index}
                                        user={user}
                                        projectDealMutation={projectDealMutation}
                                        updateStatusMutation={updateStatusMutation}
                                        kanbanColumns={kanbanColumns}
                                        currentStatus={column.id}
                                      />
                                    ))}
                                    {provided.placeholder}
                                    
                                    {dealsInColumn.length === 0 && (
                                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                        Inga affärer här
                                      </div>
                                    )}
                                  </CardContent>
                                )}
                              </Droppable>
                            </Card>
                          );
                        })}
                      </div>
                    </DragDropContext>
                  </div>
                </>
              ) : (
                /* Klara Affärer - Grid Layout like Demo page */
                <div className="deals-grid">
                  {filteredKanbanDeals.length > 0 ? (
                    filteredKanbanDeals.map(item => (
                      <DealCard
                        key={item.id}
                        deal={item}
                        onProjectMutation={() => {projectDealMutation.mutate(item)}}
                        isAdmin={user?.isAdmin || false}
                      />
                    ))
                  ) : (
                    <p>Inga klara affärer har projek​terats ännu.</p>
                  )}
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
