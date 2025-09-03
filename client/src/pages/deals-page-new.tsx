import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Deal, Calculation } from "@db/schema";
import Navbar from "@/components/ui/navbar";
import DealCard from "@/components/ui/deal-card";

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: calculations } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
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
                <DealCard
                  key={item.id}
                  deal={item}
                  showSellerInfo={user?.isAdmin || false}
                />
              ))
            ) : (
              <p>Inga demonstrationer matchar dina filter{user && !user.isAdmin ? " för dig" : ""}.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}