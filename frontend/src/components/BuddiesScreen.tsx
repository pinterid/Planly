import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Info,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { suggestedGroups, SuggestedGroup, travelers, TravelerProfile } from "@/data/mockData";
import { addGroup, addMatch, getGroups, getMatches, getProfile, saveGroups } from "@/data/profileStore";
import { toast } from "sonner";

type Status = "new" | "matched" | "rejected" | "blocked";
type GroupStatus = "rejected";
type View = "list" | "preview" | "feedback" | "matched" | "group-created" | "group-preview" | "group-request";

interface BuddiesScreenProps {
  onOpenGroup?: (id: string) => void;
}

interface BuddyDetails {
  languages: string[];
  interests: string[];
  styles: string[];
  duration: string;
  reason: string;
  why: string;
  conflicts: string[];
  verified: boolean;
}

interface EnrichedTraveler extends TravelerProfile {
  details: BuddyDetails;
  score: number;
}

const BUDDY_DETAILS: Record<string, BuddyDetails> = {
  "1": {
    languages: ["English", "German"],
    interests: ["Local food", "Museums", "Walking tours"],
    styles: ["Culture", "Good Food", "Flexible pace"],
    duration: "4-6 days",
    reason: "Strong overlap on culture, food and city trips.",
    why: "You both prefer culture trips, similar travel duration and flexible budgets.",
    conflicts: ["Anna likes busy food markets."],
    verified: true,
  },
  "2": {
    languages: ["English", "German", "Spanish"],
    interests: ["History", "Architecture", "Coffee spots"],
    styles: ["Culture", "History", "Budget aware"],
    duration: "3-5 days",
    reason: "Good fit for culture-heavy weekends.",
    why: "You both like structured city trips, walking tours and moderate budgets.",
    conflicts: ["Max prefers early planning over spontaneous changes."],
    verified: true,
  },
  "3": {
    languages: ["English", "French"],
    interests: ["Beach", "Yoga", "Design shops"],
    styles: ["Relaxation", "Beach", "Slow travel"],
    duration: "5-7 days",
    reason: "Relaxed travel pace with overlapping warm-weather interests.",
    why: "You both prefer low-stress trips, warm destinations and flexible daily plans.",
    conflicts: ["Lisa avoids packed nightlife schedules."],
    verified: false,
  },
  "4": {
    languages: ["German", "English"],
    interests: ["Nature", "Family activities", "Outdoor breaks"],
    styles: ["Family", "Nature", "Accessible planning"],
    duration: "6-8 days",
    reason: "Best for calm, well-organized group trips.",
    why: "You both value clear plans, accessible activities and realistic budgets.",
    conflicts: ["Markus needs kid-friendly accommodation options."],
    verified: false,
  },
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getDetails = (traveler: TravelerProfile) => BUDDY_DETAILS[traveler.id] ?? BUDDY_DETAILS["1"];

const compatibility = (traveler: TravelerProfile): number => {
  const profile = getProfile();
  const details = getDetails(traveler);
  const profileStyles = [...(profile.travelStyle ?? []), ...(profile.activityInterests ?? [])].map((item) =>
    item.toLowerCase()
  );
  const overlap = details.styles.filter((style) =>
    profileStyles.some(
      (profileStyle) => profileStyle.includes(style.toLowerCase()) || style.toLowerCase().includes(profileStyle)
    )
  ).length;

  const base = 72 + (traveler.id.charCodeAt(0) % 8);
  return Math.min(96, base + overlap * 5);
};

const addBuddyToGroup = (groupId: string, traveler: EnrichedTraveler) => {
  const groups = getGroups();
  const target = groups.find((group) => group.id === groupId);
  if (!target || target.members.some((member) => member.memberId === traveler.id)) return;

  target.members.push({
    memberId: traveler.id,
    memberName: traveler.name,
    preferences: [...traveler.details.styles, ...traveler.details.interests].slice(0, 5),
    dislikes: traveler.details.conflicts,
    budgetRange: traveler.budget,
    mobilityLevel: "No restrictions",
    dietaryNeeds: [],
  });
  saveGroups(groups);
};

const BuddiesScreen = ({ onOpenGroup }: BuddiesScreenProps) => {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() => {
    const initial: Record<string, Status> = {};
    getMatches().forEach((id) => {
      initial[id] = "matched";
    });
    return initial;
  });
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [feedbackName, setFeedbackName] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ id: string; buddyName: string } | null>(null);
  const [groupRequest, setGroupRequest] = useState<{ accepted: boolean; groupName: string; groupId?: string } | null>(null);
  const [groupStatuses, setGroupStatuses] = useState<Record<string, GroupStatus>>({});

  const enriched = useMemo<EnrichedTraveler[]>(
    () =>
      travelers.map((traveler) => ({
        ...traveler,
        details: getDetails(traveler),
        score: compatibility(traveler),
      })),
    []
  );

  const selected = enriched.find((traveler) => traveler.id === selectedId) ?? null;
  const selectedGroup = suggestedGroups.find((group) => group.id === selectedGroupId) ?? null;
  const matchedTravelers = enriched.filter((traveler) => statuses[traveler.id] === "matched");
  const suggestedTravelers = enriched.filter((traveler) => {
    const status = statuses[traveler.id] ?? "new";
    return status !== "matched" && status !== "rejected" && status !== "blocked";
  });
  const visibleSuggestedGroups = suggestedGroups.filter((group) => groupStatuses[group.id] !== "rejected");

  const backToList = () => {
    setView("list");
    setSelectedId(null);
    setSelectedGroupId(null);
    setFeedbackName(null);
  };

  const openProfile = (traveler: EnrichedTraveler) => {
    setSelectedId(traveler.id);
    setView("preview");
  };

  const rejectTraveler = (traveler: EnrichedTraveler) => {
    setStatuses((current) => ({ ...current, [traveler.id]: "rejected" }));
    setFeedbackName(traveler.name);
    setView("feedback");
  };

  const blockTraveler = (traveler: EnrichedTraveler) => {
    setStatuses((current) => ({ ...current, [traveler.id]: "blocked" }));
    toast("Profile blocked", {
      description: `${traveler.name} will not appear in your suggestions.`,
    });
    backToList();
  };

  const showMutualMatch = (traveler: EnrichedTraveler) => {
    setStatuses((current) => ({ ...current, [traveler.id]: "matched" }));
    addMatch(traveler.id);
    setSelectedId(traveler.id);
    setView("matched");
  };

  const startGroup = (traveler: EnrichedTraveler) => {
    const group = addGroup(`Trip with ${traveler.name}`);
    addBuddyToGroup(group.id, traveler);
    setCreatedGroup({ id: group.id, buddyName: traveler.name });
    setView("group-created");
  };

  const openGroupPreview = (group: SuggestedGroup) => {
    setSelectedGroupId(group.id);
    setView("group-preview");
  };

  const rejectGroup = (group: SuggestedGroup) => {
    setGroupStatuses((current) => ({ ...current, [group.id]: "rejected" }));
    setFeedbackName(group.name);
    setView("feedback");
  };

  const requestToJoinGroup = (group: SuggestedGroup) => {
    if (group.id === "sg1") {
      const created = addGroup(group.name);
      const allGroups = getGroups();
      const target = allGroups.find((item) => item.id === created.id);
      if (target) {
        target.members = [
          ...target.members,
          ...group.memberPreviewNames.map((name, index) => ({
            memberId: `${group.id}-${index}`,
            memberName: name,
            preferences: [...group.destinationInterests, ...group.travelStyle],
            dislikes: group.possibleConflicts,
            budgetRange: "",
            mobilityLevel: "No restrictions",
            dietaryNeeds: [],
          })),
        ];
        saveGroups(allGroups);
      }
      setGroupRequest({ accepted: true, groupName: group.name, groupId: created.id });
      setView("group-request");
      return;
    }

    setGroupRequest({ accepted: false, groupName: group.name });
    setView("group-request");
  };

  if (view === "feedback" && feedbackName) {
    return (
      <ScreenFrame onBack={backToList}>
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <X size={20} className="text-destructive" />
          </div>
          <h2 className="font-heading text-xl font-extrabold mb-2">Planly will show different suggestions.</h2>
          <p className="text-sm text-muted-foreground leading-6">
            {feedbackName} has been removed from this round.
          </p>
          <button
            onClick={backToList}
            className="w-full mt-5 py-3 rounded-2xl bg-foreground text-primary-foreground font-heading font-bold"
          >
            Keep browsing
          </button>
        </div>
      </ScreenFrame>
    );
  }

  if (view === "matched" && selected) {
    return (
      <ScreenFrame onBack={() => setView("preview")}>
        <div className="bg-card rounded-2xl p-5 shadow-card text-center">
          <Avatar name={selected.name} size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-teal font-bold mb-1">Mutual interest</p>
          <h2 className="font-heading text-2xl font-extrabold mb-2">You matched with {selected.name}.</h2>
          <p className="text-sm text-muted-foreground leading-6 mb-5">
            You can now start a travel group together.
          </p>
          <button
            onClick={() => startGroup(selected)}
            className="w-full py-3.5 rounded-2xl gradient-coral text-primary-foreground font-heading font-bold shadow-card"
          >
            Start group
          </button>
          <button onClick={backToList} className="w-full mt-2 py-3 rounded-2xl bg-secondary text-foreground font-heading font-bold">
            Keep browsing
          </button>
        </div>
      </ScreenFrame>
    );
  }

  if (view === "group-created" && createdGroup) {
    return (
      <ScreenFrame onBack={backToList}>
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal flex items-center justify-center mb-4">
            <Users size={22} />
          </div>
          <h2 className="font-heading text-2xl font-extrabold mb-2">New group created.</h2>
          <p className="text-sm text-muted-foreground leading-6">
            {createdGroup.buddyName} has been added as your first travel buddy.
          </p>
          <div className="mt-4 rounded-2xl bg-secondary p-4">
            <p className="text-sm font-heading font-bold">2 members · Ready to plan</p>
          </div>
          <button
            onClick={() => onOpenGroup?.(createdGroup.id)}
            className="w-full mt-5 py-3.5 rounded-2xl bg-foreground text-primary-foreground font-heading font-bold shadow-card"
          >
            Open group
          </button>
        </div>
      </ScreenFrame>
    );
  }

  if (view === "group-preview" && selectedGroup) {
    return (
      <ScreenFrame onBack={backToList}>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-extrabold">{selectedGroup.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedGroup.currentMembers} of {selectedGroup.desiredGroupSize} members
          </p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Group compatibility</p>
              <h2 className="font-heading text-xl font-extrabold mt-1">{selectedGroup.compatibility}% match</h2>
            </div>
            <CompatibilityBadge score={selectedGroup.compatibility} />
          </div>

          <Section title="Destination interests" className="mt-5">
            <ChipList items={selectedGroup.destinationInterests} tone="teal" />
          </Section>

          <Section title="Travel style">
            <ChipList items={selectedGroup.travelStyle} tone="default" />
          </Section>

          <Section title="Members preview">
            <p className="text-sm text-muted-foreground">{selectedGroup.memberPreviewNames.join(", ")}</p>
          </Section>

          {selectedGroup.possibleConflicts.length > 0 && (
            <Section title="Possible conflicts">
              <ul className="space-y-1.5">
                {selectedGroup.possibleConflicts.map((conflict) => (
                  <li key={conflict} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info size={14} className="text-amber mt-0.5 shrink-0" />
                    {conflict}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div className="bg-teal-light rounded-2xl p-4 mb-4">
          <p className="font-heading font-extrabold text-teal mb-1">Why this group?</p>
          <p className="text-sm text-foreground leading-6">{selectedGroup.why}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => rejectGroup(selectedGroup)}
            className="py-3 rounded-2xl bg-white border border-border text-destructive font-heading font-bold text-sm flex items-center justify-center gap-1"
          >
            <X size={16} /> Not for me
          </button>
          <button
            onClick={() => requestToJoinGroup(selectedGroup)}
            className="w-full py-3.5 rounded-2xl gradient-coral text-primary-foreground font-heading font-bold shadow-card"
          >
            Request to join
          </button>
        </div>
      </ScreenFrame>
    );
  }

  if (view === "group-request" && groupRequest) {
    return (
      <ScreenFrame onBack={backToList}>
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal flex items-center justify-center mb-4">
            <Users size={22} />
          </div>
          <h2 className="font-heading text-2xl font-extrabold mb-2">
            {groupRequest.accepted ? "Request accepted." : "Request sent."}
          </h2>
          <p className="text-sm text-muted-foreground leading-6">
            {groupRequest.accepted
              ? `${groupRequest.groupName} is now available in your groups.`
              : "The group will review your travel profile."}
          </p>
          {groupRequest.accepted && groupRequest.groupId && (
            <button
              onClick={() => onOpenGroup?.(groupRequest.groupId)}
              className="w-full mt-5 py-3.5 rounded-2xl bg-foreground text-primary-foreground font-heading font-bold shadow-card"
            >
              Open group
            </button>
          )}
          <button
            onClick={backToList}
            className="w-full mt-2 py-3 rounded-2xl bg-secondary text-foreground font-heading font-bold"
          >
            Back to buddies
          </button>
        </div>
      </ScreenFrame>
    );
  }

  if (view === "preview" && selected) {
    const status = statuses[selected.id] ?? "new";
    return (
      <ScreenFrame onBack={backToList}>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-extrabold">{selected.name}'s travel profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Shared preferences used for matching.</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={selected.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-extrabold">
                  {selected.name}, {selected.age}
                </h2>
                {selected.details.verified && <VerifiedPill />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.details.duration} - {selected.destination}
              </p>
            </div>
            <CompatibilityBadge score={selected.score} />
          </div>

          <Section title="Shared preferences" className="mt-5">
            <ChipList items={selected.details.styles} tone="teal" />
          </Section>

          <Section title="Possible conflicts">
            <ul className="space-y-1.5">
              {selected.details.conflicts.map((conflict) => (
                <li key={conflict} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info size={14} className="text-amber mt-0.5 shrink-0" />
                  {conflict}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="bg-teal-light rounded-2xl p-4 mb-4">
          <p className="font-heading font-extrabold text-teal mb-1">Why this match?</p>
          <p className="text-sm text-foreground leading-6">{selected.details.why}</p>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
          <div className="flex gap-3">
            <ShieldCheck size={20} className="text-teal shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-5">
              Compatibility helps with planning, but does not guarantee real-life trust or safety.
            </p>
          </div>
        </div>

        {status === "matched" ? (
          <button
            onClick={() => setView("matched")}
            className="w-full py-3.5 rounded-2xl gradient-coral text-primary-foreground font-heading font-bold shadow-card"
          >
            Continue match
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => rejectTraveler(selected)}
              className="py-3 rounded-2xl bg-white border border-border text-destructive font-heading font-bold text-sm flex items-center justify-center gap-1"
            >
              <X size={16} /> Not for me
            </button>
            <button
              onClick={() => showMutualMatch(selected)}
              className="w-full py-3.5 rounded-2xl gradient-coral text-primary-foreground font-heading font-bold shadow-card flex items-center justify-center gap-2"
            >
              <Heart size={16} fill="currentColor" /> Interested
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 mt-5">
          <button
            onClick={() => {
              toast("Report noted", {
                description: "This prototype records the safety action locally for this session.",
              });
            }}
            className="text-xs text-muted-foreground font-semibold flex items-center gap-1"
          >
            <Flag size={13} /> Report
          </button>
          <button
            onClick={() => blockTraveler(selected)}
            className="text-xs text-muted-foreground font-semibold flex items-center gap-1"
          >
            <Ban size={13} /> Block
          </button>
        </div>
      </ScreenFrame>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-4">
      <div className="mb-5">
        <h1 className="font-heading text-2xl font-extrabold">Find travel buddies</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover people with similar travel preferences.</p>
      </div>

      {matchedTravelers.length > 0 && (
        <section className="mb-5">
          <h2 className="font-heading text-lg font-extrabold mb-3">Your matches</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {matchedTravelers.map((traveler) => (
              <CompactMatchCard
                key={traveler.id}
                traveler={traveler}
                onViewProfile={() => openProfile(traveler)}
                onStartGroup={() => startGroup(traveler)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-5">
        <h2 className="font-heading text-lg font-extrabold mb-3">Suggested groups</h2>
        <div className="space-y-3">
          {visibleSuggestedGroups.map((group) => (
            <SuggestedGroupCard
              key={group.id}
              group={group}
              onView={() => openGroupPreview(group)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-extrabold mb-3">Suggested travel buddies</h2>
        <AnimatePresence>
          <div className="space-y-3">
            {suggestedTravelers.map((traveler) => {
              return (
                <BuddyCard
                  key={traveler.id}
                  traveler={traveler}
                  onOpen={() => openProfile(traveler)}
                />
              );
            })}
          </div>
        </AnimatePresence>
      </section>

      {suggestedTravelers.length === 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-card text-center text-sm text-muted-foreground">
          No more compatible profiles in this prototype round.
        </div>
      )}
    </motion.div>
  );
};

const SuggestedGroupCard = ({
  group,
  onView,
}: {
  group: SuggestedGroup;
  onView: () => void;
}) => (
  <div className="bg-card rounded-2xl p-4 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-heading font-extrabold">{group.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {group.currentMembers} of {group.desiredGroupSize} members
        </p>
      </div>
      <CompatibilityBadge score={group.compatibility} />
    </div>

    <ChipList items={[...group.destinationInterests, ...group.travelStyle].slice(0, 5)} tone="teal" className="mt-3" />

    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={onView}
        className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-sm flex items-center justify-center gap-1.5"
      >
        View Group <ChevronRight size={15} />
      </button>
    </div>
  </div>
);

const BuddyCard = ({
  traveler,
  onOpen,
}: {
  traveler: EnrichedTraveler;
  onOpen: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    className="bg-card rounded-2xl p-4 shadow-card"
  >
    <div className="flex items-start gap-3">
      <Avatar name={traveler.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold">
                {traveler.name}, {traveler.age}
              </h2>
              {traveler.details.verified && <VerifiedPill />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{traveler.details.languages.join(", ")}</p>
          </div>
          <CompatibilityBadge score={traveler.score} />
        </div>
        <ChipList
          items={[...traveler.destinationInterests.slice(0, 2), ...traveler.details.interests.slice(0, 2)]}
          tone="teal"
          className="mt-3"
        />
      </div>
    </div>

    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={onOpen}
        className="flex-1 py-2.5 rounded-2xl bg-foreground text-primary-foreground font-heading font-bold text-sm flex items-center justify-center gap-1.5"
      >
        View profile <ChevronRight size={15} />
      </button>
    </div>
  </motion.div>
);

const CompactMatchCard = ({
  traveler,
  onViewProfile,
  onStartGroup,
}: {
  traveler: EnrichedTraveler;
  onViewProfile: () => void;
  onStartGroup: () => void;
}) => (
  <div className="min-w-[5.75rem] bg-card rounded-2xl p-3 shadow-card">
    <button
      onClick={onViewProfile}
      className="w-full flex flex-col items-center gap-2 text-center"
      aria-label={`Open ${traveler.name}'s profile`}
    >
      <Avatar name={traveler.name} />
      <span className="w-full truncate text-xs font-heading font-extrabold">{traveler.name}</span>
    </button>
    <button
      onClick={onStartGroup}
      className="mx-auto mt-2 w-8 h-8 rounded-full gradient-coral text-primary-foreground flex items-center justify-center shadow-card"
      aria-label={`Start group with ${traveler.name}`}
    >
      <Plus size={14} />
    </button>
  </div>
);

const ScreenFrame = ({ children, onBack }: { children: React.ReactNode; onBack: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-4 pb-4">
    <button onClick={onBack} className="text-sm text-teal font-bold mb-4 flex items-center gap-1">
      <ChevronLeft size={16} /> Back
    </button>
    {children}
  </motion.div>
);

const Avatar = ({ name, size = "md", className = "" }: { name: string; size?: "md" | "lg"; className?: string }) => (
  <div
    className={`${size === "lg" ? "w-20 h-20 text-xl" : "w-14 h-14 text-base"} rounded-2xl bg-foreground text-primary-foreground flex items-center justify-center font-heading font-extrabold shrink-0 ${className}`}
  >
    {getInitials(name)}
  </div>
);

const CompatibilityBadge = ({ score }: { score: number }) => (
  <div className="text-right shrink-0">
    <div className="inline-flex items-center gap-1 rounded-full bg-teal-light text-teal px-2.5 py-1 text-xs font-extrabold">
      <CheckCircle2 size={12} /> {score}%
    </div>
    <p className="text-[10px] text-muted-foreground mt-1">compatibility</p>
  </div>
);

const VerifiedPill = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-teal-light text-teal px-2 py-0.5 text-[10px] font-extrabold">
    <ShieldCheck size={10} /> Verified
  </span>
);

const Section = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`mt-4 ${className}`}>
    <p className="text-xs text-muted-foreground font-bold mb-2">{title}</p>
    {children}
  </div>
);

const ChipList = ({
  items,
  tone,
  className = "",
}: {
  items: string[];
  tone: "teal" | "default";
  className?: string;
}) => (
  <div className={`flex flex-wrap gap-1.5 ${className}`}>
    {items.map((item) => (
      <span
        key={item}
        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          tone === "teal" ? "bg-teal-light text-teal" : "bg-secondary text-foreground"
        }`}
      >
        {item}
      </span>
    ))}
  </div>
);

export default BuddiesScreen;
