import { motion } from "framer-motion";
import { CheckSquare, Square, ChevronRight, Heart, Compass } from "lucide-react";
import { getGroups, getProfile } from "@/data/profileStore";

interface HomeScreenProps {
  onOpenGroup: (id: string) => void;
  onGoTo: (tab: "buddies" | "groups") => void;
}

const HomeScreen = ({ onOpenGroup, onGoTo }: HomeScreenProps) => {
  const profile = getProfile();
  const groups = getGroups();

  // Groups with open voting rounds = your turn to reply
  const pendingGroups = groups.filter(
    (g) =>
      !g.decidedTrip &&
      g.trips.length > 0 &&
      g.trips.some((t) => t.votes.find((v) => v.memberId === "self")?.vote === null)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-heading text-2xl font-bold">
          Hi {profile.name?.split(" ")[0] || "there"} 👋
        </h1>
      </div>

      <section className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-3">To-Do</h2>
        {pendingGroups.length === 0 ? (
          <div className="bg-card rounded-xl p-4 shadow-card flex items-center gap-3">
            <CheckSquare size={20} className="text-teal" />
            <p className="text-sm text-muted-foreground">All caught up — no votes pending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => onOpenGroup(g.id)}
                className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3 text-left"
              >
                <Square size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-heading font-semibold text-sm">
                    Vote for next trip — {g.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Your opinion is missing :(</p>
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
                className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">
                  {g.members.length}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm">{g.name}</p>
                  {g.decidedTrip ? (
                    <p className="text-xs text-teal font-medium">
                      Decided: {g.decidedTrip} 🎉
                    </p>
                  ) : needsReply && g.trips.length > 0 ? (
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-coral-light">
                      <span className="text-[11px] font-medium text-coral">
                        Your turn to reply
                      </span>
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
          className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <Heart size={18} fill="currentColor" /> Find travel buddies
        </button>
        <button
          onClick={() => onGoTo("groups")}
          className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold flex items-center justify-center gap-2"
        >
          <Compass size={18} /> Check out your existing groups
        </button>
      </div>
    </motion.div>
  );
};

export default HomeScreen;
