import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  showAllLink?: string;
}

export const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  showAllLink,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="py-3 sm:py-4">
      {/* Section header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-start gap-2.5">
          {icon && (
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {showAllLink && (
          <a
            href={showAllLink}
            className="text-sm font-bold text-[#fbbf24] hover:text-[#f59e0b] transition-colors shrink-0 mt-1"
          >
            See all →
          </a>
        )}
      </div>

      {/* Scroll area */}
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-[#1e1e1e] shadow-lg rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700 hover:border-[#fbbf24] hover:text-[#fbbf24] text-gray-500 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-[#1e1e1e] shadow-lg rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700 hover:border-[#fbbf24] hover:text-[#fbbf24] text-gray-500 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
