import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/75 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Editorial Modal Dossier */}
      <div
        className={cn(
          'relative w-full bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 shadow-dossier p-6 sm:p-8 text-ink-800 dark:text-ivory-100 z-10 my-8 transition-colors',
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-brass-600 dark:text-brass-400 font-medium mb-1">
              Pharmaceutical Dossier &bull; Regulatory Record
            </div>
            <h3 className="font-serif text-xl font-medium text-ink-800 dark:text-ivory-100 tracking-tight">{title}</h3>
            {description && <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 dark:text-stone-500 hover:text-ink-800 dark:hover:text-ivory-100 border border-transparent hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};
