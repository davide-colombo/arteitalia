"use client";

import { useEffect, useState } from "react";

interface ShareButtonCompactProps {
  title: string;
  description?: string;
  bottomSectionId?: string;
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3v10" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 11.5v6A1.5 1.5 0 0 0 7.5 19h9a1.5 1.5 0 0 0 1.5-1.5v-6" />
    </svg>
  );
}

export function ShareButtonCompact({
  title,
  description,
  bottomSectionId = "condividi",
}: ShareButtonCompactProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  function scrollToBottomSection() {
    if (typeof document === "undefined") {
      return;
    }

    document
      .getElementById(bottomSectionId)
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleClick() {
    if (typeof window === "undefined") {
      return;
    }

    if (
      canNativeShare &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title,
          text: description,
          url: window.location.href,
        });
        return;
      } catch {
        scrollToBottomSection();
      }
    }

    scrollToBottomSection();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Condividi"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/70 bg-transparent text-accent transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
    >
      <ShareIcon />
    </button>
  );
}
