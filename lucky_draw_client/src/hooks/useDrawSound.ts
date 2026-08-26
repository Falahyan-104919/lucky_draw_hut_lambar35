import { useState, useEffect, useRef, useCallback } from "react";

export function useDrawSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("draw_sound_muted") === "true";
    } catch {
      return false;
    }
  });

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // Initialize audio objects once on mount
  useEffect(() => {
    const spinAudio = new Audio("/sounds/spinning.mp3");
    spinAudio.loop = true;
    spinAudio.volume = 0.7;
    spinAudio.preload = "auto";
    spinAudioRef.current = spinAudio;

    const celebrationAudio = new Audio("/sounds/celebration.mp3");
    celebrationAudio.loop = false;
    celebrationAudio.volume = 0.9;
    celebrationAudio.preload = "auto";
    celebrationAudioRef.current = celebrationAudio;

    const tickAudio = new Audio("/sounds/tick.mp3");
    tickAudio.loop = false;
    tickAudio.volume = 0.45;
    tickAudio.preload = "auto";
    tickAudioRef.current = tickAudio;

    return () => {
      if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
      spinAudio.pause();
      celebrationAudio.pause();
      tickAudio.pause();
      spinAudioRef.current = null;
      celebrationAudioRef.current = null;
      tickAudioRef.current = null;
    };
  }, []);

  // Synchronize mute state with audio elements
  useEffect(() => {
    if (spinAudioRef.current) spinAudioRef.current.muted = isMuted;
    if (celebrationAudioRef.current) celebrationAudioRef.current.muted = isMuted;
    if (tickAudioRef.current) tickAudioRef.current.muted = isMuted;
    try {
      localStorage.setItem("draw_sound_muted", String(isMuted));
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const playSpin = useCallback(() => {
    if (!spinAudioRef.current) return;
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    // Stop any existing celebration sound if re-drawing
    if (celebrationAudioRef.current) {
      celebrationAudioRef.current.pause();
      celebrationAudioRef.current.currentTime = 0;
    }

    const audio = spinAudioRef.current;
    audio.volume = 0.7;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Handled silently if browser autoplay requires user gesture
    });
  }, []);

  const stopSpin = useCallback((fadeOutDurationMs = 300) => {
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (!spinAudioRef.current) return;
    const audio = spinAudioRef.current;

    if (fadeOutDurationMs <= 0) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      return;
    }

    const currentVolume = audio.volume;
    if (currentVolume <= 0.05) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      return;
    }

    const steps = 10;
    const stepTime = fadeOutDurationMs / steps;
    const volumeStep = currentVolume / steps;

    fadeIntervalRef.current = window.setInterval(() => {
      if (!audio) {
        if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        return;
      }
      if (audio.volume > volumeStep) {
        audio.volume = Math.max(0, audio.volume - volumeStep);
      } else {
        if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }
    }, stepTime);
  }, []);

  const playCelebration = useCallback(() => {
    // Immediately and definitively kill spinning sound and any pending fade interval
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (spinAudioRef.current) {
      spinAudioRef.current.pause();
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.volume = 0;
    }

    if (!celebrationAudioRef.current) return;
    const audio = celebrationAudioRef.current;
    audio.currentTime = 0;
    audio.volume = 0.9;
    audio.play().catch(() => {
      // Ignore autoplay error
    });
  }, []);

  const playTick = useCallback(() => {
    if (!tickAudioRef.current || isMuted) return;
    try {
      // Clone audio for overlapping rapid ticks if needed
      const tickClone = tickAudioRef.current.cloneNode(true) as HTMLAudioElement;
      tickClone.volume = 0.45;
      tickClone.muted = isMuted;
      tickClone.play().catch(() => {});
    } catch {
      // Fallback to primary ref
      const audio = tickAudioRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [isMuted]);

  const stopAll = useCallback(() => {
    if (fadeIntervalRef.current) window.clearInterval(fadeIntervalRef.current);
    if (spinAudioRef.current) {
      spinAudioRef.current.pause();
      spinAudioRef.current.currentTime = 0;
    }
    if (celebrationAudioRef.current) {
      celebrationAudioRef.current.pause();
      celebrationAudioRef.current.currentTime = 0;
    }
    if (tickAudioRef.current) {
      tickAudioRef.current.pause();
      tickAudioRef.current.currentTime = 0;
    }
  }, []);

  return {
    isMuted,
    toggleMute,
    playSpin,
    stopSpin,
    playCelebration,
    playTick,
    stopAll,
  };
}
