import { motion } from "framer-motion";
import { CheckSquare, Square, ChevronRight, Heart, Compass, MapPinned, Sparkles } from "lucide-react";
import { getGroups, getProfile } from "@/data/profileStore";
import lisbonImg from "@/assets/trip-lisbon.jpg";

interface HomeScreenProps {
  onOpenGroup: (id: string) => void;
  onGoTo: (tab: "buddies" | "groups") => void;
}

const HomeScreen = ({ onOpenGroup, onGoTo }: HomeScreenProps) => {
  const profile = getProfile();
  const groups = getGroups();

  const pendingGroups = groups.filter(
    (g) =>
      !g.decidedTrip &&
      g.trips.length > 0 &&
      g.trips.some((t) => t.votes.find((v) => v.memberId === "self")?.vote === null)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <div className="relative overflow-hidden rounded-[2rem] min-h-64 mb-6 shadow-vacation">
        <img src={lisbonImg} alt="Sunny Lisbon street" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 via-foreground/10 to-foreground/70" />
        <div className="relative z-10 min-h-64 p-5 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
              <MapPinned size={21} />
            </div>
            <div className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold border border-white/20">
              Next decision
            </div>
          </div>
          <div>
            <p className="text-sm text-white/80">Welcome back</p>
            <h1 className="font-heading text-3xl font-extrabold leading-tight">
              Hi {profile.name?.split(" ")[0] || "there"}, your group is close.
            </h1>
            <p className="mt-2 text-sm text-white/80 leading-5">
              Compare the best options and move from maybe to a shared plan.
            </p>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> To-Do
        </h2>
        {pendingGroups.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <CheckSquare size={20} className="text-teal" />
            <p className="text-sm text-muted-foreground">All caught up. No votes pending.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => onOpenGroup(g.id)}
                className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left"
              >
                <Square size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-heading font-semibold text-sm">Vote for next trip - {g.name}</p>
                  <p className="text-xs text-muted-foreground">Your opinion is missing.</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-3">Your groups</h2>
        <div className="space-y-2">
          {groups.map((g) => {
            const needsReply = g.trips.some(
              (t) => t.votes.find((v) => v.memberId === "self")?.vote === null
            );
            return (
              <button
                key={g.id}
                onClick={() => onOpenGroup(g.id)}
                className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-navy flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">
                  {g.members.length}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm">{g.name}</p>
                  {g.decidedTrip ? (
                    <p className="text-xs text-teal font-medium">Suggested Plan: {g.decidedTrip}</p>
                  ) : needsReply && g.trips.length > 0 ? (
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-coral-light">
                      <span className="text-[11px] font-medium text-coral">Your turn to reply</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {g.members.map((m) => m.memberName).join(", ")}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-2">
        <button
          onClick={() => onGoTo("buddies")}
          className="w-full py-3.5 rounded-2xl bg-navy text-primary-foreground font-heading font-bold flex items-center justify-center gap-2 shadow-vacation"
        >
          <Heart size={18} fill="currentColor" /> Find travel buddies
        </button>
        <button
          onClick={() => onGoTo("groups")}
          className="w-full py-3.5 rounded-2xl bg-white/80 text-secondary-foreground font-heading font-bold flex items-center justify-center gap-2 shadow-card"
        >
          <Compass size={18} /> Open your groups
        </button>
      </div>
    </motion.div>
  );
};

export default HomeScreen;
