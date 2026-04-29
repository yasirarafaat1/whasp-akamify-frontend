import React from "react";

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
      {children}
    </div>
  );
}
