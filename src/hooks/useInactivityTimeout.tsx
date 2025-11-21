import { useEffect, useRef, useCallback } from "react";

interface UseInactivityTimeoutProps {
  onTimeout: () => void;
  timeout?: number;
  enabled?: boolean;
  warningTime?: number;
  onWarning?: () => void;
}

export const useInactivityTimeout = ({
  onTimeout,
  timeout = 300000, // 5 minutes default
  enabled = true,
  warningTime = 30000, // 30 seconds before timeout
  onWarning,
}: UseInactivityTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearTimers();

    // Set warning timer
    if (onWarning && warningTime < timeout) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, timeout - warningTime);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [enabled, timeout, warningTime, onTimeout, onWarning, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Events that indicate user activity
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, resetTimer, clearTimers]);
};
