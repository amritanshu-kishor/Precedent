import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { NewDeviationModal } from '../common/NewDeviationModal';
import { AdvisoryBanner } from '../common/AdvisoryBanner';
import { Deviation } from '../../types';

export interface LayoutContextType {
  currentPlant: string;
  openNewDeviationModal: () => void;
  onDeviationCreated?: (d: Deviation) => void;
}

export const Layout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newDeviationOpen, setNewDeviationOpen] = useState(false);
  const [currentPlant, setCurrentPlant] = useState('demo-plant');

  return (
    <div className="min-h-screen flex font-sans bg-ivory-100 dark:bg-obsidian-500 text-ink-800 dark:text-ivory-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area — shifts based on sidebar state */}
      <div
        className="flex flex-col flex-1 min-w-0 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '3.5rem' : '16rem' }}
      >
        {/* Override on mobile: no left margin */}
        <style>{`
          @media (max-width: 1023px) {
            .precedent-main { margin-left: 0 !important; }
          }
        `}</style>

        <TopNavbar
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenNewDeviationModal={() => setNewDeviationOpen(true)}
          currentPlant={currentPlant}
          onPlantChange={(p) => setCurrentPlant(p)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
          <Outlet context={{ currentPlant, openNewDeviationModal: () => setNewDeviationOpen(true) }} />
        </main>

        <footer className="p-4 border-t border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 text-xs text-stone-500 dark:text-stone-400 w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <AdvisoryBanner compact className="max-w-2xl w-full" />
          <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-3">
            <span>PRECEDENT QUALITY INTELLIGENCE</span>
            <span>&bull;</span>
            <span>21 CFR PART 11</span>
            <span>&bull;</span>
            <span>ANNEX 11</span>
          </div>
        </footer>
      </div>

      <NewDeviationModal
        isOpen={newDeviationOpen}
        onClose={() => setNewDeviationOpen(false)}
        plantId={currentPlant}
      />
    </div>
  );
};
