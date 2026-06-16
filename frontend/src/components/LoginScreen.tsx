import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Palmtree, UsersRound, Scale, CheckCircle2 } from "lucide-react";
import lisbonImg from "@/assets/trip-lisbon.jpg";

interface LoginScreenProps {
  onLogIn: (name?: string) => void;
}

const valuePoints = [
  { label: "Match", icon: UsersRound },
  { label: "Compare", icon: Scale },
  { label: "Decide", icon: CheckCircle2 },
];

const LoginScreen = ({ onLogIn }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nameFromEmail = email.includes("@") ? email.split("@")[0].replace(/[._-]/g, " ") : "";

  return (
    <div className="min-h-screen w-full bg-background md:flex md:items-center md:justify-center md:px-4">
      <div className="relative mx-auto h-[100svh] w-full max-w-[430px] overflow-hidden bg-background shadow-vacation md:h-[calc(100vh-3rem)] md:rounded-[2rem]">
        <div className="absolute inset-0 start-screen-surface" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 flex h-full flex-col overflow-y-auto overscroll-contain px-5 pt-5 pb-8"
        >
        <div className="flex items-center justify-between mt-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[1.15rem] bg-white text-primary flex items-center justify-center shadow-card border border-border">
              <Palmtree size={18} />
            </div>
            <span className="font-heading text-xl font-extrabold tracking-tight">Planly</span>
          </div>
          {/* <button
            onClick={() => onLogIn()}
            className="text-xs font-bold text-foreground px-3.5 py-2 rounded-full bg-white border border-border shadow-card"
          >
            Demo
          </button> */}
        </div>

        <div className="relative mb-6">
          <div className="relative overflow-hidden rounded-[2rem] h-[14rem] shadow-vacation">
            <img src={lisbonImg} alt="Sunlit Lisbon street" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-foreground/20" />
          </div>
        </div>

        <div className="mb-7">
          {/* <div className="mb-3 inline-flex items-center rounded-full bg-white/85 border border-border px-3 py-1.5 text-[11px] font-bold text-primary shadow-card">
            Travel better together
          </div> */}
          <h1 className="font-heading text-[2.2rem] font-extrabold leading-[1.04] tracking-tight text-foreground">
            Plan less,
            <br />
            <span className="text-primary">travel more.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-6 max-w-[20rem]">
            Find new Buddies, plan trips together and travel with confidence.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-7">
          {valuePoints.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl bg-white border border-primary/15 px-3 py-2.5 shadow-card flex flex-col items-center justify-center text-center"           >
              <div className="w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center mb-1.5 shadow-sm">
                <Icon size={15} strokeWidth={2.4} />
              </div>
              <p className="text-xs font-extrabold text-foreground leading-none">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-5 mb-5">
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
          className="w-full mt-2 py-4 rounded-2xl bg-navy text-primary-foreground font-heading font-extrabold flex items-center justify-center shadow-vacation"
        >
          Log in
        </button>

        <button
          onClick={() => onLogIn(nameFromEmail)}
          className="mt-5 text-sm font-semibold text-muted-foreground"
        >
          New here? Create an account
        </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginScreen;
