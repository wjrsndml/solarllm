import * as React from "react"
import { cn } from "@/lib/utils"

// 简化版 Select 组件，适配基本下拉选择需求
export function Select({ value, onValueChange, children, ...props }: any) {
  return (
    <select
      value={value}
      onChange={e => onValueChange?.(e.target.value)}
      className={cn(
        "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        props.className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}
export function SelectValue({ placeholder }: any) {
  return <span className="text-gray-500">{placeholder}</span>;
}
export function SelectContent({ children }: any) {
  return <>{children}</>;
}
export function SelectItem({ value, children }: any) {
  return <option value={value}>{children}</option>;
} 