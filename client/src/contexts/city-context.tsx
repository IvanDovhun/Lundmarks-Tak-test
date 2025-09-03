import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { City } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface CityContextType {
  selectedCity: City | null;
  cities: City[];
  accessibleCityIds: string[];
  setSelectedCity: (city: City | null) => void;
  isLoading: boolean;
  hasMultipleCities: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

interface CityProviderProps {
  children: ReactNode;
}

export function CityProvider({ children }: CityProviderProps) {
  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const { user } = useAuth();

  // Fetch all cities
  const { data: allCities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
  });

  // Fetch user's accessible cities
  const { data: accessibleCityIds = [], isLoading: accessLoading } = useQuery({
    queryKey: ["/api/user/accessible-cities"],
  });

  // Filter cities based on user access (head_admin sees all, others see only accessible)
  const cities = allCities.filter((city: City) => {
    if (!city.isActive) return false;
    
    // Head admin sees all active cities
    if (user?.role === 'head_admin') {
      return true;
    }
    
    // Other users only see their accessible cities
    return accessibleCityIds.includes(city.id);
  });

  const isLoading = citiesLoading || accessLoading;
  const hasMultipleCities = cities.length > 1;

  // Set default city on initial load
  useEffect(() => {
    if (cities.length > 0 && !selectedCity && !isLoading) {
      // Try to get saved city from localStorage
      const savedCityId = localStorage.getItem("selectedCityId");
      const savedCity = cities.find((city: City) => city.id === savedCityId);
      
      if (savedCity && savedCity.isActive && accessibleCityIds.includes(savedCity.id)) {
        setSelectedCityState(savedCity);
      } else {
        // Default to first accessible city
        const defaultCity = cities[0];
        if (defaultCity) {
          setSelectedCityState(defaultCity);
        }
      }
    }
  }, [cities, selectedCity, isLoading, accessibleCityIds]);

  const setSelectedCity = (city: City | null) => {
    setSelectedCityState(city);
    if (city) {
      localStorage.setItem("selectedCityId", city.id);
    } else {
      localStorage.removeItem("selectedCityId");
    }
  };

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        cities,
        accessibleCityIds,
        setSelectedCity,
        isLoading,
        hasMultipleCities,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
}