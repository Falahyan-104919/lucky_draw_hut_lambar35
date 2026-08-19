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
  InfoIcon,
} from "@phosphor-icons/react";

import { motion, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

const RollingChar = ({
  targetChar,
  isSpinning,
  stopDelay,
  hasStarted,
}: {
  targetChar: string;
  isSpinning: boolean;
  stopDelay: number;
  hasStarted: boolean;
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
  }, [hasStarted, isSpinning, targetChar, stopDelay, controls]);

  return (
    <div className="w-10 h-16 sm:w-16 sm:h-24 md:w-[68px] md:h-[104px] bg-[#F8F5EF] rounded-xl flex flex-col items-center justify-start shadow-[0_8px_16px_rgba(0,0,0,0.5)] border-b-[4px] border-[#D8D2C2] mx-[4px] overflow-hidden relative">
      <motion.div className="w-full flex flex-col" animate={controls}>
        {strip.map((char, i) => (
          <div
            key={i}
            className="flex-none h-16 sm:h-24 md:h-[104px] flex items-center justify-center w-full"
          >
            <span className="text-3xl sm:text-5xl md:text-[52px] font-bold text-[#1C2219] font-sans drop-shadow-sm">
              {char}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const WinnerHistoryDrawer = () => {
  const { data: winners, isLoading } = useQuery({
    queryKey: ["winners"],
    queryFn: async () => {
      const response = await axios.get("/api/participants?winners_only=true");
      return response.data;
    },
  });

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
        </SheetHeader>
        <ScrollArea className="flex-1 px-4 py-4">
          {isLoading ? (
            <p className="text-center text-primary/60 py-4 font-medium">
              Memuat data...
            </p>
          ) : winners?.length === 0 ? (
            <p className="text-center text-primary/60 py-8 font-medium">
              Belum ada pemenang.
            </p>
          ) : (
            <div className="flex flex-col space-y-3 pb-8">
              {winners?.map((winner: any, index: number) => (
                <Dialog key={winner.id}>
                  <DialogTrigger render={
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
                  } />
                  <DialogContent className="sm:max-w-md bg-[#232A20] border-primary/20 text-[#F8F5EF]">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-2xl text-primary flex items-center gap-2 border-b border-white/10 pb-4">
                        <MedalIcon
                          weight="fill"
                          className="w-8 h-8 text-secondary"
                        />
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
                          <UserIcon
                            weight="fill"
                            className="w-16 h-16 text-white/40"
                          />
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
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("draw_auth") === "true",
  );
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [winnerCode, setWinnerCode] = useState<string>("???????????");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/participants/draw");
      return response.data;
    },
    onSuccess: (data) => {
      let code = data.coupon_code || "UNKNOWN-00";
      if (code.length < 11) code = code.padEnd(11, "-");
      else if (code.length > 11) code = code.substring(0, 11);
      setWinnerCode(code);
      setIsSpinning(false);

      setTimeout(
        () => {
          setWinnerName(data.full_name);
          setIsRevealed(true);
          queryClient.invalidateQueries({ queryKey: ["winners"] });

          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            zIndex: 1000,
          });

          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 1000,
          };
          const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;

          const interval: any = setInterval(function () {
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
        },
        code.length * 1000 + 500,
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      setIsSpinning(false);
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

  const handleDraw = () => {
    if (isSpinning) return;
    setHasStarted(true);
    setIsSpinning(true);
    setIsRevealed(false);
    setWinnerName(null);
    setErrorMsg(null);
    setWinnerCode("???????????");
    mutation.mutate();
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

  const pageBgClass = "bg-[#1C2219]";

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          "flex flex-col h-screen text-[#F8F5EF] overflow-hidden relative font-sans items-center justify-center",
          pageBgClass,
        )}
      >
        <div className="z-10 bg-black/30 p-8 rounded-2xl backdrop-blur-md border border-primary/20 shadow-2xl max-w-sm w-full mx-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

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
              className="w-full h-12 bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black font-bold tracking-widest uppercase hover:from-[#E5C158] hover:to-[#C09A5B] border border-[#F2D06B] shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-all active:scale-95 rounded-lg"
            >
              Masuk
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-screen ${pageBgClass} text-[#F8F5EF] overflow-hidden relative font-sans`}
    >
      <WinnerHistoryDrawer />
      <img
        src="/bupati.png"
        alt="Bupati Lampung Barat"
        className="absolute -bottom-5 -left-10 lg:left-[2%] h-[75vh] lg:h-[85vh] object-contain object-bottom pointer-events-none z-20 drop-shadow-2xl"
      />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30 px-2 lg:px-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo_hut_lambar-35.png"
            alt="HUT 35"
            className="h-10 md:h-12 w-auto drop-shadow-md"
          />
          <div className="text-sm md:text-base font-bold tracking-[0.15em] text-[#C09A5B] font-heading uppercase">
            HUT Lampung Barat-35
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-20 w-full pl-0 lg:pl-[30%] pr-0 lg:pr-[5%]">
        <div className="mb-10 text-center flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl lg:text-[56px] font-heading text-[#C09A5B] font-normal tracking-[0.15em] mb-4 drop-shadow-lg">
            PENGUNDIAN DOORPRIZE
          </h1>
          <div className="flex items-center gap-3 opacity-80">
            <div className="w-16 md:w-32 h-[1px] bg-gradient-to-r from-transparent to-[#C09A5B]"></div>
            <div className="w-2 h-2 rotate-45 bg-[#C09A5B]"></div>
            <div className="w-16 md:w-32 h-[1px] bg-gradient-to-l from-transparent to-[#C09A5B]"></div>
          </div>
        </div>

        <div className="flex flex-row justify-center flex-wrap gap-y-3 mb-10 w-full max-w-[900px]">
          {winnerCode.split("").map((char, index) => (
            <RollingChar
              key={index}
              targetChar={char}
              isSpinning={isSpinning}
              hasStarted={hasStarted}
              stopDelay={index * 1000}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 text-white/70 mb-12 font-sans tracking-wide">
          <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center">
            <InfoIcon className="w-4 h-4" />
          </div>
          <p className="text-sm md:text-base font-light">
            Nomor undian akan diundi secara acak oleh sistem
          </p>
        </div>

        {/* Winner Announcement or Action Button Area */}
        <div className="flex flex-col items-center justify-center w-full relative gap-6">
          {isRevealed && winnerName && (
            <div
              className={`transition-all duration-1000 ease-out transform ${isRevealed ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"} text-center bg-black/40 backdrop-blur-md border border-[#C09A5B]/50 px-10 py-6 rounded-2xl shadow-[0_0_40px_rgba(192,154,91,0.2)]`}
            >
              <p className="text-[#C09A5B] uppercase tracking-[0.2em] text-xs md:text-sm mb-3 font-semibold">
                Selamat Kepada Pemenang
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white font-heading drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {winnerName}
              </h2>
            </div>
          )}

          {errorMsg && !isSpinning && (
            <div className="text-red-400 text-lg md:text-xl font-medium bg-red-950/40 backdrop-blur-md px-8 py-4 rounded-xl border border-red-500/30">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-6 mt-2">
            <Button
              size="lg"
              onClick={handleDraw}
              disabled={isSpinning}
              className="text-lg md:text-xl h-14 md:h-16 px-10 md:px-16 rounded-xl bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black font-heading font-bold tracking-[0.15em] uppercase border border-[#F2D06B] shadow-[0_8px_20px_rgba(0,0,0,0.5)] hover:from-[#E5C158] hover:to-[#C09A5B] hover:shadow-[0_8px_25px_rgba(192,154,91,0.4)] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex items-center gap-3"
            >
              {!isSpinning && (
                <GiftIcon weight="fill" className="w-6 h-6 mb-0.5" />
              )}
              {isSpinning
                ? "MENGUNDI..."
                : hasStarted
                  ? "UNDI LAGI"
                  : "MULAI UNDI"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
