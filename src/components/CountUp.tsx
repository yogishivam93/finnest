"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  formatter?: (n: number) => string;
  durationMs?: number;
  className?: string;
};

export default function CountUp({ value, formatter, durationMs = 800, className }: Props) {
  const [display, setDisplay] = useState<number>(Number(value) || 0);
  const startVal = useRef<number>(Number(value) || 0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = display;
    const to = Number(value) || 0;
    if (!isFinite(from) || !isFinite(to)) return;
    startVal.current = from;
    const start = performance.now();

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / Math.max(1, durationMs));
      const eased = easeOutCubic(t);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) raf.current = requestAnimationFrame(frame);
    }

    raf.current = requestAnimationFrame(frame);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = formatter ? formatter(display) : Math.round(display).toLocaleString();
  return <span className={className}>{text}</span>;
}

