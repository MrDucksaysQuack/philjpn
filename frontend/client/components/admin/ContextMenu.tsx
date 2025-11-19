"use client";

import { useState, useRef, useEffect } from "react";

export interface ContextMenuItem {
  label?: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export default function ContextMenu({ items, children, className = "" }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="메뉴 열기"
      >
        {children}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="border-t border-gray-200 my-1" />;
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                role="menuitem"
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

