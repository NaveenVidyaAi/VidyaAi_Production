import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "./Icon";

const TOUR_VERSION = "v1";

export default function GuidedTour({ accountId, role, steps, onStepChange }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const dialogRef = useRef(null);
  const onStepChangeRef = useRef(onStepChange);
  const reduceMotion = useReducedMotion();
  const storageKey = useMemo(() => accountId ? `vidyaai_tour_${TOUR_VERSION}_${role}_${accountId.trim().toLowerCase()}` : "", [accountId, role]);
  const progressKey = `${storageKey}_step`;
  const step = steps[stepIndex];

  useEffect(() => { onStepChangeRef.current = onStepChange; }, [onStepChange]);

  useEffect(() => {
    if (!storageKey || localStorage.getItem(storageKey)) return;
    const savedStep = Math.min(Number(localStorage.getItem(progressKey)) || 0, Math.max(steps.length - 1, 0));
    setStepIndex(savedStep);
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [storageKey, progressKey, steps.length]);

  useEffect(() => {
    if (open && progressKey) localStorage.setItem(progressKey, String(stepIndex));
  }, [open, stepIndex, progressKey]);

  const measureTarget = useCallback(() => {
    if (!step?.target) return setTargetRect(null);
    const target = document.querySelector(step.target);
    if (!target || target.getClientRects().length === 0) return setTargetRect(null);
    const rect = target.getBoundingClientRect();
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, [step?.target]);

  useEffect(() => {
    if (!open || !step) return undefined;
    onStepChangeRef.current?.(step, stepIndex);
    const target = step.target ? document.querySelector(step.target) : null;
    target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center", inline: "center" });
    const timer = window.setTimeout(measureTarget, reduceMotion ? 0 : 280);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [open, stepIndex, step?.target, measureTarget, reduceMotion]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 40);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft" && stepIndex > 0) setStepIndex((value) => value - 1);
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", handleKeyDown); };
  });

  const finish = () => {
    if (storageKey) localStorage.setItem(storageKey, new Date().toISOString());
    if (progressKey) localStorage.removeItem(progressKey);
    setOpen(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) finish();
    else setStepIndex((value) => value + 1);
  };

  if (!open || !step || typeof document === "undefined") return null;

  const cardStyle = targetRect ? {
    "--tour-target-top": `${targetRect.top}px`,
    "--tour-target-left": `${targetRect.left}px`,
    "--tour-target-width": `${targetRect.width}px`,
    "--tour-target-height": `${targetRect.height}px`,
    "--tour-card-left": `${Math.max(16, Math.min(window.innerWidth - 376, targetRect.left + targetRect.width / 2 - 180))}px`,
    "--tour-card-top": `${targetRect.top + targetRect.height + 18 + 310 < window.innerHeight ? targetRect.top + targetRect.height + 18 : Math.max(16, targetRect.top - 292)}px`,
  } : undefined;

  return createPortal(
    <AnimatePresence>
      <motion.div className={`guided-tour guided-tour-${role}${targetRect ? " has-target" : ""}`} style={cardStyle} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
        {targetRect && <motion.div className="guided-tour-spotlight" layout transition={{ type: "spring", stiffness: 320, damping: 32 }} aria-hidden="true" />}
        <motion.section ref={dialogRef} className="guided-tour-card" role="dialog" aria-modal="true" aria-labelledby="guided-tour-title" aria-describedby="guided-tour-copy" tabIndex="-1" initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.24, ease: "easeOut" }}>
          <header>
            <span className="guided-tour-icon" aria-hidden="true"><Icon name={step.icon || "sparkle"} size={20} /></span>
            <span className="guided-tour-progress">{stepIndex + 1} / {steps.length}</span>
            <button type="button" onClick={finish} aria-label={step.skipLabel}><Icon name="close" size={18} /></button>
          </header>
          <div className="guided-tour-progress-track" aria-hidden="true"><motion.span animate={{ scaleX: (stepIndex + 1) / steps.length }} transition={{ duration: reduceMotion ? 0 : 0.22 }} /></div>
          <p className="guided-tour-kicker">{step.kicker}</p>
          <h2 id="guided-tour-title">{step.title}</h2>
          <p id="guided-tour-copy">{step.body}</p>
          <footer>
            <button type="button" className="guided-tour-skip" onClick={finish}>{step.skipLabel}</button>
            <div>
              {stepIndex > 0 && <button type="button" className="guided-tour-back" onClick={() => setStepIndex((value) => value - 1)}>{step.backLabel}</button>}
              <button type="button" className="guided-tour-next" onClick={next}>{stepIndex === steps.length - 1 ? step.finishLabel : step.nextLabel}<Icon name="arrowRight" size={16} /></button>
            </div>
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
