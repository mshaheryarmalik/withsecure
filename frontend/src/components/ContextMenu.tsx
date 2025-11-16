import { useEffect, useRef } from 'react';
import { RotateCcw, Trash2, FileText, Link2, Copy, Share2, Download, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface ContextMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close on right-click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position adjustment to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[240px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.1)',
      }}
    >
      <div className="py-1.5">
        {items.map((item, index) => (
          <div key={index}>
            {item.divider && (
              <div className="h-px bg-slate-700/50 my-1.5" />
            )}
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full px-3 py-2 flex items-center gap-3 text-sm font-mono transition-all
                ${item.disabled
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : item.danger
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }
                ${!item.disabled && 'active:scale-[0.98]'}
              `}
            >
              <span className={`
                flex-shrink-0 w-4 h-4
                ${item.danger && !item.disabled ? 'text-red-400' : 'text-slate-500'}
              `}>
                {item.icon}
              </span>
              <span className="flex-1 text-left tracking-wide">{item.label}</span>
              {item.disabled && (
                <span className="text-xs text-slate-600 uppercase tracking-wider">N/A</span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
