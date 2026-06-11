import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Settings2,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Ban,
  Hotel,
  Calendar,
  MapPin,
  PartyPopper,
  RefreshCw,
  Link2,
  MessageCircle,
  Send,
  Bot,
  Video,
} from "lucide-react";
import {
  getGroups,
  saveGroups,
  addGroup,
  addChatMessage,
  GroupWithPrefs,
  GroupMemberPrefs,
  ChatMessage,
  ScoredTrip,
  scoreTripsForGroup,
  ACTIVITY_OPTIONS,
  DIETARY_OPTIONS,
  MOBILITY_OPTIONS,
  BUDGET_OPTIONS,
  NOGO_OPTIONS,
} from "@/data/profileStore";
import VideoChatMock from "@/components/VideoChatMock";
import { toast } from "sonner";

interface Props {
  initialGroupId?: string | null;
  onGroupOpened?: () => void;
}

const GroupPlanningScreen = ({ initialGroupId, onGroupOpened }: Props) => {
  const [groups, setGroups] = useState<GroupWithPrefs[]>(getGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId ?? null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");


  const refresh = () => setGroups(getGroups());

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const g = addGroup(newGroupName.trim());
    setNewGroupName("");
    setShowNewGroup(false);
    refresh();
    setSelectedGroupId(g.id);
    onGroupOpened?.();
    toast.success("Group created!");
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        onBack={() => { setSelectedGroupId(null); refresh(); }}
        onUpdate={refresh}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <h1 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
        <Users size={22} className="text-primary" /> Groups
      </h1>




      <div className="space-y-3">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => { setSelectedGroupId(g.id); onGroupOpened?.(); }}
            className="w-full bg-card rounded-xl p-4 shadow-card text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full gradient-coral flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
              {g.members.length}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold">{g.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {g.members.map((m) => m.memberName).join(", ")}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {showNewGroup ? (
        <div className="mt-4 bg-card rounded-xl p-4 shadow-card space-y-3">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full bg-transparent text-sm font-medium outline-none border-b border-border pb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleCreateGroup} className="flex-1 py-2 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold text-sm">Create</button>
            <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2 rounded-xl bg-secondary font-heading font-semibold text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewGroup(true)}
          className="w-full mt-4 py-3 rounded-xl bg-secondary font-heading font-semibold flex items-center justify-center gap-2"
        >
          <Plus size={18} /> New Group
        </button>
      )}
    </motion.div>
  );
};

type View = "overview" | "member-prefs" | "add-member" | "voting" | "result" | "no-match" | "chat" | "videochat";

