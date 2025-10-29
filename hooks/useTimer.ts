
import { useState, useRef, useCallback } from 'react';

export const useTimer = (initialSeconds: number) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!isActive && timeLeft > 0) {
      setIsActive(true);
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }, [isActive, timeLeft]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
  }, []);

  const reset = useCallback((seconds: number = initialSeconds) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
    setTimeLeft(seconds);
  }, [initialSeconds]);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prevTime) => prevTime + seconds);
  }, []);

  return { timeLeft, isActive, start, pause, reset, addTime };
};
