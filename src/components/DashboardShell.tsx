"use client";

import React from "react";

// Lightweight layout wrapper: centers content and applies consistent gutters
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      {children}
    </div>
  );
}
