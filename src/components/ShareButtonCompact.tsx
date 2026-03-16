"use client";

import { useEffect, useRef, useState } from "react";

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

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10.5 13.5 13.5 10.5" />
      <path d="M8 16a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 1 1 5.7 5.7l-.8.8" />
      <path d="M16 8a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 1 1-5.7-5.7l.8-.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7l-3.2 1 1-3.1A8 8 0 1 1 20 11.5Z" />
      <path d="M9.3 8.6c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3-.1.5.3.6.8 1.2 1.3 1.7s1.1 1 1.8 1.3c.2.1.3 0 .5-.1l.6-.4c.2-.1.4-.1.6 0l1.8.8c.3.1.4.3.4.5v.6c0 .3 0 .5-.5.7-.5.2-1.6.4-3.5-.5-1.1-.5-2.3-1.3-3.5-2.5-1.2-1.2-2-2.4-2.5-3.5-.9-1.9-.7-3-.5-3.5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M4 4h4.6L20 20h-4.6L4 4Z" />
      <path d="M20 4 13.3 11.1" />
      <path d="M10.7 13.9 4 20" />
    </svg>
  );
}

function iconButtonClassName() {
  return "inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary";
}

export function ShareButtonCompact({
  title,
  description,
  bottomSectionId: _bottomSectionId = "condividi",
}: ShareButtonCompactProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setCopied(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  function getCurrentUrl() {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.href;
  }

  function openExternalShare(url: string) {
    if (!url || typeof window === "undefined") {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  async function handleCopy() {
    const url = getCurrentUrl();

    if (
      !url ||
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 2000);
    } catch {
      // Clipboard access can fail on unsupported or restricted contexts.
    }
  }

  async function handleNativeShare() {
    const url = getCurrentUrl();

    if (
      !url ||
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      return;
    }

    try {
      await navigator.share({
        title,
        text: description,
        url,
      });
    } catch {
      // Ignore aborted share actions.
    }

    setIsOpen(false);
  }

  function handleWhatsAppShare() {
    const url = getCurrentUrl();

    if (!url) {
      return;
    }

    openExternalShare(
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
    );
  }

  function handleXShare() {
    const url = getCurrentUrl();

    if (!url) {
      return;
    }

    openExternalShare(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    );
  }

  function handleToggle() {
    setIsOpen((currentValue) => {
      const nextValue = !currentValue;

      if (!nextValue) {
        setCopied(false);
      }

      return nextValue;
    });
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Condividi"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/70 bg-transparent text-accent transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
      >
        <ShareIcon />
      </button>

      <div
        className={`absolute right-0 top-full z-50 mt-2 flex items-center gap-1 rounded-2xl border border-border bg-bg-secondary p-2 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition-all duration-150 ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0"
        }`}
        role="dialog"
        aria-label="Azioni di condivisione"
      >
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className={iconButtonClassName()}
          aria-label="Condividi su WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppIcon />
        </button>

        <button
          type="button"
          onClick={handleXShare}
          className={iconButtonClassName()}
          aria-label="Condividi su X"
          title="X"
        >
          <XIcon />
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className={iconButtonClassName()}
          aria-label={copied ? "Link copiato" : "Copia il link"}
          title={copied ? "Copiato" : "Copia link"}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>

        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className={iconButtonClassName()}
            aria-label="Condividi con il menu nativo"
            title="Condividi"
          >
            <ShareIcon />
          </button>
        ) : null}
      </div>
    </div>
  );
}
