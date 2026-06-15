import { motion } from "framer-motion";
import {
  Bell,
  CheckSquare,
  ChevronRight,
  Compass,
  Heart,
  HelpCircle,
  MapPinned,
  Plus,
  Settings2,
  Sparkles,
  Square,
  Users,
} from "lucide-react";
import { getGroups, getProfile } from "@/data/profileStore";
import lisbonImg from "@/assets/trip-lisbon.jpg";

interface HomeScreenProps {
  onOpenGroup: (id: string) => void;
  onGoTo: (tab: "buddies" | "groups" | "profile") => void;
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
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-heading text-2xl font-extrabold leading-tight">
            Hi {profile.name?.split(" ")[0] || "there"}
          </h1>
        </div>

        <button
          type="button"
          className="relative w-11 h-11 rounded-2xl bg-white border border-border shadow-card flex items-center justify-center text-foreground"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {pendingGroups.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {pendingGroups.length}
            </span>
          )}
        </button>
      </header>

      <div className="relative overflow-hidden rounded-[2rem] min-h-64 mb-4 shadow-vacation">
        <img src={lisbonImg} alt="Sunny Lisbon street" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 via-foreground/10 to-foreground/65" />
        <div className="relative z-10 min-h-64 p-5 flex flex-col justify-between text-white">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
            <MapPinned size={21} />
          </div>
          <div>
            <h3 className="font-heading text-3xl font-extrabold leading-tight">
              Ready to travel?
            </h3>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Decisions
        </h2>
        {pendingGroups.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <CheckSquare size={20} className="text-teal" />
            <p className="text-sm text-muted-foreground">No open decisions right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => onOpenGroup(g.id)}
                className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left"
              >
                <Square size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-heading font-semibold text-sm">Voting open - {g.name}</p>
                  <p className="text-xs text-muted-foreground">Your group is waiting for your reply.</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-3" >Most recent group</h2>
        {groups.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="font-heading font-semibold text-sm">No group yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a group or find buddies to start planning.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.slice(0, 1).map((g) => {
              const needsReply = g.trips.some(
                (t) => t.votes.find((v) => v.memberId === "self")?.vote === null
              );
              const status = g.decidedTrip
                ? "Suggested Plan ready"
                : needsReply && g.trips.length > 0
                  ? "Voting open"
                  : g.trips.length > 0
                    ? "Planly AI suggestions ready"
                    : "Ready to plan";

             return (
                <button
                  key={g.id}
                  onClick={() => onOpenGroup(g.id)}
                  className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-2xl bg-soft-teal text-teal flex items-center justify-center">
                    <Users size={19} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm truncate">{g.name}</p>

                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {g.members.map((m) => m.memberName).join(", ")}
                    </p>

                    <p
                      className={`text-xs font-semibold mt-1 ${
                        status === "Ready to plan" ? "text-primary" : "text-teal"
                      }`}
                    >
                      {status}
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">Travel tools - Your shortcuts</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => onGoTo("groups")}
            className="bg-card rounded-2xl p-3 shadow-card text-left"
          >
            <Plus size={17} className="text-teal mb-2" />
            <span className="text-xs font-heading font-bold leading-tight">Create group</span>
          </button>

          <button
            onClick={() => onGoTo("profile")}
            className="bg-card rounded-2xl p-3 shadow-card text-left"
          >
            <Settings2 size={17} className="text-primary mb-2" />
            <span className="text-xs font-heading font-bold leading-tight">Update profile</span>
          </button>

          <button
            type="button"
            className="bg-card rounded-2xl p-3 shadow-card text-left"
            onClick={() => {
              // Prototype response. Replace with toast if available.
              alert("FAQ is part of the prototype and would explain Planly AI, matching, privacy and group voting.");
            }}
          >
            <HelpCircle size={17} className="text-navy mb-2" />
            <span className="text-xs font-heading font-bold leading-tight">FAQ</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => onGoTo("buddies")}
          className="py-3.5 rounded-2xl bg-primary text-primary-foreground font-heading font-bold flex items-center justify-center gap-2 shadow-vacation"
        >
          <Heart size={18} fill="currentColor" /> Find buddies
        </button>
        <button
          onClick={() => onGoTo("groups")}
          className="py-3.5 rounded-2xl bg-navy text-primary-foreground font-heading font-bold flex items-center justify-center gap-2 shadow-card border border-border"
        >
          <Compass size={18} /> Open groups
        </button>
      </div>
    </motion.div>
  );
};

export default HomeScreen;
