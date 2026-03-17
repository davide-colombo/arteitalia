"use client";

import { useEffect, useRef, useState } from "react";

import {
  CheckIcon,
  CopyLinkIcon,
  EmailIcon,
  LinkedInIcon,
  NativeShareIcon,
  TelegramIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/ShareIcons";

interface ShareButtonCompactProps {
  title: string;
  description?: string;
  bottomSectionId?: string;
}

function iconButtonClassName() {
  return "inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[#0A0A0A] transition-colors hover:bg-transparent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary";
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
    if (canNativeShare) {
      setIsOpen(false);
      setCopied(false);
    }
  }, [canNativeShare]);

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

  function handleTelegramShare() {
    const url = getCurrentUrl();

    if (!url) {
      return;
    }

    openExternalShare(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    );
  }

  function handleLinkedInShare() {
    const url = getCurrentUrl();

    if (!url) {
      return;
    }

    openExternalShare(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
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

  function handleEmailShare() {
    const url = getCurrentUrl();

    if (!url) {
      return;
    }

    openExternalShare(
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title} — ${url}`)}`,
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

  function handleMainButtonClick() {
    if (canNativeShare) {
      void handleNativeShare();
      return;
    }

    handleToggle();
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleMainButtonClick}
        aria-label="Condividi"
        aria-expanded={canNativeShare ? undefined : isOpen}
        aria-haspopup={canNativeShare ? undefined : "dialog"}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/70 bg-transparent text-accent transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
      >
        <NativeShareIcon className="h-4 w-4" />
      </button>

      {!canNativeShare ? (
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
            <WhatsAppIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleTelegramShare}
            className={iconButtonClassName()}
            aria-label="Condividi su Telegram"
            title="Telegram"
          >
            <TelegramIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleLinkedInShare}
            className={iconButtonClassName()}
            aria-label="Condividi su LinkedIn"
            title="LinkedIn"
          >
            <LinkedInIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleXShare}
            className={iconButtonClassName()}
            aria-label="Condividi su X"
            title="X"
          >
            <XIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleEmailShare}
            className={iconButtonClassName()}
            aria-label="Condividi via email"
            title="Email"
          >
            <EmailIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={iconButtonClassName()}
            aria-label={copied ? "Link copiato" : "Copia il link"}
            title={copied ? "Copiato" : "Copia link"}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyLinkIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
