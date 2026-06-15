import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  X,
  ChevronLeft,
  Wallet,
  Compass,
  MapPin,
  Video,
  Sparkles,
  Users as UsersIcon,
  Clock,
  CheckCircle2,
  Check,
  Plus,
} from "lucide-react";
import { travelers, TravelerProfile } from "@/data/mockData";
import {
  addGroup,
  getGroups,
  saveGroups,
  getProfile,
  getMatches,
  addMatch,
} from "@/data/profileStore";
import VideoChatMock from "@/components/VideoChatMock";
import { toast } from "sonner";

type Status = "new" | "liked" | "matched" | "passed";
type View =
  | "list"
  | "preview"
  | "videochat"
  | "matched-actions"
  | "create-group"
  | "add-to-group";

interface BuddiesScreenProps {
  onOpenGroup?: (id: string) => void;
}

const RECIPROCATING_IDS = new Set(["1", "2", "3"]);

const compatibility = (t: TravelerProfile): number => {
  const profile = getProfile();
  const styleMatch = profile.travelStyle?.some(
    (s) => s.toLowerCase() === t.style.toLowerCase()
  );
  let score = 60;
  if (styleMatch) score += 25;
  score += t.id.charCodeAt(0) % 12;
  return Math.min(98, score);
};

const BuddiesScreen = ({ onOpenGroup }: BuddiesScreenProps) => {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() => {
    const initial: Record<string, Status> = {};
    getMatches().forEach((id) => (initial[id] = "matched"));
    return initial;
  });
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<TravelerProfile | null>(null);
  const [pickedBuddies, setPickedBuddies] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");

  const enriched = useMemo(
    () => travelers.map((t) => ({ ...t, score: compatibility(t) })),
    []
  );

  const matchedTravelers = enriched.filter((t) => statuses[t.id] === "matched");

  const openProfile = (t: TravelerProfile) => {
    setSelected(t);
    setView("preview");
  };

  const handlePass = (t: TravelerProfile) => {
    setStatuses((s) => ({ ...s, [t.id]: "passed" }));
    setView("list");
    setSelected(null);
  };

  const handleLike = (t: TravelerProfile) => {
    const reciprocates = RECIPROCATING_IDS.has(t.id);
    if (reciprocates) {
      setStatuses((s) => ({ ...s, [t.id]: "matched" }));
      addMatch(t.id);
      setView("matched-actions");
      toast.success(`${t.name} also wants to travel with you!`);
    } else {
      setStatuses((s) => ({ ...s, [t.id]: "liked" }));
      setView("list");
      setSelected(null);
      toast(`Interest sent to ${t.name}`, {
        description: "We'll let you know if they're interested too.",
      });
    }
  };

  const openCreateGroup = () => {
    const ids = new Set<string>();
    if (selected) ids.add(selected.id);
    setPickedBuddies(ids);
    setGroupName(selected ? `Trip with ${selected.name}` : "New group");
    setView("create-group");
  };

  const togglePicked = (id: string) => {
    setPickedBuddies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createGroupWithPicked = () => {
    if (pickedBuddies.size === 0) {
      toast.error("Pick at least one travel buddy");
      return;
    }
    const name = groupName.trim() || "New group";
    const g = addGroup(name);
    const all = getGroups();
    const target = all.find((gr) => gr.id === g.id);
    if (target) {
      pickedBuddies.forEach((id) => {
        const t = travelers.find((tr) => tr.id === id);
        if (t) {
          target.members.push({
            memberId: t.id,
            memberName: t.name,
            preferences: [t.style],
            dislikes: [],
            budgetRange: t.budget,
            mobilityLevel: "No restrictions",
            dietaryNeeds: [],
          });
        }
      });
      saveGroups(all);
    }
    toast.success(`Group "${name}" created with ${pickedBuddies.size} buddies`);
    setView("list");
    setSelected(null);
    setPickedBuddies(new Set());
    onOpenGroup?.(g.id);
  };

  const addBuddyToExistingGroup = (groupId: string, traveler: TravelerProfile) => {
    const all = getGroups();
    const target = all.find((gr) => gr.id === groupId);
    if (!target) return;
    if (target.members.some((m) => m.memberId === traveler.id)) {
      toast(`${traveler.name} is already in this group`);
      return;
    }
    target.members.push({
      memberId: traveler.id,
      memberName: traveler.name,
      preferences: [traveler.style],
      dislikes: [],
      budgetRange: traveler.budget,
      mobilityLevel: "No restrictions",
      dietaryNeeds: [],
    });
    saveGroups(all);
    toast.success(`${traveler.name} added to "${target.name}"`);
    setView("list");
    setSelected(null);
    onOpenGroup?.(groupId);
  };

  // -------- Video chat --------
  if (view === "videochat" && selected) {
    const profile = getProfile();
    return (
      <VideoChatMock
        self={{ name: profile.name?.split(" ")[0] || "You", avatar: profile.avatar || "🙂" }}
        participants={[{ id: selected.id, name: selected.name, avatar: selected.avatar }]}
        onEnd={() => {
          toast.success("Call ended");
          setView("matched-actions");
        }}
        context="Break-the-ice call · keep it short"
      />
    );
  }

  // -------- Create group view --------
  if (view === "create-group") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
        <button
          onClick={() => setView(selected ? "matched-actions" : "list")}
          className="text-sm text-primary font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="font-heading text-xl font-bold mb-1">Create a group</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick which matched buddies to plan with. You can add more later.
        </p>

        <label className="text-xs text-muted-foreground font-medium">Group name</label>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full bg-card rounded-xl px-3 py-2.5 mt-1 mb-4 text-sm outline-none border border-border"
        />

        <p className="text-xs text-muted-foreground font-medium mb-2">Your matches</p>
        {matchedTravelers.length === 0 ? (
          <div className="bg-card rounded-xl p-4 shadow-card text-sm text-muted-foreground text-center">
            You don't have any matches yet.
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {matchedTravelers.map((t) => {
              const picked = pickedBuddies.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => togglePicked(t.id)}
                  className={`w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left border-2 ${
                    picked ? "border-primary" : "border-transparent"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-coral-light flex items-center justify-center text-2xl">
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm">
                      {t.name}, {t.age}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.style} · {t.budget}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      picked ? "gradient-coral text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {picked && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={createGroupWithPicked}
          className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <UsersIcon size={16} /> Create group with {pickedBuddies.size} buddies
        </button>
      </motion.div>
    );
  }

  // -------- Add to existing group --------
  if (view === "add-to-group" && selected) {
    const groups = getGroups();
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
        <button
          onClick={() => setView("matched-actions")}
          className="text-sm text-primary font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="font-heading text-xl font-bold mb-1">Add {selected.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a group to add them to.
        </p>
        <div className="space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => addBuddyToExistingGroup(g.id, selected)}
              className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">
                {g.members.length}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm">{g.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {g.members.map((m) => m.memberName).join(", ")}
                </p>
              </div>
              <Plus size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // -------- It's a match --------
  if (view === "matched-actions" && selected) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pt-4 pb-4">
        <button
          onClick={() => { setView("list"); setSelected(null); }}
          className="text-sm text-primary font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back to buddies
        </button>
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <Sparkles size={36} className="text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Mutual interest</p>
          <div className="w-20 h-20 rounded-full bg-coral-light flex items-center justify-center text-4xl mx-auto my-3">
            {selected.avatar}
          </div>
          <h2 className="font-heading text-xl font-bold mb-1">
            You and {selected.name} want to travel together
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Get to know each other, plan a new trip together, or add them to an existing group.
          </p>
          <button
            onClick={() => setView("videochat")}
            className="w-full py-3 rounded-xl bg-secondary font-heading font-semibold mb-2 flex items-center justify-center gap-2"
          >
            <Video size={16} /> Start a video chat
          </button>
          <button
            onClick={openCreateGroup}
            className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold mb-2 flex items-center justify-center gap-2"
          >
            <UsersIcon size={16} /> Create new group ({matchedTravelers.length} matches)
          </button>
          <button
            onClick={() => setView("add-to-group")}
            className="w-full py-2.5 rounded-xl bg-transparent border border-border font-heading font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add to existing group
          </button>
        </div>
      </motion.div>
    );
  }

  // -------- Profile preview --------
  if (view === "preview" && selected) {
    const status = statuses[selected.id] ?? "new";
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-4 pb-4">
        <button
          onClick={() => { setView("list"); setSelected(null); }}
          className="text-sm text-primary font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-coral-light flex items-center justify-center text-4xl">
              {selected.avatar}
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold">
                {selected.name}, {selected.age}
              </h2>
              <p className="text-xs text-muted-foreground">
                Compatibility estimate: {compatibility(selected)}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Tag icon={<Wallet size={14} />} label={`Budget ${selected.budget}`} variant="coral" />
            <Tag icon={<Compass size={14} />} label={selected.style} variant="teal" />
            <Tag icon={<MapPin size={14} />} label={selected.destination} variant="amber" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground mb-2">About</p>
          <ul className="space-y-2 mb-5">
            {selected.about.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground mb-3">
            Video chat is offered only after both of you show interest.
          </p>

          {status === "liked" ? (
            <div className="w-full py-3 rounded-xl bg-secondary text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Clock size={14} /> Waiting for {selected.name} to reply
            </div>
          ) : status === "matched" ? (
            <button
              onClick={() => setView("matched-actions")}
              className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Continue planning
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePass(selected)}
                className="py-3 rounded-xl bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <X size={16} /> Not for me
              </button>
              <button
                onClick={() => handleLike(selected)}
                className="py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <Heart size={16} fill="currentColor" /> I'm interested
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // -------- List view --------
  const visible = enriched.filter((t) => statuses[t.id] !== "passed");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <h1 className="font-heading text-xl font-bold mb-1 flex items-center gap-2">
        <Heart size={20} className="text-primary" fill="currentColor" /> Find travel buddies
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Browse profiles, compare compatibility estimates, then plan together.
      </p>

      {matchedTravelers.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-heading font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-teal" />
              Your matches ({matchedTravelers.length})
            </p>
          </div>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {matchedTravelers.map((t) => (
              <button
                key={t.id}
                onClick={() => openProfile(t)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center text-2xl">
                  {t.avatar}
                </div>
                <span className="text-[11px] text-muted-foreground">{t.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelected(null);
              setPickedBuddies(new Set(matchedTravelers.map((t) => t.id)));
              setGroupName("Travel Buddies");
              setView("create-group");
            }}
            className="w-full py-2.5 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2"
          >
            <UsersIcon size={14} /> Plan a trip with these buddies
          </button>
        </div>
      )}

      <AnimatePresence>
        <div className="space-y-3">
          {visible.map((t) => {
            const status = statuses[t.id] ?? "new";
            return (
              <motion.button
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => openProfile(t)}
                className="w-full bg-card rounded-2xl p-4 shadow-card text-left flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-coral-light flex items-center justify-center text-3xl">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-bold">{t.name}, {t.age}</p>
                    {status === "matched" && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-teal-light text-teal flex items-center gap-1">
                        <CheckCircle2 size={10} /> Mutual
                      </span>
                    )}
                    {status === "liked" && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.style} · {t.budget} · {t.destination}
                  </p>
                  <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-teal" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </AnimatePresence>

      {visible.length === 0 && (
        <div className="bg-card rounded-xl p-6 shadow-card text-center text-sm text-muted-foreground">
          No more profiles right now — check back later.
        </div>
      )}
    </motion.div>
  );
};

const Tag = ({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  variant: "coral" | "teal" | "amber";
}) => {
  const colors = {
    coral: "bg-coral-light text-foreground",
    teal: "bg-teal-light text-foreground",
    amber: "bg-amber-light text-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors[variant]}`}>
      {icon}
      {label}
    </span>
  );
};

export default BuddiesScreen;