const GroupDetail = ({
  group,
  onBack,
  onUpdate,
}: {
  group: GroupWithPrefs;
  onBack: () => void;
  onUpdate: () => void;
}) => {
  // Auto-open voting if there are trips with pending votes
  const initialView: View =
    group.decidedTrip ? "result"
    : group.trips.length > 0 && group.trips.some((t) => t.votes.find(v => v.memberId === "self")?.vote === null)
      ? "voting"
      : "overview";

  const [view, setView] = useState<View>(initialView);
  const [editingMember, setEditingMember] = useState<GroupMemberPrefs | null>(null);

  const persist = (mutator: (g: GroupWithPrefs) => void) => {
    const all = getGroups();
    const g = all.find((gr) => gr.id === group.id);
    if (g) {
      mutator(g);
      saveGroups(all);
    }
    onUpdate();
  };

  const startVoting = () => {
    persist((g) => {
      const excluded = g.trips.filter((t) => t.votes.some((v) => v.vote === "nogo")).map((t) => t.name);
      g.trips = scoreTripsForGroup(g, excluded);
      g.votingRound = (g.votingRound || 0) + 1;
      g.decidedTrip = undefined;
    });
    setView("voting");
  };

  if (view === "member-prefs" && editingMember) {
    return (
      <MemberPrefsEditor
        member={editingMember}
        onSave={(updated) => {
          persist((g) => {
            const idx = g.members.findIndex((m) => m.memberId === updated.memberId);
            if (idx >= 0) g.members[idx] = updated;
          });
          setEditingMember(null);
          setView("overview");
          toast.success(`${updated.memberName}'s preferences updated`);
        }}
        onBack={() => { setEditingMember(null); setView("overview"); }}
      />
    );
  }

  if (view === "add-member") {
    return (
      <AddMemberForm
        onSave={(name) => {
          persist((g) => {
            g.members.push({
              memberId: Date.now().toString(),
              memberName: name,
              preferences: [],
              dislikes: [],
              budgetRange: "",
              mobilityLevel: "No restrictions",
              dietaryNeeds: [],
            });
          });
          toast.success(`${name} added!`);
          setView("overview");
        }}
        onBack={() => setView("overview")}
      />
    );
  }

  if (view === "voting") {
    return (
      <VotingView
        group={getGroups().find((g) => g.id === group.id)!}
        onCancel={() => setView("overview")}
        onVote={(tripName, vote) => {
          persist((g) => {
            const trip = g.trips.find((t) => t.name === tripName);
            if (trip) {
              const v = trip.votes.find((vv) => vv.memberId === "self");
              if (v) v.vote = vote;
            }
          });
        }}
        onFinish={() => {
          // Simulate other members voting
          persist((g) => {
            g.trips.forEach((t) => {
              t.votes.forEach((v) => {
                if (v.memberId !== "self" && v.vote === null) {
                  // bias by per-member compatibility score
                  const score = t.breakdown[g.members.find((m) => m.memberId === v.memberId)?.memberName || ""] ?? 50;
                  v.vote = score >= 65 ? "yes" : score >= 40 ? (Math.random() > 0.5 ? "yes" : "no") : "no";
                }
              });
            });
          });

          const refreshed = getGroups().find((g) => g.id === group.id)!;
          // Determine winner: trip where ALL members voted yes, or majority yes with no "no"
          const winner = refreshed.trips.find((t) => t.votes.every((v) => v.vote === "yes"));
          if (winner) {
            persist((g) => { g.decidedTrip = winner.name; });
            setView("result");
          } else {
            setView("no-match");
          }
        }}
      />
    );
  }

  if (view === "result") {
    const decided = group.trips.find((t) => t.name === group.decidedTrip) || group.trips[0];
    return <ResultView trip={decided} groupName={group.name} onBack={() => setView("overview")} />;
  }

  if (view === "no-match") {
    return (
      <NoMatchView
        onRetry={() => { startVoting(); }}
        onBack={() => setView("overview")}
      />
    );
  }

  if (view === "chat") {
    return (
      <GroupChatView
        group={getGroups().find((g) => g.id === group.id)!}
        onBack={() => setView("overview")}
        onStartVideo={() => setView("videochat")}
        onSend={(text) => {
          addChatMessage(group.id, { memberId: "self", memberName: "You", text });
          // simulated AI reply
          setTimeout(() => {
            addChatMessage(group.id, {
              memberId: "ai",
              memberName: "Planly AI",
              isAI: true,
              text: "Got it — I'll factor that into the next round of suggestions.",
            });
            onUpdate();
          }, 600);
          onUpdate();
        }}
      />
    );
  }

  if (view === "videochat") {
    const profile = JSON.parse(localStorage.getItem("planly_profile") || "{}");
    const others = group.members
      .filter((m) => m.memberId !== "self" && m.memberId !== "ai")
      .map((m) => ({ id: m.memberId, name: m.memberName, avatar: "🙂" }));
    return (
      <VideoChatMock
        self={{ name: profile.name?.split(" ")[0] || "You", avatar: profile.avatar || "🙂" }}
        participants={others.length ? others : [{ id: "x", name: "Waiting…", avatar: "⏳" }]}
        onEnd={() => {
          addChatMessage(group.id, {
            memberId: "ai",
            memberName: "Planly AI",
            isAI: true,
            text: "Group call ended. Want me to summarise what you agreed on?",
          });
          onUpdate();
          setView("overview");
        }}
        context={`${group.name} · group call`}
      />
    );
  }

  // overview
  const inviteLink = `${window.location.origin}/?invite=${group.id}`;
  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pt-4 pb-4">
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="font-heading text-xl font-bold mb-1">{group.name}</h1>
      {group.decidedTrip && (
        <p className="text-sm text-teal font-medium mb-3">✓ Decided: {group.decidedTrip}</p>
      )}

      <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-2 mt-4">Members</h3>
      <div className="space-y-2 mb-4">
        {group.members.map((m) => (
          <button
            key={m.memberId}
            onClick={() => { setEditingMember(m); setView("member-prefs"); }}
            className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-coral-light flex items-center justify-center text-lg">👤</div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm">{m.memberName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {m.preferences.length > 0 ? m.preferences.slice(0, 3).join(", ") : "No preferences set"}
              </p>
            </div>
            <Settings2 size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setView("chat")}
          className="py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5 relative"
        >
          <MessageCircle size={16} /> Chat
          {(group.chat?.length ?? 0) > 0 && (
            <span className="absolute top-1 right-2 text-[10px] bg-coral text-primary-foreground rounded-full px-1.5">
              {group.chat!.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView("videochat")}
          className="py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
        >
          <Video size={16} /> Video call
        </button>
        <button
          onClick={() => setView("add-member")}
          className="py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
        >
          <UserPlus size={16} /> Add
        </button>
        <button
          onClick={copyInvite}
          className="py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
        >
          <Link2 size={16} /> Invite link
        </button>
      </div>

      {group.decidedTrip ? (
        <button
          onClick={() => setView("result")}
          className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <PartyPopper size={18} /> View Trip Overview
        </button>
      ) : (
        <button
          onClick={startVoting}
          className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <Sparkles size={18} /> Get AI Suggestions & Vote
        </button>
      )}

      {group.trips.length > 0 && !group.decidedTrip && (
        <button
          onClick={() => setView("voting")}
          className="w-full mt-2 py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm"
        >
          Continue voting (round {group.votingRound})
        </button>
      )}
    </motion.div>
  );
};

const VotingView = ({
  group,
  onCancel,
  onVote,
  onFinish,
}: {
  group: GroupWithPrefs;
  onCancel: () => void;
  onVote: (trip: string, v: "yes" | "no" | "nogo") => void;
  onFinish: () => void;
}) => {
  const allVoted = group.trips.every((t) => t.votes.find((v) => v.memberId === "self")?.vote !== null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <button onClick={onCancel} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="font-heading text-xl font-bold mb-1">Vote for Your Next Trip</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Round {group.votingRound} · {group.name}
      </p>

      <div className="space-y-3">
        {group.trips.map((trip) => {
          const myVote = trip.votes.find((v) => v.memberId === "self")?.vote;
          return (
            <div key={trip.name} className="bg-card rounded-xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-bold">
                    {trip.name}, {trip.country}
                  </h3>
                  <p className="text-xs text-muted-foreground">AI score</p>
                  <p className="text-sm font-medium">
                    {trip.score}% match with your group
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{trip.weatherC}° {trip.weatherDesc}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 mb-3 pl-1">
                <p>Budget: ca. €{trip.budgetEur} p.P.</p>
                <p>Duration: {trip.durationDays} days</p>
                <p>Best season: May–June</p>
                <p>Style: {trip.travelStyle}</p>
              </div>

              {myVote ? (
                <div className={`text-xs font-medium px-3 py-2 rounded-lg text-center ${
                  myVote === "yes" ? "bg-teal-light text-teal" :
                  myVote === "no" ? "bg-coral-light text-coral" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {myVote === "yes" ? "✓ Let's do it" : myVote === "no" ? "✗ Not for me" : "🚫 No-go for me"}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onVote(trip.name, "yes")}
                      className="py-2 rounded-lg bg-teal-light text-teal font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
                    >
                      <ThumbsUp size={14} /> Let's do it
                    </button>
                    <button
                      onClick={() => onVote(trip.name, "no")}
                      className="py-2 rounded-lg bg-secondary font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
                    >
                      <ThumbsDown size={14} /> Not for me
                    </button>
                  </div>
                  <button
                    onClick={() => onVote(trip.name, "nogo")}
                    className="w-full mt-2 text-xs text-muted-foreground underline flex items-center justify-center gap-1"
                  >
                    <Ban size={12} /> This destination is a no-go for me
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        disabled={!allVoted}
        className="w-full mt-5 py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
      >
        Finish voting
      </button>
    </motion.div>
  );
};

const NoMatchView = ({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pt-4 pb-4">
    <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
      <ChevronLeft size={16} /> Back
    </button>
    <div className="bg-card rounded-2xl p-6 shadow-card text-center">
      <div className="text-5xl mb-3">🤔</div>
      <h2 className="font-heading text-xl font-bold mb-2">No clear winner yet</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Your group's preferences differ a lot. Planly can suggest a new set of destinations based on this round's feedback.
      </p>
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2"
      >
        <RefreshCw size={16} /> Try another round
      </button>
    </div>
    <p className="text-xs text-muted-foreground text-center mt-3">
      No decision is forced — iterate until you all agree.
    </p>
  </motion.div>
);

const ResultView = ({ trip, groupName, onBack }: { trip: ScoredTrip; groupName: string; onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
    <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
      <ChevronLeft size={16} /> Back
    </button>

    <div className="text-center mb-5">
      <PartyPopper size={36} className="text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{groupName} · Final Trip</p>
      <h1 className="font-heading text-2xl font-bold flex items-center justify-center gap-2">
        <MapPin size={22} className="text-primary" /> {trip.name}
      </h1>
      <p className="text-sm text-muted-foreground">{trip.country} · {trip.weatherC}° {trip.weatherDesc}</p>
    </div>

    <div className="space-y-3">
      <OverviewRow icon={<Hotel size={18} />} label="Hotel" value={trip.hotel} />
      <OverviewRow icon={<Calendar size={18} />} label="Check-in" value={`${trip.checkIn} 16:00`} />
      <OverviewRow icon={<Calendar size={18} />} label="Check-out" value={`${trip.checkOut} 11:00`} />
      <OverviewRow icon={<Sparkles size={18} />} label="Style" value={trip.travelStyle} />

      <div className="bg-card rounded-xl p-4 shadow-card">
        <p className="text-xs text-muted-foreground font-medium mb-2">Activities</p>
        <ul className="space-y-1.5">
          {trip.activities.map((a) => (
            <li key={a} className="text-sm flex items-start gap-2">
              <span className="text-primary">•</span>{a}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card">
        <p className="text-xs text-muted-foreground font-medium mb-2">Group compatibility</p>
        {Object.entries(trip.breakdown).map(([name, score]) => (
          <div key={name} className="flex items-center gap-3 mb-1.5 last:mb-0">
            <span className="text-xs w-16 truncate">{name}</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full ${score >= 70 ? "bg-teal" : score >= 40 ? "bg-amber" : "bg-coral"}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-medium w-8 text-right">{score}%</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const OverviewRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-coral-light text-primary flex items-center justify-center">{icon}</div>
    <div className="flex-1">
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-heading font-semibold">{value}</p>
    </div>
  </div>
);

const MemberPrefsEditor = ({
  member, onSave, onBack,
}: { member: GroupMemberPrefs; onSave: (m: GroupMemberPrefs) => void; onBack: () => void }) => {
  const [prefs, setPrefs] = useState({ ...member });
  const toggle = (field: keyof GroupMemberPrefs, value: string) => {
    setPrefs((prev) => {
      const arr = prev[field] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>
      <h2 className="font-heading text-xl font-bold mb-1">{prefs.memberName}'s Preferences</h2>
      <p className="text-sm text-muted-foreground mb-5">These shape the AI's suggestions</p>

      <div className="space-y-5">
        <Chips label="Likes & Interests" options={ACTIVITY_OPTIONS} selected={prefs.preferences} onToggle={(v) => toggle("preferences", v)} />
        <Chips label="Dislikes & No-gos" options={[...NOGO_OPTIONS, "Night life", "Extreme sports", "Hot climate", "Cold climate"]} selected={prefs.dislikes} onToggle={(v) => toggle("dislikes", v)} />
        <Single label="Budget" options={BUDGET_OPTIONS} selected={prefs.budgetRange} onSelect={(v) => setPrefs((p) => ({ ...p, budgetRange: v }))} />
        <Single label="Mobility" options={MOBILITY_OPTIONS} selected={prefs.mobilityLevel} onSelect={(v) => setPrefs((p) => ({ ...p, mobilityLevel: v }))} />
        <Chips label="Dietary Needs" options={DIETARY_OPTIONS} selected={prefs.dietaryNeeds} onToggle={(v) => toggle("dietaryNeeds", v)} />
      </div>

      <button onClick={() => onSave(prefs)} className="w-full mt-6 py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold">
        Save Preferences
      </button>
    </motion.div>
  );
};

const AddMemberForm = ({ onSave, onBack }: { onSave: (name: string) => void; onBack: () => void }) => {
  const [name, setName] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>
      <h2 className="font-heading text-xl font-bold mb-4">Add Member</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Member name..."
          className="w-full bg-transparent text-sm font-medium outline-none border-b border-border pb-2"
          autoFocus
        />
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          className="w-full py-2.5 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold text-sm"
        >
          Add to Group
        </button>
      </div>
    </motion.div>
  );
};

const Chips = ({ label, options, selected, onToggle }: { label?: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div>
    {label && <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${selected.includes(opt) ? "gradient-coral text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const Single = ({ label, options, selected, onSelect }: { label?: string; options: string[]; selected: string; onSelect: (v: string) => void }) => (
  <div>
    {label && <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${selected === opt ? "gradient-coral text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const GroupChatView = ({
  group,
  onBack,
  onSend,
  onStartVideo,
}: {
  group: GroupWithPrefs;
  onBack: () => void;
  onSend: (text: string) => void;
  onStartVideo: () => void;
}) => {
  const [text, setText] = useState("");
  const messages: ChatMessage[] = group.chat ?? [];

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 min-h-[calc(100vh-4rem)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-sm text-primary font-medium flex items-center gap-1">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onStartVideo}
          className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary"
        >
          <Video size={14} /> Video
        </button>
      </div>

      <h2 className="font-heading text-lg font-bold mb-0.5">{group.name}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {group.members.map((m) => m.memberName).join(", ")} · Planly AI
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((m) => {
          const isSelf = m.memberId === "self";
          const isAI = m.isAI;
          return (
            <div
              key={m.id}
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex ${isSelf ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  isAI ? "gradient-coral text-primary-foreground" : "bg-coral-light"
                }`}>
                  {isAI ? <Bot size={14} /> : isSelf ? "🙂" : "👤"}
                </div>
                <div>
                  {!isSelf && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {m.memberName}
                    </p>
                  )}
                  <div className={`rounded-2xl px-3 py-2 text-sm ${
                    isSelf
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : isAI
                        ? "bg-amber-light text-foreground rounded-bl-sm"
                        : "bg-card shadow-card text-foreground rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 bg-card rounded-full px-1 py-1 shadow-card">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message your group..."
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-full gradient-coral text-primary-foreground flex items-center justify-center disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
};


export default GroupPlanningScreen;
