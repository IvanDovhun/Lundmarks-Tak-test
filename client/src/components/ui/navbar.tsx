import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useEffectiveAuth } from "@/hooks/use-effective-auth";
import { useCity } from "@/contexts/city-context";
import { useQuery } from "@tanstack/react-query";
import '../css/Navbar.css';
import { 
  AdminIcon, CalculatorIcon, DemoIcon, DealsIcon, CRMIcon, ProjectIcon, 
  LogoutIcon, HamburgerIcon, CloseIcon, SettingsIcon, ReportsIcon, 
  ProfileIcon 
} from '@/icons/svg.tsx';
import { 
  Home, Calculator, FileText, Handshake, Users, FolderKanban, 
  Calendar, Package, BarChart, Settings, User, Menu, X, ChevronDown, MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemType {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

// Role-specific navigation menus
const getRoleBasedNavItems = (userRole: string): NavItemType[] => {
  const commonItems = [
    { name: 'DASHBOARD', path: '/', icon: Home, roles: ['head_admin', 'sales_admin', 'project_admin', 'sales_person'] },
    { name: 'KALKYL', path: '/calculator', icon: Calculator, roles: ['head_admin', 'sales_admin', 'project_admin', 'sales_person'] },
  ];

  switch (userRole) {
    case 'project_admin':
      return [
        ...commonItems,
        { name: 'AFFÄR', path: '/deals', icon: Handshake, roles: ['project_admin'] },
        { name: 'PROJEKT', path: '/project-leader-zendesk', icon: FolderKanban, roles: ['project_admin'] },
        { name: 'PLANERING', path: '/planning', icon: Calendar, roles: ['project_admin'] },
        { name: 'PROFIL', path: '/profile', icon: User, roles: ['project_admin'] },
      ];

    case 'sales_admin':
      return [
        ...commonItems,
        { name: 'AFFÄR', path: '/deals', icon: Handshake, roles: ['sales_admin'] },
        { name: 'PROFIL', path: '/profile', icon: User, roles: ['sales_admin'] },
      ];

    case 'sales_person':
      return [
        ...commonItems,
        { name: 'AFFÄR', path: '/deals', icon: Handshake, roles: ['sales_person'] },
      ];

    case 'head_admin':
    default:
      return [
        ...commonItems,
        { name: 'AFFÄR', path: '/deals', icon: Handshake, roles: ['head_admin'] },
        { name: 'PROJEKT', path: '/project-leader-zendesk', icon: FolderKanban, roles: ['head_admin'] },
        { name: 'PLANERING', path: '/planning', icon: Calendar, roles: ['head_admin'] },
        { name: 'PERSONAL', path: '/employees', icon: Users, roles: ['head_admin'] },
        { name: 'PROFIL', path: '/profile', icon: User, roles: ['head_admin'] },
      ];
  }
};

// User menu items (currently empty since notifications were removed)
const userMenuItems: NavItemType[] = [
];


function Navbar() {
    const { effectiveUser, userRole, logoutMutation } = useEffectiveAuth();
    const [location] = useLocation();
    const currentPath = location;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Get role-specific navigation items
    const navItems = useMemo(() => {
        return getRoleBasedNavItems(userRole || 'sales_person');
    }, [userRole]);

    // All nav items combined for current page detection
    const allNavItems = useMemo(() => {
        const filteredUserItems = userMenuItems.filter(item => item.roles.includes(userRole || 'sales_person'));
        return [...navItems, ...filteredUserItems];
    }, [navItems, userRole]);

    const currentPage = useMemo(() => {
        let foundItem = allNavItems.find(item =>
          currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/')
        );
        
        if (currentPath === '/') {
            foundItem = allNavItems.find(item => item.path === '/');
        }

        return foundItem || { name: 'MENU', path: '/', icon: Menu, roles: [] };
    }, [currentPath, allNavItems]);

    const openMobileMenu = () => {
        setIsMobileMenuOpen(true);
        setIsAnimatingOut(false);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeMobileMenu = () => {
        setIsAnimatingOut(true);
        document.body.style.overflow = 'unset'; // Restore scroll
        setTimeout(() => {
            setIsMobileMenuOpen(false);
            setIsAnimatingOut(false);
        }, 300);
    };

    useEffect(() => {
        if (isMobileMenuOpen) {
            closeMobileMenu();
        }
    }, [location]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset'; // Cleanup on unmount
        };
    }, []);

    const renderNavItem = (item: NavItemType, isMobile: boolean = false) => {
        const isActive = currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/');
        const IconComponent = item.icon;
        
        return (
            <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
                onClick={isMobile ? closeMobileMenu : undefined}
            >
                <IconComponent className="nav-icon" size={20} />
                <span className="nav-text">{item.name}</span>
            </Link>
        );
    };

    const renderMobileNavGroup = (items: NavItemType[], title: string) => {
        if (items.length === 0) return null;
        
        return (
            <div className="nav-group">
                <div className="nav-group-title">{title}</div>
                <div className="nav-group-items">
                    {items.map(item => renderNavItem(item, true))}
                </div>
            </div>
        );
    };

    const CitySelector = () => {
        const { selectedCity, cities, setSelectedCity, isLoading, hasMultipleCities } = useCity();
        const { data: locationSetting } = useQuery({
            queryKey: ['/api/admin/settings/location_dropdown_enabled'],
        });
        
        // Check if location dropdown should be shown
        const shouldShowLocationDropdown = () => {
            // Head admin always sees all cities
            if (effectiveUser?.role === 'head_admin') {
                return hasMultipleCities;
            }
            
            // For other roles, show if user has multiple city access OR admin has enabled location dropdown
            if (!effectiveUser || (effectiveUser.role !== 'sales_admin' && effectiveUser.role !== 'project_admin')) {
                return false;
            }
            
            // Show if user has multiple cities or admin has enabled the setting
            return hasMultipleCities || locationSetting === true;
        };
        
        if (isLoading || cities.length === 0 || !shouldShowLocationDropdown()) {
            return null;
        }
        
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <MapPin size={16} />
                        <span className="font-medium">
                            {selectedCity?.name || "Välj stad"}
                        </span>
                        <ChevronDown size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {cities.map((city) => (
                        <DropdownMenuItem
                            key={city.id}
                            onClick={() => setSelectedCity(city)}
                            className={`cursor-pointer ${selectedCity?.id === city.id ? 'bg-blue-50' : ''}`}
                        >
                            <MapPin size={16} className="mr-2" />
                            {city.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <nav className="navbar">
            {/* Desktop Navigation */}
            <div className="navbar-desktop">
                <div className="navbar-links">
                    {navItems.map(item => renderNavItem(item))}
                    {userMenuItems.filter(item => item.roles.includes(userRole || 'sales_person')).map(item => renderNavItem(item))}
                </div>

                <div className="navbar-right">
                    <CitySelector />
                    <button 
                        onClick={() => logoutMutation.mutate()} 
                        className="nav-item logout-btn desktop"
                        title="Logga ut"
                    >
                        <LogoutIcon size={20} className="nav-icon" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="navbar-mobile">
                <div className="mobile-header">
                    <div className="current-page">
                        <currentPage.icon className="current-page-icon" size={20} />
                        <span className="current-page-text">{currentPage.name}</span>
                    </div>
                    <button 
                        onClick={openMobileMenu} 
                        className="menu-toggle"
                        aria-label="Toggle menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={closeMobileMenu}>
                    <div 
                        ref={menuRef}
                        className={`mobile-sidebar ${isAnimatingOut ? 'closing' : 'opening'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mobile-sidebar-header">
                            <div className="mobile-brand">
                                <span className="brand-text">MENY</span>
                            </div>
                            <button 
                                onClick={closeMobileMenu} 
                                className="close-btn"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mobile-sidebar-content">
                            {/* City selector for mobile */}
                            <div className="nav-group">
                                <div className="nav-group-title">STAD</div>
                                <CitySelector />
                            </div>

                            {renderMobileNavGroup(navItems, 'HUVUDMENY')}
                            {userMenuItems.filter(item => item.roles.includes(userRole || 'sales_person')).length > 0 && 
                                renderMobileNavGroup(userMenuItems.filter(item => item.roles.includes(userRole || 'sales_person')), 'ANVÄNDARE')}
                            
                            <div className="nav-group">
                                <button 
                                    onClick={() => {
                                        logoutMutation.mutate();
                                        closeMobileMenu();
                                    }}
                                    className="nav-item logout-btn mobile"
                                >
                                    <LogoutIcon className="nav-icon" size={20} />
                                    <span className="nav-text">LOGGA UT</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;