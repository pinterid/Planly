import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
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
  AlertTriangle,
  CheckCircle2,
  Bell,
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
} from "@/data/profileStore";
import VideoChatMock from "@/components/VideoChatMock";
import { toast } from "sonner";

interface Props {
  initialGroupId?: string | null;
  onGroupOpened?: () => void;
  onOpenProfile?: () => void;
  onOpenBuddies?: () => void;
}

type GroupFilter = "all" | "friends" | "buddies";

const GroupPlanningScreen = ({ initialGroupId, onGroupOpened, onOpenProfile, onOpenBuddies }: Props) => {
  const [groups, setGroups] = useState<GroupWithPrefs[]>(getGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId ?? null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [filter, setFilter] = useState<GroupFilter>("all");
  const [showNotifications, setShowNotifications] = useState(false);


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
        onOpenProfile={onOpenProfile}
        onOpenBuddies={onOpenBuddies}
      />
    );
  }

  const isTravelBuddyGroup = (group: GroupWithPrefs) =>
    group.name.startsWith("Trip with ") ||
    group.members.some((member) => member.memberId.startsWith("sg"));
  const visibleGroups = groups.filter((group) => {
    if (filter === "friends") return !isTravelBuddyGroup(group);
    if (filter === "buddies") return isTravelBuddyGroup(group);
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          <Users size={22} className="text-primary" /> Groups
        </h1>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative w-10 h-10 rounded-2xl bg-card shadow-card text-primary flex items-center justify-center"
          aria-label="Open group notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 w-2 h-2 rounded-full bg-coral" />
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
        <FilterChip active={filter === "friends"} onClick={() => setFilter("friends")}>Friends</FilterChip>
        <FilterChip active={filter === "buddies"} onClick={() => setFilter("buddies")}>Travel buddies</FilterChip>
      </div>

      <div className="space-y-3">
        {visibleGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => { setSelectedGroupId(g.id); onGroupOpened?.(); }}
            className="w-full bg-card rounded-xl p-4 shadow-card text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full gradient-coral flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
              <Users size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold">{g.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {g.members.map((m) => m.memberName).join(", ")}
              </p>
              <p className="text-xs text-teal font-semibold mt-1">
                {g.decidedTrip ? "Suggested plan ready" : g.trips.length > 0 ? "Voting in progress" : "Ready to plan"}
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

      {showNotifications && (
        <NotificationSheet
          onClose={() => setShowNotifications(false)}
          onOpenGroup={() => {
            setShowNotifications(false);
            const group = groups.find((item) => item.name === "Lisbon Culture Crew") ?? groups[0];
            if (group) {
              setSelectedGroupId(group.id);
              onGroupOpened?.();
            }
          }}
        />
      )}
    </motion.div>
  );
};

type View = "overview" | "member-prefs" | "voting" | "result" | "no-match" | "chat" | "videochat";
type AddSheetMode = "menu" | "invite" | "travel-confirm" | "travel-success";

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const getSharedPreferences = (group: GroupWithPrefs) => {
  const preferences = unique(group.members.flatMap((member) => member.preferences));
  return preferences.length ? preferences.slice(0, 8) : ["Culture", "Good Food", "Walking tours"];
};

const getPreferenceConflicts = (group: GroupWithPrefs) => {
  const conflicts: string[] = [];
  const budgets = unique(group.members.map((member) => member.budgetRange).filter(Boolean));
  const preferences = group.members.flatMap((member) => member.preferences).map((item) => item.toLowerCase());
  const dislikes = group.members.flatMap((member) => member.dislikes).map((item) => item.toLowerCase());

  if (budgets.length > 1) conflicts.push("Budget range differs between members.");
  if (preferences.some((item) => item.includes("night")) && dislikes.some((item) => item.includes("night"))) {
    conflicts.push("Some members prefer quiet places, others prefer nightlife.");
  }
  if (dislikes.some((item) => item.includes("long flight"))) {
    conflicts.push("Long flights are marked as a no-go.");
  }

  return conflicts;
};

