import { motion } from "motion/react";
import { ShelfSection } from "@/components/map/types";
import { getCapacityFill, getCapacityPercent } from "@/components/map/utils";

interface LibraryMapCanvasProps {
  sections: ShelfSection[];
  selectedSectionId: string | null;
  onSelectSection: (section: ShelfSection) => void;
}

export function LibraryMapCanvas({ sections, selectedSectionId, onSelectSection }: LibraryMapCanvasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative h-full rounded-xl border border-gray-200 bg-slate-100"
    >
      <svg viewBox="0 0 600 380" className="h-full w-full">
        <rect x="20" y="28" width="560" height="322" rx="18" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />

        <rect x="20" y="310" width="560" height="40" rx="0" fill="#BFDBFE" opacity="0.65" />
        <text x="300" y="336" textAnchor="middle" className="fill-brand-navy text-[13px] font-semibold tracking-wide">
          Main Entrance
        </text>

        {sections.map((section) => {
          const isSelected = selectedSectionId === section.id;
          const percent = getCapacityPercent(section.used, section.capacity);

          return (
            <g key={section.id} onClick={() => onSelectSection(section)} style={{ cursor: "pointer" }}>
              <rect
                x={section.x}
                y={section.y}
                width={section.width}
                height={section.height}
                rx="10"
                fill={getCapacityFill(section.used, section.capacity)}
                stroke={isSelected ? "#312E81" : "#ffffff"}
                strokeWidth={isSelected ? 4 : 2}
                className="transition-all"
              />
              <text
                x={section.x + section.width / 2}
                y={section.y + section.height / 2 - 8}
                textAnchor="middle"
                className="pointer-events-none fill-white text-[14px] font-semibold"
              >
                {section.name}
              </text>
              <text
                x={section.x + section.width / 2}
                y={section.y + section.height / 2 + 12}
                textAnchor="middle"
                className="pointer-events-none fill-white text-[11px]"
              >
                {section.category}
              </text>
              <text
                x={section.x + section.width - 10}
                y={section.y + 16}
                textAnchor="end"
                className="pointer-events-none fill-white text-[10px] font-semibold"
              >
                {percent}%
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}
