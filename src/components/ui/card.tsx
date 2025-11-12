"use client";

import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 " +
        className
      }
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={"mb-2 " + className} {...props} />;
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return <h3 className={"text-lg font-semibold " + className} {...props} />;
}

export function CardDescription({ className = "", ...props }: DivProps) {
  return <p className={"text-xs text-gray-500 dark:text-slate-400 " + className} {...props} />;
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={className} {...props} />;
}

export function CardFooter({ className = "", ...props }: DivProps) {
  return <div className={"mt-3 " + className} {...props} />;
}

