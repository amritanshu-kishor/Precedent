import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose, onToggleCollapse }) => {
  const navItems = [
    { num: '01', name: 'Command Centre', path: '/' },
    { num: '02', name: 'Deviations', path: '/deviations' },
    { num: '03', name: 'AI Investigation', path: '/investigation', tag: '4A' },
    { num: '04', name: 'Recommendations & Review', path: '/recommendations' },
    { num: '05', name: 'Historical Precedents', path: '/precedents' },
    { num: '06', name: 'CAPA Management', path: '/capa' },
    { num: '07', name: 'Effectiveness Monitoring', path: '/effectiveness' },
    { num: '08', name: 'Quality Analytics', path: '/analytics' },
    { num: '09', name: 'AI Memory & Governance', path: '/memory' },
    { num: '10', name: 'Inspector Review', path: '/inspector' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out',
          'bg-ivory-200 dark:bg-obsidian-400 border-stone-300 dark:border-stone-700',
          // Desktop: collapsed = 56px wide, expanded = 256px
          collapsed ? 'lg:w-14' : 'lg:w-64',
          // Mobile: slide in/out
          'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Masthead */}
        <div className={cn(
          'flex items-center border-b border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 relative transition-all duration-300',
          collapsed ? 'h-14 justify-center px-0' : 'h-16 px-4 justify-between'
        )}>
          {!collapsed && (
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-serif text-lg font-bold tracking-tight text-ink-800 dark:text-ivory-100 leading-none">
                PRECEDENT
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-brass-600 dark:text-brass-400 mt-0.5">
                Quality Intelligence
              </span>
            </div>
          )}

          {collapsed && (
            <span className="font-serif text-sm font-bold text-ink-800 dark:text-ivory-100">P</span>
          )}

          {/* Collapse toggle — desktop */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 rounded-sm',
              'text-stone-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-ivory-100',
              'hover:bg-ivory-300 dark:hover:bg-obsidian-200 transition-colors',
              collapsed && 'absolute -right-3.5 top-1/2 -translate-y-1/2 bg-ivory-200 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 shadow-fine z-10'
            )}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-stone-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-ivory-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {!collapsed && (
            <div className="px-2 pb-2 pt-1 text-[9px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Navigation Index
            </div>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              title={collapsed ? `${item.num} · ${item.name}` : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 transition-all duration-150 border',
                  collapsed ? 'justify-center px-0 py-2.5 mx-0' : 'px-2.5 py-2 mx-0',
                  isActive
                    ? 'bg-ink-800 dark:bg-brass-500 text-white dark:text-ink-900 border-ink-800 dark:border-brass-400 font-semibold'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-ivory-50 hover:bg-ivory-300 dark:hover:bg-obsidian-200 hover:border-stone-200 dark:hover:border-stone-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'font-mono text-[10px] tracking-wider flex-shrink-0',
                      isActive
                        ? 'text-brass-300 dark:text-ink-900 font-bold'
                        : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'
                    )}
                  >
                    {item.num}
                  </span>

                  {!collapsed && (
                    <>
                      <span className="truncate text-xs font-sans">{item.name}</span>
                      {item.tag && (
                        <span
                          className={cn(
                            'ml-auto font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 border flex-shrink-0',
                            isActive
                              ? 'bg-brass-500 dark:bg-ink-900 text-white dark:text-brass-300 border-brass-400 dark:border-brass-600'
                              : 'bg-ivory-100 dark:bg-obsidian-500 text-brass-600 dark:text-brass-400 border-brass-300 dark:border-brass-700'
                          )}
                        >
                          {item.tag}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer info */}
        {!collapsed && (
          <div className="p-3 border-t border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 font-mono text-[9px] text-stone-500 dark:text-stone-400 space-y-1">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
              <span>SPEC: 21 CFR §11</span>
              <span className="text-brass-600 dark:text-brass-400 font-bold">VERIFIED</span>
            </div>
            <div className="text-[8px] text-stone-400 dark:text-stone-500 truncate">
              PRECEDENT Core v2.4 · Editorial System
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
