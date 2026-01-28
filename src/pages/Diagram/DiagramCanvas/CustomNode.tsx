import { Handle, Position } from "@xyflow/react";
import clsx from "clsx";

interface CustomNodeProps {
  data: {
    label: string;
    orden?: number;
  };
  selected?: boolean;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  return (
    <div className="relative flex items-center justify-center w-[140px]">
      {}
      <div className="absolute -left-6 text-sm font-semibold text-blue-600 select-none pointer-events-none">
        {data.orden}
      </div>

      {}
      <div
        className={clsx(
          "px-3 py-2 rounded-md text-sm font-medium text-center w-full transition-all duration-150",
          selected
            ? "bg-blue-200 border-2 border-blue-600 shadow-md text-blue-900"
            : "bg-blue-100 border border-blue-300 text-blue-800 shadow-sm"
        )}
      >
        {data.label}
      </div>

      {}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}