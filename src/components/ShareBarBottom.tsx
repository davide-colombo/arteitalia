"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  CheckIcon,
  CopyLinkIcon,
  EmailIcon,
  LinkedInIcon,
  TelegramIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/ShareIcons";

interface ShareBarBottomProps {
  title: string;
  description?: string;
  callToAction?: string;
  id?: string;
}

function ActionLabel({ children }: { children: string }) {
  return <span className="hidden sm:inline">{children}</span>;
}

function shareButtonClassName() {
  return "inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";
}

export function ShareBarBottom({
  title,
  callToAction,
  id = "condividi",
}: ShareBarBottomProps) {
  const url = useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

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
  const emailSubject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(`${title} — ${url}`);
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

  return (
    <section id={id} className="border-t border-border py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        {callToAction && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {callToAction}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={isReady ? `https://wa.me/?text=${whatsappText}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`${shareButtonClassName()} ${disabledLinkClassName} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label="Condividi su WhatsApp"
            aria-disabled={!isReady}
          >
            <WhatsAppIcon />
            <ActionLabel>WhatsApp</ActionLabel>
          </a>

          <a
            href={
              isReady
                ? `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`${shareButtonClassName()} ${disabledLinkClassName} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label="Condividi su Telegram"
            aria-disabled={!isReady}
          >
            <TelegramIcon />
            <ActionLabel>Telegram</ActionLabel>
          </a>

          <a
            href={
              isReady
                ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`${shareButtonClassName()} ${disabledLinkClassName} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label="Condividi su LinkedIn"
            aria-disabled={!isReady}
          >
            <LinkedInIcon />
            <ActionLabel>LinkedIn</ActionLabel>
          </a>

          <a
            href={
              isReady
                ? `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodedUrl}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`${shareButtonClassName()} ${disabledLinkClassName} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label="Condividi su X"
            aria-disabled={!isReady}
          >
            <XIcon />
            <ActionLabel>X</ActionLabel>
          </a>

          <a
            href={
              isReady ? `mailto:?subject=${emailSubject}&body=${emailBody}` : "#"
            }
            className={`${shareButtonClassName()} ${disabledLinkClassName} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label="Condividi via email"
            aria-disabled={!isReady}
          >
            <EmailIcon />
            <ActionLabel>Email</ActionLabel>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className={`${shareButtonClassName()} border-accent bg-accent text-[#0A0A0A] hover:bg-transparent hover:text-accent`}
            aria-label={copied ? "Link copiato" : "Copia il link"}
            disabled={!isReady}
          >
            {copied ? <CheckIcon /> : <CopyLinkIcon />}
            <ActionLabel>{copied ? "Copiato" : "Copia link"}</ActionLabel>
          </button>
        </div>
      </div>
    </section>
  );
}
