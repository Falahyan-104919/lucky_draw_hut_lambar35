import { useState, useEffect } from "react";
import { RegisterForm } from "./components/forms";

export default function Register() {
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    const startTimeStr = import.meta.env.VITE_EVENT_START_TIME;
    if (!startTimeStr) {
      setIsEventStarted(true);
      return;
    }

    const checkTime = () => {
      const startTime = new Date(startTimeStr).getTime();
      const now = new Date().getTime();

      if (now >= startTime) {
        setIsEventStarted(true);
        setCountdownText("");
      } else {
        setIsEventStarted(false);
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdownText(`Buka dalam ${days}h ${hours}j ${minutes}m`);
        } else {
          const h = hours.toString().padStart(2, "0");
          const m = minutes.toString().padStart(2, "0");
          const s = seconds.toString().padStart(2, "0");
          setCountdownText(`Buka dalam ${h}:${m}:${s}`);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <title>Pendaftaran | Kupon Undian HUT Lampung Barat ke-35</title>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-xl z-10 relative mt-8 mb-16">
          <div className="text-center mb-10">
            <img
              src="/logo_hut_lambar-35.png"
              alt="HUT Lampung Barat 35"
              className="w-36 h-auto mx-auto mb-6 drop-shadow-sm"
            />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-heading">
              HUT Lampung Barat ke-35
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Daftar sekarang untuk mendapatkan{" "}
              <span className="font-semibold text-primary">
                Kupon Undian Digital
              </span>
            </p>
          </div>

          <RegisterForm
            isEventStarted={isEventStarted}
            countdownText={countdownText}
          />

          <p className="text-center text-sm font-medium text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Pemerintah Kabupaten Lampung Barat
          </p>
        </div>
      </div>
    </>
  );
}
