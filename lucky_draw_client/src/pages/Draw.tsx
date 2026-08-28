import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  TrophyIcon,
  IdentificationCardIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  MedalIcon,
  ListIcon,
  LockKeyIcon,
  GiftIcon,
  BuildingsIcon,
  UsersIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  ArrowsOutIcon,
  ArrowsInIcon,
} from "@phosphor-icons/react";

import { motion, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import type { DrawMode, ParticipantWinner, PekonWinner } from "@/types/draw";
import { useDrawSound } from "@/hooks";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

const TapisCorner = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "w-16 h-16 md:w-24 md:h-24 text-[#C09A5B]/25 pointer-events-none absolute z-10",
      className,
    )}
  >
    <path
      d="M4 4H44M4 4V44M14 14H36M14 14V36M4 4L34 34M22 22L36 36"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    <polygon points="4,4 12,4 4,12" fill="currentColor" opacity="0.6" />
    <circle cx="28" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="28" r="1.5" fill="currentColor" />
    <circle cx="36" cy="14" r="1.5" fill="currentColor" />
    <circle cx="14" cy="36" r="1.5" fill="currentColor" />
  </svg>
);

const RollingChar = ({
  targetChar,
  isSpinning,
  stopDelay,
  hasStarted,
  onStop,
}: {
  targetChar: string;
  isSpinning: boolean;
  stopDelay: number;
  hasStarted: boolean;
  onStop?: () => void;
}) => {
  const controls = useAnimation();
  const [strip, setStrip] = useState<string[]>(["?"]);

  useEffect(() => {
    if (!hasStarted) {
      setStrip(["?"]);
      controls.set({ y: "0%" });
      return;
    }

    if (isSpinning) {
      const newStrip = Array.from(
        { length: 200 },
        () => ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)],
      );
      setStrip(newStrip);
      const startY = `-${((newStrip.length - 1) / newStrip.length) * 100}%`;
      controls.start({
        y: [startY, "0%"],
        transition: { ease: "linear", duration: 10 },
      });
    }
  }, [hasStarted, isSpinning, controls]);

  useEffect(() => {
    if (hasStarted && !isSpinning && targetChar !== "?") {
      const timeout = setTimeout(() => {
        controls.stop();
        onStop?.();

        const extraItems = 15;
        const finishStrip = Array.from(
          { length: extraItems },
          () => ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)],
        );
        finishStrip.unshift(targetChar);
        setStrip(finishStrip);

        const startY = `-${((finishStrip.length - 1) / finishStrip.length) * 100}%`;
        controls.set({ y: startY });

        requestAnimationFrame(() => {
          controls.start({
            y: "0%",
            transition: { type: "spring", damping: 15, stiffness: 70, mass: 1 },
          });
        });
      }, stopDelay);

      return () => clearTimeout(timeout);
    }
  }, [hasStarted, isSpinning, targetChar, stopDelay, controls, onStop]);

  return (
    <div className="flex-shrink-0 w-8 h-14 sm:w-12 sm:h-20 md:w-14 md:h-22 lg:w-[64px] lg:h-[100px] xl:w-[70px] xl:h-[108px] bg-gradient-to-b from-[#FAF8F2] via-[#F4EFE5] to-[#E5DEC9] rounded-xl sm:rounded-2xl flex flex-col items-center justify-start shadow-[0_12px_24px_rgba(0,0,0,0.7),0_0_15px_rgba(192,154,91,0.2)] border-2 border-[#D4AF37]/50 border-b-4 border-b-[#96783C] mx-[2px] sm:mx-[2.5px] md:mx-[3.5px] xl:mx-[4px] overflow-hidden relative select-none">
      {/* 3D Cylindrical Tumbler Curvature Shadows (Top and Bottom Inset Vignettes) */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-xl sm:rounded-2xl shadow-[inset_0_14px_16px_rgba(0,0,0,0.7),inset_0_-14px_16px_rgba(0,0,0,0.7)]" />

      {/* Horizontal Center Reading Line / Reflection Beam */}
      <div className="pointer-events-none absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 bg-white/40 z-20" />

      {/* Side Chamfer Shadows */}
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl sm:rounded-2xl shadow-[inset_3px_0_6px_rgba(0,0,0,0.12),inset_-3px_0_6px_rgba(0,0,0,0.12)]" />

      <motion.div className="w-full flex flex-col" animate={controls}>
        {strip.map((char, i) => (
          <div
            key={i}
            className="flex-none h-14 sm:h-20 md:h-22 lg:h-[100px] xl:h-[108px] flex items-center justify-center w-full"
          >
            <span className="text-2xl sm:text-4xl md:text-[44px] lg:text-[50px] xl:text-[54px] font-black text-[#151A13] font-sans tracking-tight drop-shadow-sm">
              {char}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const ParticipantDetailDialogContent = ({
  winner,
}: {
  winner: ParticipantWinner;
}) => {
  return (
    <DialogContent className="sm:max-w-md bg-[#232A20] border-primary/20 text-[#F8F5EF]">
      <DialogHeader>
        <DialogTitle className="font-heading text-2xl text-primary flex items-center gap-2 border-b border-white/10 pb-4">
          <MedalIcon weight="fill" className="w-8 h-8 text-secondary" />
          Detail Pemenang
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center py-2 space-y-6">
        {winner.photo_path ? (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl bg-black/40">
            <img
              src={winner.photo_path}
              alt={winner.full_name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-black/40 flex items-center justify-center border-4 border-white/10 shadow-xl">
            <UserIcon weight="fill" className="w-16 h-16 text-white/40" />
          </div>
        )}
        <div className="w-full space-y-5">
          <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-center">
            <p className="text-xs uppercase font-bold text-primary mb-1 tracking-widest">
              Kode Kupon
            </p>
            <p className="text-2xl font-black font-sans tracking-widest text-[#F8F5EF]">
              {winner.coupon_code}
            </p>
          </div>
          <div className="space-y-4 px-2">
            <div className="flex items-start gap-4">
              <IdentificationCardIcon
                weight="duotone"
                className="w-6 h-6 text-primary mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                  Nama & Tgl Lahir
                </p>
                <p className="font-bold text-[#F8F5EF] text-lg leading-tight">
                  {winner.full_name}
                </p>
                <p className="text-sm font-mono text-white/60 mt-0.5">
                  {winner.date_of_birth}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPinIcon
                weight="duotone"
                className="w-6 h-6 text-primary mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                  Alamat
                </p>
                <p className="font-medium text-[#F8F5EF] leading-snug">
                  {winner.alamat}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <PhoneIcon
                weight="duotone"
                className="w-6 h-6 text-primary mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                  Telepon
                </p>
                <p className="font-medium text-[#F8F5EF]">
                  {winner.phone_number}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

const WinnerHistoryDrawer = ({
  activeMode = "participant",
}: {
  activeMode?: DrawMode;
}) => {
  const [tab, setTab] = useState<DrawMode>(activeMode || "participant");

  useEffect(() => {
    setTab(activeMode);
  }, [activeMode]);

  const { data: participants, isLoading: isLoadingParticipants } = useQuery<
    ParticipantWinner[]
  >({
    queryKey: ["winners", "participants"],
    queryFn: async () => {
      const response = await axios.get<ParticipantWinner[]>(
        "/api/participants?winners_only=true",
      );
      return response.data;
    },
  });

  const { data: pekons, isLoading: isLoadingPekons } = useQuery<PekonWinner[]>({
    queryKey: ["winners", "pekon"],
    queryFn: async () => {
      const response = await axios.get<PekonWinner[]>(
        "/api/pekon?winners_only=true",
      );
      return response.data;
    },
  });

  const isLoading =
    tab === "participant" ? isLoadingParticipants : isLoadingPekons;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="fixed bottom-6 right-6 z-50 bg-[#1C2219]/80 border-primary/40 text-primary hover:bg-primary/20 backdrop-blur-md rounded-full h-12 px-6 shadow-xl font-bold tracking-wide"
          />
        }
      >
        <ListIcon className="w-5 h-5 mr-2" weight="bold" />
        Riwayat
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] border-l border-primary/20 bg-[#1C2219]/95 text-[#F8F5EF] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b border-primary/20 bg-black/20 text-left">
          <SheetTitle className="text-xl font-heading font-bold text-primary flex items-center gap-3">
            <TrophyIcon weight="fill" className="w-6 h-6 text-primary" />
            Daftar Pemenang
          </SheetTitle>
          <div className="flex bg-black/40 p-1 rounded-xl border border-primary/20 mt-3 gap-1">
            <button
              onClick={() => setTab("participant")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "participant"
                  ? "bg-primary text-black shadow-md"
                  : "text-primary/70 hover:text-primary hover:bg-white/5",
              )}
            >
              <UserIcon weight="bold" className="w-4 h-4" />
              Peserta ({participants?.length || 0})
            </button>
            <button
              onClick={() => setTab("pekon")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "pekon"
                  ? "bg-primary text-black shadow-md"
                  : "text-primary/70 hover:text-primary hover:bg-white/5",
              )}
            >
              <BuildingsIcon weight="bold" className="w-4 h-4" />
              Pekon ({pekons?.length || 0})
            </button>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4 py-4">
          {isLoading ? (
            <p className="text-center text-primary/60 py-4 font-medium">
              Memuat data...
            </p>
          ) : tab === "participant" ? (
            participants?.length === 0 ? (
              <p className="text-center text-primary/60 py-8 font-medium">
                Belum ada pemenang.
              </p>
            ) : (
              <div className="flex flex-col space-y-3 pb-8">
                {participants?.map((winner, index) => (
                  <Dialog key={winner.id}>
                    <DialogTrigger
                      render={
                        <button className="w-full text-left bg-black/20 hover:bg-primary/20 border border-primary/20 hover:border-primary/50 transition-all rounded-xl p-4 shadow-sm flex items-center gap-4">
                          {winner.photo_path ? (
                            <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-primary/30 bg-black/40">
                              <img
                                src={winner.photo_path}
                                alt={winner.full_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 shrink-0 rounded-full border-2 border-primary/30 bg-black/40 flex items-center justify-center">
                              <UserIcon
                                weight="fill"
                                className="w-6 h-6 text-white/40"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-xs text-primary/70 font-bold tracking-wider">
                                #{index + 1}
                              </div>
                              <div className="text-xs font-mono text-primary/70 font-semibold tracking-wider">
                                {winner.coupon_code}
                              </div>
                            </div>
                            <div className="text-primary font-bold text-lg truncate transition-colors drop-shadow-sm">
                              {winner.full_name}
                            </div>
                          </div>
                        </button>
                      }
                    />
                    <ParticipantDetailDialogContent winner={winner} />
                  </Dialog>
                ))}
              </div>
            )
          ) : pekons?.length === 0 ? (
            <p className="text-center text-primary/60 py-8 font-medium">
              Belum ada pemenang.
            </p>
          ) : (
            <div className="flex flex-col space-y-3 pb-8">
              {pekons?.map((winner, index) => (
                <Dialog key={winner.id}>
                  <DialogTrigger
                    render={
                      <button className="w-full text-left bg-black/20 hover:bg-primary/20 border border-primary/20 hover:border-primary/50 transition-all rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-full border-2 border-primary/30 bg-black/40 flex items-center justify-center">
                          <BuildingsIcon
                            weight="duotone"
                            className="w-6 h-6 text-primary"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-xs text-primary/70 font-bold tracking-wider">
                              #{index + 1}
                            </div>
                            <div className="text-xs font-mono text-primary/70 font-semibold tracking-wider">
                              {winner.coupon_code}
                            </div>
                          </div>
                          <div className="text-primary font-bold text-lg truncate transition-colors drop-shadow-sm">
                            Pekon {winner.name}
                          </div>
                          <div className="text-xs text-white/60 truncate mt-0.5">
                            Kec. {winner.kecamatan}
                          </div>
                        </div>
                      </button>
                    }
                  />
                  <DialogContent className="sm:max-w-md bg-[#232A20] border-primary/20 text-[#F8F5EF]">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-2xl text-primary flex items-center gap-2 border-b border-white/10 pb-4">
                        <MedalIcon
                          weight="fill"
                          className="w-8 h-8 text-secondary"
                        />
                        Detail Pekon Pemenang
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-2 space-y-6">
                      <div className="w-24 h-24 rounded-full bg-black/40 flex items-center justify-center border-4 border-primary/20 shadow-xl">
                        <BuildingsIcon
                          weight="duotone"
                          className="w-12 h-12 text-primary"
                        />
                      </div>
                      <div className="w-full space-y-5">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-center">
                          <p className="text-xs uppercase font-bold text-primary mb-1 tracking-widest">
                            Kode Kupon
                          </p>
                          <p className="text-2xl font-black font-sans tracking-widest text-[#F8F5EF]">
                            {winner.coupon_code}
                          </p>
                        </div>
                        <div className="space-y-4 px-2">
                          <div className="flex items-start gap-4">
                            <BuildingsIcon
                              weight="duotone"
                              className="w-6 h-6 text-primary mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                                Nama Pekon
                              </p>
                              <p className="font-bold text-[#F8F5EF] text-lg leading-tight">
                                Pekon {winner.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <MapPinIcon
                              weight="duotone"
                              className="w-6 h-6 text-primary mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
                                Kecamatan
                              </p>
                              <p className="font-medium text-[#F8F5EF] leading-snug">
                                Kecamatan {winner.kecamatan}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default function Draw() {
  const queryClient = useQueryClient();
  const {
    isMuted,
    toggleMute,
    playSpin,
    stopSpin,
    playCelebration,
    playTick,
    stopAll,
  } = useDrawSound();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("draw_auth") === "true",
  );
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const [drawMode, setDrawMode] = useState<DrawMode>("participant");
  const [pekonWinnerData, setPekonWinnerData] = useState<PekonWinner | null>(
    null,
  );
  const [participantWinnerData, setParticipantWinnerData] =
    useState<ParticipantWinner | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [winnerCode, setWinnerCode] = useState<string>("???????????");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && !!document.fullscreenElement,
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
    }
  };

  // Live telemetry: total registered participants count
  const { data: countData } = useQuery<{ total: number }>({
    queryKey: ["participants", "count"],
    queryFn: async () => {
      const response = await axios.get<{ total: number }>(
        "/api/participants/count",
      );
      return response.data;
    },
    refetchInterval: 10000,
    enabled: isAuthenticated,
  });

  const totalParticipants = countData?.total;

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 1000,
    });

    const duration = 8000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 1000,
    };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const participantMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post<ParticipantWinner>(
        "/api/participants/draw",
      );
      return response.data;
    },
    onSuccess: (data) => {
      let code = data.coupon_code || "UNKNOWN-00";
      if (code.length < 11) code = code.padEnd(11, "-");
      else if (code.length > 11) code = code.substring(0, 11);
      setWinnerCode(code);
      setIsSpinning(false);

      const spinDuration = code.length * 1000;
      // Smoothly fade out spinning sound before celebration fanfare starts
      setTimeout(
        () => {
          stopSpin(400);
        },
        Math.max(0, spinDuration - 300),
      );

      setTimeout(() => {
        setParticipantWinnerData(data);
        setWinnerName(data.full_name);
        setIsRevealed(true);
        queryClient.invalidateQueries({
          queryKey: ["winners", "participants"],
        });
        triggerConfetti();
        playCelebration();
      }, spinDuration + 500);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setIsSpinning(false);
      stopSpin(0);
      if (error.response?.status === 404) {
        setWinnerCode("--SELESAI--");
        setErrorMsg("Semua peserta sudah mendapatkan hadiah.");
      } else {
        setWinnerCode("---ERROR---");
        setErrorMsg(
          error.response?.data?.detail || "Terjadi kesalahan jaringan.",
        );
      }
    },
  });

  const pekonMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post<PekonWinner>("/api/pekon/draw");
      return response.data;
    },
    onSuccess: (data) => {
      let code = data.coupon_code || "PEKON-0000";
      if (code.length < 10) code = code.padEnd(10, "-");
      else if (code.length > 10) code = code.substring(0, 10);
      setWinnerCode(code);
      setIsSpinning(false);

      const spinDuration = code.length * 1000;
      // Smoothly fade out spinning sound before celebration fanfare starts
      setTimeout(
        () => {
          stopSpin(400);
        },
        Math.max(0, spinDuration - 300),
      );

      setTimeout(() => {
        setPekonWinnerData(data);
        setIsRevealed(true);
        queryClient.invalidateQueries({
          queryKey: ["winners", "pekon"],
        });
        triggerConfetti();
        playCelebration();
      }, spinDuration + 500);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setIsSpinning(false);
      stopSpin(0);
      if (error.response?.status === 404) {
        setWinnerCode("--SELESAI-");
        setErrorMsg("Semua pekon sudah mendapatkan hadiah.");
      } else {
        setWinnerCode("---ERROR--");
        setErrorMsg(
          error.response?.data?.detail || "Terjadi kesalahan jaringan.",
        );
      }
    },
  });

  const handleModeChange = (mode: DrawMode) => {
    if (isSpinning) return;
    stopAll();
    setDrawMode(mode);
    setHasStarted(false);
    setIsSpinning(false);
    setIsRevealed(false);
    setWinnerName(null);
    setPekonWinnerData(null);
    setParticipantWinnerData(null);
    setErrorMsg(null);
    setWinnerCode(mode === "participant" ? "???????????" : "??????????");
  };

  const handleDraw = () => {
    if (isSpinning) return;
    setHasStarted(true);
    setIsSpinning(true);
    setIsRevealed(false);
    setWinnerName(null);
    setPekonWinnerData(null);
    setParticipantWinnerData(null);
    setErrorMsg(null);
    setWinnerCode(drawMode === "participant" ? "???????????" : "??????????");

    playSpin();

    if (drawMode === "participant") {
      participantMutation.mutate();
    } else {
      pekonMutation.mutate();
    }
  };

  const handleLogin = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (passcode === "Lambar35") {
      setIsAuthenticated(true);
      sessionStorage.setItem("draw_auth", "true");
    } else {
      setPasscodeError("Passcode salah!");
    }
  };

  const pageBgClass =
    "bg-[#0C100B] bg-[radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(52,70,44,0.45),rgba(12,16,11,1))]";

  if (!isAuthenticated) {
    return (
      <>
        <title>Akses Terkunci | HUT Lampung Barat ke-35</title>
        <div
          className={cn(
            "flex flex-col h-screen text-[#F8F5EF] overflow-hidden relative font-sans items-center justify-center",
            pageBgClass,
          )}
        >
          <TapisCorner className="top-4 left-4" />
          <TapisCorner className="top-4 right-4 rotate-90" />
          <TapisCorner className="bottom-4 left-4 -rotate-90" />
          <TapisCorner className="bottom-4 right-4 rotate-180" />

          <div className="z-10 bg-black/40 p-8 rounded-3xl backdrop-blur-xl border border-[#C09A5B]/30 shadow-2xl max-w-sm w-full mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70"></div>

            <div className="flex flex-col items-center mb-6">
              <LockKeyIcon
                weight="duotone"
                className="w-16 h-16 text-primary mb-4 drop-shadow-[0_0_15px_rgba(192,154,91,0.5)]"
              />
              <h2 className="text-2xl font-heading text-primary font-bold uppercase tracking-widest text-center">
                Akses Terkunci
              </h2>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError("");
                  }}
                  placeholder="Passcode"
                  className="w-full bg-black/50 border border-primary/30 rounded-xl px-4 py-3 text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center tracking-widest font-mono text-lg transition-all"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-destructive text-sm mt-2 text-center font-medium">
                    {passcodeError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black font-bold tracking-widest uppercase hover:from-[#E5C158] hover:to-[#C09A5B] border border-[#F2D06B] shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-all active:scale-95 rounded-lg cursor-pointer"
              >
                Masuk
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Undian Doorprize | HUT Lampung Barat ke-35</title>
      <div
        className={`flex flex-col h-screen ${pageBgClass} text-[#F8F5EF] overflow-hidden relative font-sans`}
      >
        {/* Ambient Stage Top Spotlight Cone */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[#D4AF37]/12 via-[#D4AF37]/3 to-transparent blur-3xl z-10" />

        {/* Ambient Floor Glow for Vertical Balance */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-gradient-to-t from-[#D4AF37]/8 via-[#D4AF37]/2 to-transparent blur-3xl z-10" />

        {/* Tapis Cultural Corner Filigrees */}
        <TapisCorner className="top-4 left-4" />
        <TapisCorner className="top-4 right-4 rotate-90" />
        <TapisCorner className="bottom-4 left-4 -rotate-90" />
        <TapisCorner className="bottom-4 right-4 rotate-180" />

        <WinnerHistoryDrawer activeMode={drawMode} />

        {/* Top Header Toolbar - Proper Flex Flow (Never Collides) */}
        <header className="shrink-0 w-full pt-4 pb-1 px-6 lg:px-12 flex justify-between items-center z-30 relative">
          <div className="flex items-center gap-3">
            <img
              src="/logo_hut_lambar-35.png"
              alt="HUT 35"
              className="h-8 md:h-10 w-auto drop-shadow-md"
            />
            <div className="text-sm md:text-base font-bold tracking-[0.15em] text-[#C09A5B] font-heading uppercase">
              HUT Lampung Barat-35
            </div>
          </div>

          {/* Mode Switcher, Telemetry & Sound Toggle */}
          <div className="flex items-center gap-3">
            {/* Live Participant Telemetry Pill */}
            <div
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-black/40 border border-[#D4AF37]/35 backdrop-blur-md shadow-xl text-[#F8F5EF] select-none"
              title="Total peserta terdaftar saat ini (sinkronisasi live)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              <UsersIcon weight="duotone" className="w-4 h-4 text-[#D4AF37]" />
              <div className="flex items-baseline gap-1.5">
                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.15em] text-[#C09A5B]/85 font-heading font-semibold">
                  Total Peserta:
                </span>
                <span className="text-xs sm:text-sm font-black font-sans text-white tabular-nums tracking-wide">
                  {totalParticipants !== undefined
                    ? totalParticipants.toLocaleString("id-ID")
                    : "..."}
                </span>
              </div>
            </div>

            <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-primary/30 shadow-xl gap-1.5">
              <button
                disabled={isSpinning}
                onClick={() => handleModeChange("participant")}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs md:text-sm font-heading font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                  drawMode === "participant"
                    ? "bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black shadow-lg"
                    : "text-[#C09A5B] hover:bg-white/5",
                )}
              >
                <UserIcon weight="bold" className="w-4 h-4" />
                Undian Peserta
              </button>
              <button
                disabled={isSpinning}
                onClick={() => handleModeChange("pekon")}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs md:text-sm font-heading font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                  drawMode === "pekon"
                    ? "bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black shadow-lg"
                    : "text-[#C09A5B] hover:bg-white/5",
                )}
              >
                <BuildingsIcon weight="bold" className="w-4 h-4" />
                Undian Pekon
              </button>
            </div>

            {/* Audio Mute/Unmute Control */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Aktifkan Suara" : "Bisukan Suara"}
              aria-label={isMuted ? "Aktifkan Suara" : "Bisukan Suara"}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-2xl border transition-all backdrop-blur-md shadow-xl cursor-pointer",
                isMuted
                  ? "bg-black/40 border-red-500/40 text-red-400 hover:bg-red-500/10"
                  : "bg-black/40 border-[#C09A5B]/40 text-[#C09A5B] hover:bg-white/5 hover:border-[#C09A5B]/70",
              )}
            >
              {isMuted ? (
                <SpeakerSlashIcon weight="bold" className="w-5 h-5" />
              ) : (
                <SpeakerHighIcon weight="bold" className="w-5 h-5" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-2xl border transition-all backdrop-blur-md shadow-xl cursor-pointer",
                isFullscreen
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F2D06B] hover:bg-[#D4AF37]/30"
                  : "bg-black/40 border-[#C09A5B]/40 text-[#C09A5B] hover:bg-white/5 hover:border-[#C09A5B]/70",
              )}
            >
              {isFullscreen ? (
                <ArrowsInIcon weight="bold" className="w-5 h-5" />
              ) : (
                <ArrowsOutIcon weight="bold" className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Main Stage Content - Centered in remaining space without any clipping */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center relative z-20 w-full px-4 pb-4">
          {/* Title Area */}
          <div className="mb-4 sm:mb-6 text-center flex flex-col items-center shrink-0">
            <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-heading text-[#C09A5B] font-normal tracking-[0.15em] mb-2 drop-shadow-lg">
              {drawMode === "participant"
                ? "PENGUNDIAN DOORPRIZE PESERTA"
                : "PENGUNDIAN DOORPRIZE PEKON"}
            </h1>
            <div className="flex items-center gap-3 opacity-80">
              <div className="w-14 md:w-24 h-[1px] bg-gradient-to-r from-transparent to-[#C09A5B]"></div>
              <div className="w-2 h-2 rotate-45 bg-[#C09A5B]"></div>
              <div className="w-14 md:w-24 h-[1px] bg-gradient-to-l from-transparent to-[#C09A5B]"></div>
            </div>
          </div>

          {/* Tumbler Reels Row */}
          <div className="flex flex-row justify-center items-center flex-nowrap mb-5 sm:mb-7 w-full max-w-full px-2 shrink-0">
            {winnerCode.split("").map((char, index) => (
              <RollingChar
                key={index}
                targetChar={char}
                isSpinning={isSpinning}
                hasStarted={hasStarted}
                stopDelay={index * 1000}
                onStop={playTick}
              />
            ))}
          </div>

          {/* Dynamic Stage Status Pill */}
          <div className="mb-5 sm:mb-6 flex items-center justify-center shrink-0">
            {isSpinning ? (
              <div className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.25)] text-[#F2D06B] text-xs md:text-sm font-heading font-bold tracking-[0.2em] uppercase animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                Mengacak Nomor Pemenang...
              </div>
            ) : isRevealed ? (
              <div className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)] text-emerald-300 text-xs md:text-sm font-heading font-bold tracking-[0.2em] uppercase">
                <TrophyIcon weight="fill" className="w-4 h-4 text-emerald-400" />
                Pemenang Sah Terpilih
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-black/40 border border-[#C09A5B]/30 backdrop-blur-md text-[#C09A5B]/90 text-xs md:text-sm font-heading tracking-[0.2em] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#C09A5B]/70" />
                {drawMode === "participant"
                  ? "Sistem Siap Mengundi Peserta"
                  : "Sistem Siap Mengundi Pekon"}
              </div>
            )}
          </div>

          {/* Winner Announcement or Action Button Area */}
          <div className="flex flex-col items-center justify-center w-full relative gap-4 shrink-0">
            {isRevealed &&
              (drawMode === "participant"
                ? participantWinnerData || winnerName
                : pekonWinnerData) && (
                <div
                  className={`transition-all duration-1000 ease-out transform ${
                    isRevealed
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-8 scale-95"
                  } relative max-w-xl w-full mx-4 rounded-3xl p-[1.5px] bg-gradient-to-b from-[#F2D06B]/80 via-[#D4AF37]/50 to-[#96783C]/70 shadow-[0_0_60px_rgba(212,175,55,0.25),0_20px_40px_rgba(0,0,0,0.85)]`}
                >
                  <div className="bg-gradient-to-b from-[#161E13]/95 via-[#10150E]/95 to-[#0A0E09]/98 backdrop-blur-2xl rounded-[22px] px-8 sm:px-14 py-5 sm:py-6 text-center relative overflow-hidden">
                    {/* Subtle top golden light flare inside card */}
                    <div className="pointer-events-none absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#F2D06B] to-transparent" />

                    {drawMode === "participant" ? (
                      <>
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F2D06B] uppercase tracking-[0.25em] text-xs font-bold font-heading mb-2 shadow-inner">
                          <MedalIcon
                            weight="fill"
                            className="w-4 h-4 text-[#D4AF37]"
                          />
                          Selamat Kepada Pemenang
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-wide drop-shadow-[0_2px_18px_rgba(212,175,55,0.45)] my-1 leading-tight">
                          {participantWinnerData?.full_name || winnerName}
                        </h2>
                        {participantWinnerData && (
                          <div className="mt-3.5 flex justify-center">
                            <Dialog>
                              <DialogTrigger
                                render={
                                  <Button
                                    variant="outline"
                                    className="bg-gradient-to-r from-[#D4AF37]/25 via-[#D4AF37]/35 to-[#D4AF37]/25 hover:from-[#D4AF37]/45 hover:to-[#D4AF37]/45 border border-[#D4AF37]/70 text-[#F8F5EF] rounded-xl px-5 py-2 h-auto text-xs md:text-sm font-heading font-bold tracking-wider transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                  >
                                    <IdentificationCardIcon
                                      weight="duotone"
                                      className="w-4 h-4 text-[#F2D06B]"
                                    />
                                    Lihat Data Lengkap
                                  </Button>
                                }
                              />
                              <ParticipantDetailDialogContent
                                winner={participantWinnerData}
                              />
                            </Dialog>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F2D06B] uppercase tracking-[0.25em] text-xs font-bold font-heading mb-2 shadow-inner">
                          <MedalIcon
                            weight="fill"
                            className="w-4 h-4 text-[#D4AF37]"
                          />
                          Selamat Kepada Pemenang
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-wide drop-shadow-[0_2px_18px_rgba(212,175,55,0.45)] my-1 leading-tight">
                          Pekon {pekonWinnerData?.name}
                        </h2>
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-semibold text-xs md:text-sm shadow-sm">
                          <MapPinIcon
                            weight="duotone"
                            className="w-4 h-4 text-primary inline mr-1"
                          />
                          Kecamatan {pekonWinnerData?.kecamatan}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            {errorMsg && !isSpinning && (
              <div className="text-red-400 text-lg md:text-xl font-medium bg-red-950/40 backdrop-blur-md px-8 py-4 rounded-xl border border-red-500/30">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-6 mt-3 sm:mt-5">
              <Button
                size="lg"
                onClick={handleDraw}
                disabled={isSpinning}
                className="text-base md:text-lg h-13 md:h-14 px-10 md:px-14 rounded-2xl bg-gradient-to-b from-[#D4AF37] via-[#C09A5B] to-[#96783C] text-black font-heading font-black tracking-[0.18em] uppercase border-2 border-[#F2D06B] shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_25px_rgba(212,175,55,0.35)] hover:from-[#E5C158] hover:via-[#D4AF37] hover:to-[#A38242] hover:shadow-[0_10px_35px_rgba(212,175,55,0.55)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 cursor-pointer"
              >
                {!isSpinning && (
                  <GiftIcon
                    weight="fill"
                    className="w-5 h-5 mb-0.5 text-black"
                  />
                )}
                {isSpinning
                  ? "MENGUNDI..."
                  : hasStarted
                    ? "UNDI LAGI"
                    : "MULAI UNDI"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
