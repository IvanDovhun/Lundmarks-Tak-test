import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Demo, Calculation } from "@shared/schema";
import Navbar from "@/components/ui/navbar";
import DemoCard from "@/components/ui/demo-card";

export default function DemonstrationsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: calculations, isLoading } = useQuery<Demo[]>({
    queryKey: ["/api/demos"],
  });

  // Sorting states
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'seller' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredDemonstrations = useMemo(() => {
    if (!user || !calculations) return [];

    const filtered = [...calculations];

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
  }, [calculations, user, sortBy, sortOrder]);

  const handleReuse = (calculation: Calculation) => {
    queryClient.setQueryData(["reuse-calculation"], calculation);
    navigate("/");
  };

  // Sorting handlers
  const handleSort = (type: 'price' | 'date' | 'seller') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'price' ? 'desc' : type === 'date' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="title-area">
        <Navbar/>
      </header>

      <main className="base pt-16">
        <div className="demonstrations-page-container">
          {/* Navigation Tabs */}
          <div className="status-toggle-container mb-4">
            <Link href="/deals">
              <button className="status-toggle-button inactive">
                Pågående Affärer
              </button>
            </Link>
            <Link href="/deals">
              <button className="status-toggle-button inactive">
                Klara Affärer
              </button>
            </Link>
            <button className="status-toggle-button active">
              Demo
            </button>
            <Link href="/customer-registry">
              <button className="status-toggle-button inactive">
                Kundregister
              </button>
            </Link>
          </div>
          
          <h1>Demonstrationer</h1>

          <div className="filter-bar">
            <div className="filter-label-button">
                <span>Sortera</span>
            </div>

            {/* Price Sort Button */}
            <div className="filter-dropdown-container">
              <button 
                onClick={() => handleSort('price')} 
                className={`filter-button ${sortBy === 'price' ? 'bg-blue-100' : ''}`}
              >
                Pris {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* Date Sort Button */}
            <div className="filter-dropdown-container">
              <button 
                onClick={() => handleSort('date')} 
                className={`filter-button ${sortBy === 'date' ? 'bg-blue-100' : ''}`}
              >
                Datum {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* Seller Sort Button - Only for Admins */}
            {user?.isAdmin && (
              <div className="filter-dropdown-container">
                <button 
                  onClick={() => handleSort('seller')} 
                  className={`filter-button ${sortBy === 'seller' ? 'bg-blue-100' : ''}`}
                >
                  Säljare {sortBy === 'seller' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            )}
          </div>

          <div className="demonstrations-grid">
            {filteredDemonstrations.length > 0 ? (
              filteredDemonstrations.map(item => (
                <DemoCard
                  key={item.id}
                  item={item}
                  showSellerInfo={user?.isAdmin || false}
                />
              ))
            ) : (isLoading ? <p>Laddar in demonstrationer...</p> :
              <p>Inga demonstrationer har gjorts{user && !user.isAdmin ? " av dig" : ""}.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}