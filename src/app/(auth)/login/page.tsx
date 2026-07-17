"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // Redirigir al dashboard tras un login exitoso
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Fondo de imagen con Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-red-force.png')" }}
      >
        <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 to-transparent mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-[380px] rounded-[2.5rem] border border-white/30 bg-white/10 backdrop-blur-2xl p-8 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="mb-10 mt-4 flex flex-col items-center">
          <img src="/logo-gym.png" alt="Logo Training Zone Gym" className="h-28 w-auto mb-8 animate-energetic" />
          <div className="w-full text-center">
            <p className="text-[15px] font-semibold text-white tracking-wide">
              Ecosistema Digital: Portal de Colaboradores
            </p>
            <p className="text-[12px] font-medium text-white/70 mt-1">
              Por favor, identifícate para acceder al panel
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded flex items-center justify-center bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Correo electrónico"
              required
              className="h-[52px] border border-white/50 bg-white/10 text-white placeholder-white/80 rounded-[1.25rem] px-5 pr-12 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 text-sm shadow-inner"
            />
            <User className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 h-[22px] w-[22px]" strokeWidth={1.5} />
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              className="h-[52px] border border-white/50 bg-white/10 text-white placeholder-white/80 rounded-[1.25rem] px-5 pr-12 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 text-sm shadow-inner"
            />
            <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 h-[22px] w-[22px]" strokeWidth={1.5} />
          </div>

          <div className="flex items-center px-1 mb-2 pt-1">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[4px] border-none bg-[#38B34A]/80 checked:bg-[#38B34A] focus:ring-0 focus:ring-offset-0 transition-all"
                  defaultChecked
                />
                <svg
                  className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <label
                htmlFor="remember"
                className="text-[13px] font-semibold tracking-wide text-white cursor-pointer"
              >
                Recuerdame
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-[52px] text-lg font-bold tracking-wide bg-gradient-to-r from-[#800000] to-[#e60000] text-white hover:opacity-90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg rounded-[1rem] border-0"
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Ingresar al Panel"}
            </Button>
            <div className="mt-5 text-center text-[13px] text-white font-medium">
              ¿No tienes cuenta? <a href="#" className="font-bold text-white hover:underline">Contactar soporte</a>
            </div>
          </div>
        </form>
      </div>
      <div className="relative z-10 mt-6 text-center mb-8">
        <p className="text-[12px] font-medium text-white/90">
          Aplicación creada por <span className="font-extrabold italic">iOS Gomez</span> © 2026
        </p>
      </div>
    </div>
  );
}
