import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CheckCircle, DownloadSimple, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["participant", id],
    queryFn: async () => {
      const response = await axios.get(`/api/participants/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <title>Memuat Tiket... | Lucky Draw HUT Lambar</title>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <title>Tiket Tidak Ditemukan | Lucky Draw HUT Lambar</title>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <h2 className="text-2xl font-bold text-destructive font-heading mb-2">
            Tiket Tidak Ditemukan
          </h2>
          <p className="text-muted-foreground mb-8">
            Data peserta tidak valid atau belum terdaftar.
          </p>
          <Button
            onClick={() => navigate("/register")}
            className="h-12 px-8 rounded-xl bg-primary text-primary-foreground text-base"
          >
            Kembali ke Registrasi
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <title>
        {data?.coupon_code
          ? `Tiket (${data.coupon_code}) | Kupon Undian HUT Lampung Barat ke-35`
          : "Tiket Doorprize | Kupon Undian HUT Lampung Barat ke-35"}
      </title>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[10%] -left-[20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-sm z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 ring-4 ring-primary/10">
              <CheckCircle weight="fill" className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading mb-2">
              Pendaftaran Berhasil!
            </h1>
            <p className="text-muted-foreground text-lg">
              Hai{" "}
              <span className="font-semibold text-foreground">
                {data.full_name}
              </span>
              ,<br />
              ini adalah tiket Doorprize Anda.
            </p>
          </div>

          {/* Premium Ticket UI */}
          <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary ring-4 ring-primary/10 flex flex-col w-full">
            {/* Top section */}
            <div className="bg-foreground text-background p-8 pt-10 pb-10 text-center relative overflow-hidden flex flex-col items-center">
              {/* Top decorative ribbon */}
              <div
                className="absolute top-0 left-0 right-0 h-3 z-20"
                style={{
                  backgroundImage: "url('/cilugam.png')",
                  backgroundRepeat: "repeat-x",
                  backgroundSize: "contain",
                }}
              ></div>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary to-transparent pointer-events-none"></div>

              <img
                src="/logo_hut_lambar-35.png"
                alt="HUT Lampung Barat Ke-35"
                className="w-28 h-28 object-contain mb-5 z-10 relative drop-shadow-xl"
              />

              <h2 className="font-semibold text-sm uppercase tracking-[0.2em] text-primary/80 z-10 relative">
                Doorprize Event
              </h2>
              <h3 className="font-bold text-2xl mt-2 font-heading text-primary z-10 relative drop-shadow-sm leading-tight">
                HUT Lampung Barat <br />
                Ke-35
              </h3>
            </div>

            {/* Divider with Cutouts & Cilugam Perforation */}
            <div className="relative h-0 w-full z-20">
              {/* Left Cutout */}
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full border-r-2 border-primary"></div>
              {/* Right Cutout */}
              <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full border-l-2 border-primary"></div>

              {/* Cilugam pattern as the ticket tear line */}
              <div
                className="absolute top-0 left-6 right-6 -translate-y-1/2 h-[10px] opacity-90"
                style={{
                  backgroundImage: "url('/cilugam.png')",
                  backgroundRepeat: "repeat-x",
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                }}
              ></div>
            </div>

            {/* Bottom section (Ticket Number) */}
            <div className="p-8 pt-10 pb-10 text-center bg-gradient-to-b from-card to-muted/50">
              <p className="text-sm font-bold text-primary/80 uppercase tracking-widest mb-3">
                Kode Tiket Anda
              </p>
              <div className="text-[2.75rem] leading-none font-black text-foreground tracking-tighter drop-shadow-sm font-sans mb-2">
                {data.coupon_code}
              </div>
              <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest font-semibold">
                Simpan kode ini baik-baik
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-base"
              onClick={() => window.print()}
            >
              <DownloadSimple weight="bold" className="w-5 h-5" />
              Simpan / Cetak Tiket
            </Button>
            <Button
              className="w-full h-14 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground font-semibold text-base transition-colors"
              onClick={() => navigate("/register")}
            >
              Daftar Peserta Lain
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