const getTripExplanation = (group: GroupWithPrefs, trip: ScoredTrip) => {
  const sharedPreferences = getSharedPreferences(group);
  const matched = unique([
    ...sharedPreferences.filter((pref) =>
      `${trip.travelStyle} ${trip.activities.join(" ")} ${trip.name}`.toLowerCase().includes(pref.toLowerCase())
    ),
    "May-June",
    `${trip.durationDays} days`,
  ]).slice(0, 4);
  const lowFitMember = Object.entries(trip.breakdown).find(([, score]) => score < 65);
  const compromise = lowFitMember
    ? `Budget or style may need adjustment for ${lowFitMember[0]}.`
    : "Budget is slightly above one member's preferred range.";

  return {
    matched: matched.length ? matched : ["Culture", "Good Food", "May-June", `${trip.durationDays} days`],
    compromise,
  };
};

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full px-3.5 py-2 text-xs font-heading font-bold transition-colors ${
      active ? "bg-primary text-primary-foreground shadow-card" : "bg-secondary text-foreground"
    }`}
  >
    {children}
  </button>
);

const BottomSheet = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/20 px-4 pb-24" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-h-[calc(100vh-8rem)] w-full max-w-[398px] overflow-y-auto rounded-3xl bg-card p-4 pb-6 shadow-vacation"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
      {children}
    </motion.div>
  </div>
);

const NotificationSheet = ({ onClose, onOpenGroup }: { onClose: () => void; onOpenGroup: () => void }) => (
  <BottomSheet onClose={onClose}>
    <p className="font-heading text-lg font-bold">Requests</p>
    <div className="mt-3 rounded-2xl bg-secondary p-4">
      <p className="font-heading text-sm font-bold">Request accepted</p>
      <p className="mt-1 text-sm text-muted-foreground">You joined Lisbon Culture Crew.</p>
      <button
        onClick={onOpenGroup}
        className="mt-3 w-full rounded-2xl gradient-coral py-3 text-sm font-heading font-bold text-primary-foreground"
      >
        Open group
      </button>
    </div>
  </BottomSheet>
);

const DisplayChips = ({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "warning" | "teal" }) => {
  const classes = {
    neutral: "bg-secondary text-secondary-foreground",
    warning: "bg-warning-light text-warning",
    teal: "bg-teal-light text-teal",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${classes[tone]}`}>
          {item}
        </span>
      ))}
    </div>
  );
};

