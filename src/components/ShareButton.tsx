"use client";

import { useEffect, useRef, useState } from "react";

interface ShareButtonProps {
  title: string;
  description?: string;
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
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 11 7.6-4.3" />
      <path d="m8.2 13 7.6 4.3" />
    </svg>
  );
}

function ActionLabel({ children }: { children: string }) {
  return <span className="hidden sm:inline">{children}</span>;
}

function baseButtonClassName() {
  return "inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";
}

function secondaryButtonClassName() {
  return `${baseButtonClassName()} border-accent/70 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20`;
}

function primaryButtonClassName() {
  return `${baseButtonClassName()} border-accent bg-accent text-[#0A0A0A] hover:bg-accent-hover hover:border-accent-hover`;
}

export function ShareButton({ title, description }: ShareButtonProps) {
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = window.location.href;
    setUrl((currentUrl) => (currentUrl === nextUrl ? currentUrl : nextUrl));
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  });

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const isReady = url.length > 0;
  const whatsappText = encodeURIComponent(`${title} — ${url}`);
  const twitterText = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const disabledLinkClassName = !isReady ? "pointer-events-none opacity-60" : "";

  async function handleCopy() {
    if (
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
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
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
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
        Condividi
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className={primaryButtonClassName()}
            aria-label="Condividi con il menu nativo"
          >
            <ShareIcon />
            <ActionLabel>Condividi</ActionLabel>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCopy}
          className={secondaryButtonClassName()}
          aria-label={copied ? "Link copiato" : "Copia il link"}
          disabled={!isReady}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          <ActionLabel>{copied ? "Copiato" : "Copia link"}</ActionLabel>
        </button>

        <a
          href={isReady ? `https://wa.me/?text=${whatsappText}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondaryButtonClassName()} ${disabledLinkClassName}`}
          aria-label="Condividi su WhatsApp"
          aria-disabled={!isReady}
        >
          <WhatsAppIcon />
          <ActionLabel>WhatsApp</ActionLabel>
        </a>

        <a
          href={
            isReady
              ? `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodedUrl}`
              : "#"
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondaryButtonClassName()} ${disabledLinkClassName}`}
          aria-label="Condividi su X"
          aria-disabled={!isReady}
        >
          <XIcon />
          <ActionLabel>X</ActionLabel>
        </a>
      </div>
    </div>
  );
}
