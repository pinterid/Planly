import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock, Mail, Map, Palmtree, Users } from "lucide-react";
import barcelonaImg from "@/assets/trip-barcelona.jpg";

interface LoginScreenProps {
  onLogIn: (name?: string) => void;
}

const valuePoints = [
  { icon: Users, label: "Connect", text: "Find people with a similar travel rhythm." },
  { icon: CheckCircle2, label: "Vote", text: "Let every group member choose clearly." },
  { icon: Map, label: "Plan", text: "Turn preferences into one suggested plan." },
];

const LoginScreen = ({ onLogIn }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nameFromEmail = email.includes("@") ? email.split("@")[0].replace(/[._-]/g, " ") : "";

  return (
    <div className="min-h-screen w-full max-w-[430px] mx-auto relative overflow-hidden bg-background shadow-vacation md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[2rem]">
      <div className="absolute inset-0 start-screen-surface" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 px-5 pt-5 pb-4 min-h-screen flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[1.15rem] bg-navy text-white flex items-center justify-center shadow-card">
              <Palmtree size={19} />
            </div>
            <span className="font-heading text-xl font-extrabold tracking-tight">Planly</span>
          </div>
          <button
            onClick={() => onLogIn()}
            className="text-xs font-bold text-foreground px-3.5 py-2 rounded-full bg-white border border-border shadow-card"
          >
            Demo
          </button>
        </div>

        <div className="relative mb-6">
          <div className="relative overflow-hidden rounded-[2rem] h-[14rem] shadow-vacation">
            <img src={barcelonaImg} alt="Barcelona coast" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 via-foreground/5 to-foreground/70" />
            <div className="absolute left-4 right-4 bottom-4 rounded-[1.35rem] bg-white/90 backdrop-blur-xl p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">Group decision</p>
                  <h2 className="font-heading text-lg font-extrabold mt-1">Barcelona fits 92%</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal text-white flex items-center justify-center font-heading font-extrabold">
                  92
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Budget", "Dates", "Vibe"].map((item) => (
                  <div key={item} className="rounded-xl bg-secondary px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground">{item}</p>
                    <p className="text-xs font-bold text-foreground">Aligned</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="font-heading text-[2rem] font-extrabold leading-[1.02] tracking-tight">
            Plan trips together, without the chaos.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-6">
            Planly helps groups compare preferences, vote on destinations, and agree on one trip.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {valuePoints.map((point) => (
            <div key={point.label} className="rounded-2xl bg-white/80 border border-white/70 p-3 shadow-card">
              <point.icon size={16} className="text-teal mb-2" />
              <p className="font-heading text-xs font-extrabold">{point.label}</p>
              <p className="text-[10px] leading-4 text-muted-foreground mt-1">{point.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <label className="login-field">
            <Mail size={18} className="text-teal" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-muted-foreground"
            />
          </label>
          <label className="login-field">
            <Lock size={18} className="text-teal" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <button
          onClick={() => onLogIn(nameFromEmail)}
          className="w-full mt-4 py-4 rounded-2xl gradient-coral text-primary-foreground font-heading font-extrabold flex items-center justify-center gap-2 shadow-vacation"
        >
          Log in <ArrowRight size={18} />
        </button>

        <button
          onClick={() => onLogIn(nameFromEmail)}
          className="mt-4 text-sm font-semibold text-muted-foreground"
        >
          New here? Create an account
        </button>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