const GroupDetail = ({
  group,
  onBack,
  onUpdate,
  onOpenProfile,
  onOpenBuddies,
}: {
  group: GroupWithPrefs;
  onBack: () => void;
  onUpdate: () => void;
  onOpenProfile?: () => void;
  onOpenBuddies?: () => void;
}) => {
  // Auto-open voting if there are trips with pending votes
  const initialView: View = "overview";

  const [view, setView] = useState<View>(initialView);
  const [editingMember, setEditingMember] = useState<GroupMemberPrefs | null>(null);
  const [maxGroupSize, setMaxGroupSize] = useState(() => Math.max(group.members.length, group.name === "Lisbon Culture Crew" ? 5 : 5));
  const [showSizeSheet, setShowSizeSheet] = useState(false);
  const [addSheetMode, setAddSheetMode] = useState<AddSheetMode | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

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
      <MemberTravelProfile
        member={editingMember}
        onBack={() => { setEditingMember(null); setView("overview"); }}
        onOpenProfile={onOpenProfile}
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
    return <ResultView trip={decided} groupName={group.name} group={group} onBack={() => setView("overview")} />;
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
              text: "Got it. I'll factor that into the next round of suggestions.",
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
      .map((m) => ({ id: m.memberId, name: m.memberName, avatar: m.memberName.slice(0, 2).toUpperCase() }));
    return (
      <VideoChatMock
        self={{ name: profile.name?.split(" ")[0] || "You", avatar: (profile.name || "You").slice(0, 2).toUpperCase() }}
        participants={others.length ? others : [{ id: "x", name: "Waiting", avatar: "WT" }]}
        onEnd={() => {
          addChatMessage(group.id, {
            memberId: "ai",
            memberName: "Planly AI",
            isAI: true,
            text: "Group call ended. Want me to summarise the points your group discussed?",
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
  const copyInviteInSheet = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
  };
  const sharedPreferences = getSharedPreferences(group);
  const conflicts = getPreferenceConflicts(group);
  const isTravelBuddyGroup =
    group.name.startsWith("Trip with ") ||
    group.name === "Lisbon Culture Crew" ||
    group.members.some((member) => member.memberId.startsWith("sg"));
  const groupTypeLabel = isTravelBuddyGroup ? "Travel buddy group" : "Friends group";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pt-4 pb-4">
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold mb-1">{group.name}</h1>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {group.members.length} of {maxGroupSize} members · {groupTypeLabel}
          </p>
          <button onClick={() => setShowSizeSheet(true)} className="text-xs font-heading font-bold text-primary">
            Edit size
          </button>
        </div>
      </div>
      {group.decidedTrip && (
        <p className="text-sm text-teal font-medium mb-3">Suggested Plan: {group.decidedTrip}</p>
      )}

      <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-2">Members</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
        {group.members.map((m) => (
          <button
            key={m.memberId}
            onClick={() => { setEditingMember(m); setView("member-prefs"); }}
            className="min-w-[4.75rem] rounded-2xl bg-card p-3 shadow-card text-center"
          >
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-coral-light text-sm font-heading font-bold text-primary">
              {m.memberName.slice(0, 2).toUpperCase()}
            </div>
            <p className="truncate text-xs font-heading font-bold">{m.memberName}</p>
          </button>
        ))}
      </div>

      <section className="bg-card rounded-3xl p-4 shadow-card mb-3 border border-border/60">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-teal-light text-teal flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Shared preferences</p>
            <p className="text-xs text-muted-foreground mt-1">The strongest overlaps across this group.</p>
          </div>
        </div>
        <DisplayChips items={sharedPreferences} />
      </section>

      <section className="bg-card rounded-3xl p-4 shadow-card mb-3 border border-border/60">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-warning-light text-warning flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Preference conflicts</p>
            <p className="text-xs text-muted-foreground mt-1">Small tradeoffs to keep visible while planning.</p>
          </div>
        </div>
        {conflicts.length ? (
          <DisplayChips items={conflicts} tone="warning" />
        ) : (
          <p className="rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
            No major conflicts found.
          </p>
        )}
      </section>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setView("chat")}
            className="py-2.5 rounded-xl bg-white font-heading font-semibold text-sm flex items-center justify-center gap-1.5 relative"
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
            className="py-2.5 rounded-xl bg-white font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Video size={16} /> Video call
          </button>
        </div>


        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => {
              setInviteCopied(false);
              setAddSheetMode("menu");
            }}
            className="py-2.5 rounded-xl bg-white font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <UserPlus size={16} /> Add
          </button>
          <button
            onClick={copyInvite}
            className="py-2.5 rounded-xl bg-white font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Link2 size={16} /> Invite link
          </button>
        </div>

        {group.decidedTrip ? (
          <button
            onClick={() => setView("result")}
            className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
          >
            <PartyPopper size={18} /> View Suggested Plan
          </button>
        ) : (
          <button
            onClick={startVoting}
            className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
          >
            <Sparkles size={18} /> Get Planly AI suggestions & vote
          </button>
        )}

        

      {group.trips.length > 0 && !group.decidedTrip && (
          <button
            onClick={() => setView("voting")}
            className="w-full mt-2 py-2.5 rounded-xl bg-white font-heading font-semibold text-sm"
          >
            Continue voting (round {group.votingRound})
          </button>
        )}
      
      <section className="bg-teal-light rounded-3xl p-3 mt-3 mb-4 border border-teal/10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white text-teal flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <p className="font-heading font-bold text-sm text-foreground">Planly AI support</p>
            <p className="text-sm leading-6 text-foreground mt-1">
              Uses shared preferences and conflicts to prepare balanced trip suggestions and supports you in the chat.
            </p>
          </div>
        </div>
      </section>

      {showSizeSheet && (
        <EditSizeSheet
          value={maxGroupSize}
          min={group.members.length}
          onChange={setMaxGroupSize}
          onClose={() => setShowSizeSheet(false)}
        />
      )}

      {addSheetMode && (
        <AddToGroupSheet
          mode={addSheetMode}
          inviteLink={inviteLink}
          copied={inviteCopied}
          onClose={() => setAddSheetMode(null)}
          onInvite={() => {
            setInviteCopied(false);
            setAddSheetMode("invite");
          }}
          onCopyInvite={copyInviteInSheet}
          onTravelBuddies={() => setAddSheetMode("travel-confirm")}
          onCancelTravelBuddies={() => setAddSheetMode("menu")}
          onShowGroup={() => setAddSheetMode("travel-success")}
          onOpenBuddies={() => {
            if (onOpenBuddies) {
              onOpenBuddies();
              return;
            }
            toast("Planly will suggest people who match this group's shared preferences.");
          }}
        />
      )}
    </motion.div>
  );
};

const EditSizeSheet = ({
  value,
  min,
  onChange,
  onClose,
}: {
  value: number;
  min: number;
  onChange: (value: number) => void;
  onClose: () => void;
}) => {
  const options = [2, 3, 4, 5, 6, 8, 10].filter((option) => option >= min);
  return (
    <BottomSheet onClose={onClose}>
      <p className="font-heading text-lg font-bold">Edit group size</p>
      <p className="mt-1 text-sm text-muted-foreground">Set the maximum size for this prototype group.</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-2xl py-2.5 text-sm font-heading font-bold ${
              value === option ? "gradient-coral text-primary-foreground shadow-card" : "bg-secondary text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-heading font-bold text-primary-foreground">
        Done
      </button>
    </BottomSheet>
  );
};

const AddToGroupSheet = ({
  mode,
  inviteLink,
  copied,
  onClose,
  onInvite,
  onCopyInvite,
  onTravelBuddies,
  onCancelTravelBuddies,
  onShowGroup,
  onOpenBuddies,
}: {
  mode: AddSheetMode;
  inviteLink: string;
  copied: boolean;
  onClose: () => void;
  onInvite: () => void;
  onCopyInvite: () => void;
  onTravelBuddies: () => void;
  onCancelTravelBuddies: () => void;
  onShowGroup: () => void;
  onOpenBuddies: () => void;
}) => (
  <BottomSheet onClose={onClose}>
    {mode === "menu" && (
      <>
        <h2 className="font-heading text-xl font-bold mb-4">Add to group</h2>
        <div className="space-y-2">
          <button
            onClick={onInvite}
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-left font-heading text-sm font-bold"
          >
            Invite friends
          </button>
          <button
            onClick={onTravelBuddies}
            className="w-full rounded-2xl gradient-coral px-4 py-3 text-left font-heading text-sm font-bold text-primary-foreground"
          >
            Find travel buddies
          </button>
        </div>
      </>
    )}

    {mode === "invite" && (
      <>
        <h2 className="font-heading text-xl font-bold mb-2">Invite friends</h2>
        <p className="text-sm text-muted-foreground mb-3">Share this invite link with friends you want to plan with.</p>
        <div className="rounded-2xl bg-secondary px-3 py-3 text-xs font-semibold text-muted-foreground break-all">
          {inviteLink}
        </div>
        {copied && <p className="mt-3 text-sm font-heading font-bold text-teal">Invite link copied.</p>}
        <button
          onClick={onCopyInvite}
          className="mt-4 w-full rounded-2xl gradient-coral py-3 text-sm font-heading font-bold text-primary-foreground"
        >
          Copy invite link
        </button>
      </>
    )}

    {mode === "travel-confirm" && (
      <>
        <h2 className="font-heading text-xl font-bold mb-2">Show this group to travel buddies?</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Planly will suggest this group to compatible people based on shared preferences.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCancelTravelBuddies}
            className="rounded-2xl bg-secondary py-3 text-sm font-heading font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onShowGroup}
            className="rounded-2xl gradient-coral py-3 text-sm font-heading font-bold text-primary-foreground"
          >
            Show group
          </button>
        </div>
      </>
    )}

    {mode === "travel-success" && (
      <>
        <h2 className="font-heading text-xl font-bold mb-2">Group is visible to compatible buddies.</h2>
        <p className="text-sm leading-6 text-muted-foreground">Requests will appear in notifications.</p>
        <button
          onClick={onOpenBuddies}
          className="mt-4 w-full rounded-2xl gradient-coral py-3 text-sm font-heading font-bold text-primary-foreground"
        >
          Open Buddies
        </button>
      </>
    )}
  </BottomSheet>
);

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
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

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
          const explanation = getTripExplanation(group, trip);
          const isExpanded = expandedTrip === trip.name;
          return (
            <div key={trip.name} className="bg-card rounded-xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-bold">
                    {trip.name}, {trip.country}
                  </h3>
                  <p className="text-xs text-muted-foreground">Estimated group fit</p>
                  <p className="text-sm font-medium">
                    {trip.score}% suggested fit for your group
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

              <button
                onClick={() => setExpandedTrip(isExpanded ? null : trip.name)}
                className="w-full mb-3 rounded-xl bg-teal-light px-3 py-2 text-left text-xs font-heading font-bold text-teal flex items-center justify-between"
              >
                Why this score?
                <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded && (
                <div className="mb-3 rounded-2xl border border-border bg-secondary p-3 space-y-3">
                  <div>
                    <p className="text-xs font-heading font-bold text-foreground mb-2">Matched preferences</p>
                    <DisplayChips items={explanation.matched} tone="teal" />
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold text-foreground mb-1">Compromise / unmet preferences</p>
                    <p className="text-xs leading-5 text-muted-foreground">{explanation.compromise}</p>
                  </div>
                </div>
              )}

              {myVote ? (
                <div className={`text-xs font-medium px-3 py-2 rounded-lg text-center ${
                  myVote === "yes" ? "bg-teal-light text-teal" :
                  myVote === "no" ? "bg-coral-light text-coral" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {myVote === "yes" ? "I\'m in" : myVote === "no" ? "Not for me" : "No-go for me"}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onVote(trip.name, "yes")}
                      className="py-2 rounded-lg bg-teal-light text-teal font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
                    >
                      <ThumbsUp size={14} /> I'm in
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
      <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal flex items-center justify-center mx-auto mb-3"><RefreshCw size={22} /></div>
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

const ResultView = ({ trip, groupName, group, onBack }: { trip: ScoredTrip; groupName: string; group: GroupWithPrefs; onBack: () => void }) => {
  const explanation = getTripExplanation(group, trip);

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
    <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
      <ChevronLeft size={16} /> Back
    </button>

    <div className="text-center mb-5">
      <PartyPopper size={36} className="text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{groupName} · Suggested Plan</p>
      <h1 className="font-heading text-2xl font-bold flex items-center justify-center gap-2">
        <MapPin size={22} className="text-primary" /> {trip.name}
      </h1>
      <p className="text-sm text-muted-foreground">{trip.country} · {trip.weatherC}° {trip.weatherDesc}</p>
    </div>

    <div className="space-y-3">
      <section className="bg-teal-light rounded-2xl p-4 border border-teal/10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white text-teal flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Why this plan?</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {trip.name} had the highest group fit and no hard no-go conflict.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-heading font-bold mb-2">Matched preferences</p>
            <DisplayChips items={explanation.matched} tone="teal" />
          </div>
          <div>
            <p className="text-xs font-heading font-bold mb-1">Remaining compromise</p>
            <p className="text-xs leading-5 text-foreground">{explanation.compromise}</p>
          </div>
        </div>
      </section>
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
        <p className="text-xs text-muted-foreground font-medium mb-2">Estimated group fit</p>
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
};

const OverviewRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-coral-light text-primary flex items-center justify-center">{icon}</div>
    <div className="flex-1">
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-heading font-semibold">{value}</p>
    </div>
  </div>
);

const MemberTravelProfile = ({
  member,
  onBack,
  onOpenProfile,
}: {
  member: GroupMemberPrefs;
  onBack: () => void;
  onOpenProfile?: () => void;
}) => {
  const isCurrentUser = member.memberId === "self";
  const title = isCurrentUser ? "Your travel profile" : `${member.memberName}'s travel profile`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
        <ChevronLeft size={16} /> Back
      </button>
      <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-coral-light text-primary flex items-center justify-center font-heading font-bold">
            {member.memberName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold mb-1">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {isCurrentUser ? "Edit your preferences in Profile." : "Shared preferences used for group planning."}
            </p>
          </div>
        </div>
        {isCurrentUser && onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold"
          >
            Edit my profile
          </button>
        )}
      </div>

      <div className="space-y-3">
        <ReadOnlyPreferenceSection label="Likes & interests" values={member.preferences} emptyText="No shared interests yet." />
        <ReadOnlyPreferenceSection label="No-gos & dislikes" values={member.dislikes} emptyText="No shared no-gos." tone="warning" />
        <ReadOnlyPreferenceSection label="Budget" values={member.budgetRange ? [member.budgetRange] : []} emptyText="Budget not shared." />
        <ReadOnlyPreferenceSection label="Mobility" values={member.mobilityLevel ? [member.mobilityLevel] : []} emptyText="Mobility not shared." tone="teal" />
        <ReadOnlyPreferenceSection label="Dietary needs" values={member.dietaryNeeds} emptyText="No dietary needs shared." />
      </div>
    </motion.div>
  );
};

const ReadOnlyPreferenceSection = ({
  label,
  values,
  emptyText,
  tone = "neutral",
}: {
  label: string;
  values: string[];
  emptyText: string;
  tone?: "neutral" | "warning" | "teal";
}) => (
  <section className="bg-card rounded-2xl p-4 shadow-card">
    <p className="font-heading font-bold text-sm mb-3">{label}</p>
    {values.length ? <DisplayChips items={values} tone={tone} /> : <p className="text-sm text-muted-foreground">{emptyText}</p>}
  </section>
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
                  isAI ? "bg-teal text-primary-foreground" : "bg-coral-light"
                }`}>
                  {isAI ? <Bot size={14} /> : isSelf ? "YO" : m.memberName.slice(0, 2).toUpperCase()}
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
                        ? "bg-teal-light text-foreground rounded-bl-sm"
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
