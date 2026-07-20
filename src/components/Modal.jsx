import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children, footer }) {
  const titleId = useId();
  const [visualViewport, setVisualViewport] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const viewport = window.visualViewport;
    const updateVisualViewport = () => {
      setVisualViewport(
        viewport
          ? {
              height: viewport.height,
              top: viewport.offsetTop,
            }
          : null
      );
    };

    window.addEventListener("keydown", onKey);
    viewport?.addEventListener("resize", updateVisualViewport);
    viewport?.addEventListener("scroll", updateVisualViewport);
    updateVisualViewport();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      viewport?.removeEventListener("resize", updateVisualViewport);
      viewport?.removeEventListener("scroll", updateVisualViewport);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-x-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      style={
        visualViewport
          ? { height: `${visualViewport.height}px`, top: `${visualViewport.top}px` }
          : { insetBlock: 0 }
      }
    >
      <div className="absolute inset-0 animate-fade bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col animate-pop overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl shadow-black/30 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 id={titleId} className="text-lg font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-muted-alt hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
