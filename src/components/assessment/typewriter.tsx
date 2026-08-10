"use client";

import { useEffect, useState } from "react";

export function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="font-mono-console text-sm text-teal-2">
      {shown}
      <span className="animate-pulse">▍</span>
    </p>
  );
}
