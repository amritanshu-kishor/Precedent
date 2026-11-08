import React, { useState, useEffect } from 'react';
import { Menu, Plus, RefreshCw, Moon, Sun } from 'lucide-react';
import { api, subscribeToBackendStatus } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  onOpenNewDeviationModal: () => void;
  currentPlant: string;
  onPlantChange: (plantId: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenMobileMenu,
  onOpenNewDeviationModal,
  currentPlant,
  onPlantChange,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToBackendStatus((live) => {
      setIsBackendLive(live);
    });
    checkConnection();
    return () => unsubscribe();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    await api.checkHealth();
    setIsChecking(false);
  };

  return (
    <header
      className="h-14 sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-5 border-b"
      style={{
        backgroundColor: isDark ? '#14160F' : '#EDE8D8',
        borderColor: isDark ? '#2A2D22' : '#CCC8B8',
      }}
    >
      {/* Left: mobile hamburger + facility */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger only */}
        <button
          onClick={onOpenMobileMenu}
          title="Open navigation"
          className="lg:hidden flex items-center justify-center w-8 h-8 border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-ink-900 dark:hover:text-ivory-50 hover:bg-ivory-200 dark:hover:bg-obsidian-200 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Facility selector */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 border text-xs"
          style={{
            backgroundColor: isDark ? '#1C1F18' : '#F4EFE4',
            borderColor: isDark ? '#3A3D30' : '#C4C0B0',
          }}
        >
          <span
            className="font-mono text-[9px] uppercase tracking-widest font-semibold hidden sm:inline"
            style={{ color: isDark ? '#8A8880' : '#66645D' }}
          >
            Facility:
          </span>
          <select
            value={currentPlant}
            onChange={(e) => onPlantChange(e.target.value)}
            className="bg-transparent font-sans text-xs font-semibold focus:outline-none cursor-pointer"
            style={{ color: isDark ? '#EDE8DC' : '#1E1E18' }}
          >
            <option value="demo-plant">Plant 01 — Sterile Fill-Finish</option>
            <option value="plant-boston">Plant 02 — Biologics API</option>
            <option value="plant-basel">Plant 03 — Lyophilization</option>
          </select>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Theme toggle — icon only */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Ivory (Light)' : 'Switch to Obsidian (Dark)'}
          className="flex items-center justify-center w-8 h-8 border transition-colors"
          style={{
            backgroundColor: isDark ? '#1C1F18' : '#F4EFE4',
            borderColor: isDark ? '#3A3D30' : '#C4C0B0',
          }}
        >
          {isDark
            ? <Sun className="w-4 h-4" style={{ color: '#D4AE62' }} />
            : <Moon className="w-4 h-4" style={{ color: '#66645D' }} />
          }
        </button>

        {/* Backend status */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border"
            style={{
              backgroundColor: isBackendLive
                ? (isDark ? 'rgba(28,82,50,0.3)' : '#F0F8F2')
                : (isDark ? 'rgba(56,36,5,0.3)' : '#FDF8EE'),
              borderColor: isBackendLive
                ? (isDark ? '#276944' : '#97C3A9')
                : (isDark ? '#784A08' : '#E8BE78'),
              color: isBackendLive
                ? (isDark ? '#56A67A' : '#1C5232')
                : (isDark ? '#DFA444' : '#784A08'),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                backgroundColor: isBackendLive
                  ? (isDark ? '#56A67A' : '#3A8560')
                  : (isDark ? '#DFA444' : '#C4851E'),
              }}
            />
            <span className="hidden md:inline">
              {isBackendLive ? 'API Live (8004)' : 'Synthetic Fallback'}
            </span>
            <span className="md:hidden">
              {isBackendLive ? 'Live' : 'Demo'}
            </span>
          </div>

          <button
            onClick={checkConnection}
            title="Recheck backend"
            className="flex items-center justify-center w-8 h-8 border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-ivory-50 hover:bg-ivory-200 dark:hover:bg-obsidian-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* QA Sign-off */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-mono"
          style={{
            backgroundColor: isDark ? '#1C1F18' : '#F4EFE4',
            borderColor: isDark ? '#3A3D30' : '#C4C0B0',
            color: isDark ? '#8A8880' : '#66645D',
          }}
        >
          <span>SIGN-OFF:</span>
          <span className="font-semibold" style={{ color: isDark ? '#EDE8DC' : '#1E1E18' }}>
            Dr. M. Vance
          </span>
        </div>

        {/* File Deviation CTA */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewDeviationModal}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">File Deviation</span>
          <span className="sm:hidden">File</span>
        </Button>
      </div>
    </header>
  );
};
