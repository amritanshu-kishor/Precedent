import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-ink-800 dark:focus:ring-brass-400 disabled:opacity-40 disabled:cursor-not-allowed select-none active:translate-y-px tracking-wide';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 uppercase font-mono tracking-wider',
    md: 'text-xs px-4 py-2 gap-2 tracking-wide font-medium',
    lg: 'text-sm px-5 py-2.5 gap-2.5 tracking-wide',
  };

  const variantStyles = {
    primary:
      'bg-ink-800 dark:bg-brass-500 hover:bg-ink-900 dark:hover:bg-brass-600 text-ivory-50 dark:text-ink-950 border border-ink-800 dark:border-brass-400 shadow-fine hover:shadow-editorial',
    secondary:
      'bg-ivory-200 dark:bg-obsidian-300 hover:bg-ivory-300 dark:hover:bg-obsidian-200 text-ink-800 dark:text-ivory-100 border border-stone-300 dark:border-stone-700 shadow-fine',
    outline:
      'bg-transparent hover:bg-ivory-200 dark:hover:bg-obsidian-300 text-ink-800 dark:text-ivory-100 border border-stone-300 dark:border-stone-700 hover:border-ink-800 dark:hover:border-brass-400',
    teal:
      'bg-brass-500 hover:bg-brass-600 text-ivory-50 dark:text-ink-950 font-medium border border-brass-600 shadow-fine',
    danger:
      'bg-crimson-700 hover:bg-crimson-800 text-ivory-50 border border-crimson-800 shadow-fine',
    ghost:
      'bg-transparent hover:bg-stone-200/60 dark:hover:bg-obsidian-200 text-ink-700 dark:text-stone-300 hover:text-ink-950 dark:hover:text-ivory-50',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
