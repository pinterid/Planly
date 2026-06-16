import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import {
  Accessibility,
  AlertTriangle,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleUserRound,
  Database,
  Eye,
  EyeOff,
  Heart,
  Lock,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  ACTIVITY_OPTIONS,
  DIETARY_OPTIONS,
  DISABILITY_OPTIONS,
  FEAR_OPTIONS,
  LANGUAGE_OPTIONS,
  MOBILITY_OPTIONS,
  NOGO_OPTIONS,
  TEMPERATURE_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  UserProfile,
  getProfile,
  saveProfile,
} from "@/data/profileStore";
import { toast } from "sonner";

interface ProfileScreenProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
  onSignOut?: () => void;
}

type EditSection = "basic" | "travel" | "interests" | "nogos" | "comfort" | "visibility";
type Visibility = "Shared with matches" | "Used for suggestions" | "Private";

const requiredChecks = [
  { key: "name", label: "Name", isComplete: (p: UserProfile) => p.name.trim().length > 0 },
  { key: "age", label: "Age", isComplete: (p: UserProfile) => p.age > 0 },
  { key: "languages", label: "Languages", isComplete: (p: UserProfile) => p.languages.length > 0 },
  { key: "budget", label: "Budget range", isComplete: (p: UserProfile) => p.budgetRange.trim().length > 0 },
  { key: "duration", label: "Travel duration", isComplete: (p: UserProfile) => p.duration.trim().length > 0 },
  { key: "style", label: "Travel style", isComplete: (p: UserProfile) => p.travelStyle.length > 0 },
  { key: "interests", label: "Interests", isComplete: (p: UserProfile) => p.activityInterests.length > 0 },
];

const basicInfoKeys = new Set(["name", "age", "languages"]);

const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

const ProfileScreen = ({ isOnboarding = false, onComplete, onSignOut }: ProfileScreenProps) => {
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [activeEdit, setActiveEdit] = useState<EditSection | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [step, setStep] = useState(0);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      saveProfile(next);
      return next;
    });
  };

  const toggleInArray = (field: keyof UserProfile, value: string) => {
    const current = profile[field];
    if (!Array.isArray(current)) return;
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    updateProfile({ [field]: next } as Partial<UserProfile>);
  };

  const addCustomItem = (field: keyof UserProfile) => {
    const value = customValue.trim();
    const current = profile[field];
    if (!value || !Array.isArray(current)) return;
    if (!current.some((item) => item.toLowerCase() === value.toLowerCase())) {
      updateProfile({ [field]: [...current, value] } as Partial<UserProfile>);
    }
    setCustomValue("");
  };

  const missingFields = useMemo(
    () => requiredChecks.filter((check) => !check.isComplete(profile)).map((check) => check.label),
    [profile]
  );
  const completeness = Math.round(((requiredChecks.length - missingFields.length) / requiredChecks.length) * 100);
  const isComplete = missingFields.length === 0;

  const profileSummary = [
    profile.age > 0 ? `Age ${profile.age}` : "Age missing",
    profile.languages.length ? profile.languages.slice(0, 2).join(", ") : "Languages missing",
    profile.travelStyle.length ? profile.travelStyle.slice(0, 2).join(", ") : "Style missing",
  ].join(" · ");

  if (isOnboarding) {
    return (
      <OnboardingProfile
        profile={profile}
        step={step}
        setStep={setStep}
        updateProfile={updateProfile}
        toggleInArray={toggleInArray}
        addCustomItem={addCustomItem}
        customValue={customValue}
        setCustomValue={setCustomValue}
        onComplete={() => {
          const next = { ...profile, onboardingComplete: true };
          saveProfile(next);
          setProfile(next);
          toast.success("Welcome to Planly");
          onComplete?.();
        }}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={profile.name} />
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-extrabold truncate">{profile.name || "Set your name"}</h1>
            <p className="text-xs text-muted-foreground truncate">{profileSummary}</p>
            <PrivacyNote />
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-2xl bg-white border border-border shadow-card flex items-center justify-center text-foreground"
          aria-label="Open profile settings"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <CompletenessCard
          completeness={completeness}
          isComplete={isComplete}
          missingFields={missingFields}
          onEdit={() => setActiveEdit("basic")}
        />

        {/* <VerifyProfileCard /> */}

        {/* <PublicProfilePreviewCard
          onPreview={() => setPreviewOpen(true)}
        /> */}

        <ProfileSectionCard
          icon={<User size={18} />}
          title="Basic information"
          required
          visibility="Shared with matches"
          rows={[
            ["Name", profile.name || "Missing"],
            ["Age", profile.age > 0 ? String(profile.age) : "Missing"],
            ["Languages", profile.languages.length ? profile.languages.join(", ") : "Missing"],
          ]}
          isMissing={!profile.name || profile.age <= 0 || profile.languages.length === 0}
          onEdit={() => setActiveEdit("basic")}
        />

        <ProfileSectionCard
          icon={<SlidersHorizontal size={18} />}
          title="Travel style & budget"
          required
          visibility="Shared with matches"
          rows={[
            ["Budget", profile.budgetRange || "Not set"],
            ["Travel duration", profile.duration || "Not set"],
            ["Travel style", profile.travelStyle.length ? profile.travelStyle.join(", ") : "Missing"],
            ["Preferred weather", profile.preferredTemperature || "Not set"],
          ]}
          isMissing={!profile.budgetRange || !profile.duration || profile.travelStyle.length === 0}
          onEdit={() => setActiveEdit("travel")}
        />

        <ProfileSectionCard
          icon={<Heart size={18} />}
          title="Interests"
          required
          visibility="Shared with matches"
          chips={profile.activityInterests}
          emptyText="Add at least one travel interest."
          isMissing={profile.activityInterests.length === 0}
          onEdit={() => setActiveEdit("interests")}
        />

        <ProfileSectionCard
          icon={<AlertTriangle size={18} />}
          title="No-gos"
          visibility="Used for suggestions"
          chips={profile.noGos}
          emptyText="No no-gos added."
          helperText="No-gos are treated as strong constraints in suggestions."
          onEdit={() => setActiveEdit("nogos")}
        />

        <ProfileSectionCard
          icon={<Accessibility size={18} />}
          title="Health, accessibility & comfort"
          visibility="Private"
          chips={[
            ...profile.disabilities,
            ...profile.fears,
            profile.mobilityLevel !== "No restrictions" ? profile.mobilityLevel : "",
            ...profile.dietaryNeeds,
          ].filter(Boolean)}
          emptyText="No private comfort details added."
          helperText="These details stay private and are only used to improve suggestions unless you choose to share them."
          onEdit={() => setActiveEdit("comfort")}
        />

        <DataAiCard
          onManage={() => setActiveEdit("visibility")}
          onPreview={() => setPreviewOpen(true)}
        />
      </div>

      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onSignOut={onSignOut}
          onReset={() => {
            window.localStorage.clear();
            window.location.reload();
          }}
        />
      )}

      {previewOpen && (
        <PublicProfileModal
          profile={profile}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {activeEdit && (
        <EditSheet
          section={activeEdit}
          profile={profile}
          customValue={customValue}
          setCustomValue={setCustomValue}
          updateProfile={updateProfile}
          toggleInArray={toggleInArray}
          addCustomItem={addCustomItem}
          onClose={() => {
            setCustomValue("");
            setActiveEdit(null);
            toast.success("Preferences saved");
          }}
          onPreview={() => setPreviewOpen(true)}
        />
      )}
    </div>
  );
};

const Avatar = ({ name }: { name: string }) => (
  <div className="w-16 h-16 rounded-[1.65rem] bg-coral-light text-primary flex items-center justify-center shadow-card border border-white">
    {name ? (
      <span className="font-heading text-xl font-extrabold">{initialsFor(name)}</span>
    ) : (
      <CircleUserRound size={28} />
    )}
  </div>
);

const PrivacyNote = () => (
  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-light px-2 py-0.5 text-[11px] font-semibold text-teal">
    <ShieldCheck size={12} />
    Private by default
  </div>
);

const VisibilityBadge = ({ value }: { value: Visibility }) => {
  const classes = {
    "Shared with matches": "bg-coral-light text-primary",
    "Used for suggestions": "bg-teal-light text-teal",
    Private: "bg-secondary text-muted-foreground",
  };
  const Icon = value === "Private" ? Lock : value === "Used for suggestions" ? BrainCircuit : Eye;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${classes[value]}`}>
      <Icon size={12} />
      {value}
    </span>
  );
};

const CompletenessCard = ({
  completeness,
  isComplete,
  missingFields,
  onEdit,
}: {
  completeness: number;
  isComplete: boolean;
  missingFields: string[];
  onEdit: () => void;
}) => (
  <section className={`bg-card rounded-2xl p-4 shadow-card ${isComplete ? "flex items-center gap-3" : ""}`}>
    {isComplete && (
      <div className="w-10 h-10 rounded-2xl bg-teal-light text-teal flex items-center justify-center">
        <Check size={18} />
      </div>
    )}
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-heading font-bold">{isComplete ? "Profile complete" : "Profile completeness"}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isComplete
            ? "Your profile is ready for better matches and group suggestions."
            : "A few details are still missing before Planly can suggest good matches."}
        </p>
      </div>
      {!isComplete && (
        <div className="text-right">
          <p className="font-heading text-2xl font-extrabold text-primary">{completeness}%</p>
          <button onClick={onEdit} className="text-xs font-semibold text-primary">Review</button>
        </div>
      )}
    </div>
    {!isComplete && (
      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${completeness}%` }} />
      </div>
    )}
    {!isComplete && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {missingFields.map((field) => (
          <span key={field} className="rounded-full bg-warning-light px-2 py-1 text-[11px] font-semibold text-warning">
            {field}
          </span>
        ))}
      </div>
    )}
  </section>
);

// const VerifyProfileCard = () => (
//   <section className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
//     <div className="w-10 h-10 rounded-2xl bg-teal-light text-teal flex items-center justify-center">
//       <ShieldCheck size={18} />
//     </div>
//     <div className="flex-1 min-w-0">
//       <p className="font-heading font-bold text-sm">Verification</p>
//       <p className="text-xs text-muted-foreground">Prototype verification for future trust features.</p>
//     </div>
//     <button
//       onClick={() => toast.success("Verification request saved")}
//       className="rounded-full bg-secondary px-3 py-2 text-xs font-heading font-bold text-secondary-foreground"
//     >
//       Verify
//     </button>
//   </section>
// );

const PublicProfilePreviewCard = ({ onPreview }: { onPreview: () => void }) => (
  <section className="bg-card rounded-2xl p-4 shadow-card">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-teal-light text-teal flex items-center justify-center">
        <Eye size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm">Public profile preview</p>
        <p className="text-xs text-muted-foreground">See what others can see.</p>
      </div>
    </div>
    <button
      onClick={onPreview}
      className="mt-3 w-full rounded-2xl bg-secondary px-3 py-2.5 text-xs font-heading font-bold text-secondary-foreground"
    >
      Preview public profile
    </button>
  </section>
);

const ProfileSectionCard = ({
  icon,
  title,
  required,
  visibility,
  rows,
  chips,
  emptyText,
  helperText,
  isMissing,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  required?: boolean;
  visibility: Visibility;
  rows?: [string, string][];
  chips?: string[];
  emptyText?: string;
  helperText?: string;
  isMissing?: boolean;
  onEdit: () => void;
}) => (
  <section className={`bg-card rounded-2xl p-4 shadow-card ${isMissing ? "ring-1 ring-warning" : ""}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-coral-light text-primary flex items-center justify-center">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-heading font-bold">{title}</p>
            {required && <span className="text-[10px] font-bold text-muted-foreground">Required</span>}
          </div>
          <div className="mt-1">
            <VisibilityBadge value={visibility} />
          </div>
        </div>
      </div>
      <button onClick={onEdit} className="text-sm font-semibold text-primary">Edit</button>
    </div>
    {rows && (
      <div className="mt-4 flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-semibold text-right ${value === "Missing" || value === "Not set" ? "text-warning" : "text-foreground"}`}>{value}</span>
          </div>
        ))}
      </div>
    )}
    {chips && (
      <div className="mt-4">
        {chips.length ? <ChipList items={chips} /> : <p className="text-sm text-muted-foreground">{emptyText}</p>}
      </div>
    )}
    {helperText && <p className="mt-3 text-xs leading-5 text-muted-foreground">{helperText}</p>}
  </section>
);

const DataAiCard = ({ onManage, onPreview }: { onManage: () => void; onPreview: () => void }) => (
  <section className="bg-card rounded-2xl p-4 shadow-card">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-2xl bg-teal-light text-teal flex items-center justify-center">
        <BrainCircuit size={18} />
      </div>
      <div className="flex-1">
        <p className="font-heading font-bold">Data & AI</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Only relevant preferences are used for matching and group suggestions. Sensitive details stay private by default.
        </p>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button onClick={onManage} className="rounded-2xl bg-primary py-3 text-sm font-heading font-bold text-primary-foreground">
        Privacy details
      </button>
      <button onClick={onPreview} className="rounded-2xl bg-secondary py-3 text-sm font-heading font-bold text-secondary-foreground">
        Preview public profile
      </button>
    </div>
  </section>
);

const ChipList = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <span key={item} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
        {item}
      </span>
    ))}
  </div>
);

const SettingsSheet = ({ onClose, onSignOut, onReset }: { onClose: () => void; onSignOut?: () => void; onReset: () => void }) => {
  const rows = [
    { label: "Account", icon: User },
    { label: "Notifications", icon: Bell },
    { label: "Privacy", icon: Lock },
    { label: "Data & AI", icon: Database },
    { label: "Verification", icon: ShieldCheck, onClick: () => toast.success("Verification request saved") },
  ];
  return (
    <SheetFrame title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <button key={row.label} onClick={row.onClick} className="w-full rounded-2xl bg-secondary p-4 text-left flex items-center gap-3">
            <row.icon size={18} className="text-teal" />
            <span className="font-heading font-semibold text-sm">{row.label}</span>
            <ChevronRight size={16} className="ml-auto text-muted-foreground" />
          </button>
        ))}
        <button
          onClick={onReset}
          className="w-full rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left"
        >
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle size={18} />
            <span className="font-heading font-semibold text-sm">Reset prototype data</span>
          </div>
          <p className="mt-1 pl-7 text-xs leading-5 text-muted-foreground">
            Clears local profile, matches and groups on this device.
          </p>
        </button>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full rounded-2xl bg-destructive p-4 text-left flex items-center gap-3 text-destructive-foreground"
          >
            <LogOut size={18} />
            <span className="font-heading font-semibold text-sm">Log out</span>
          </button>
        )}
      </div>
    </SheetFrame>
  );
};

const PublicProfileModal = ({ profile, onClose }: { profile: UserProfile; onClose: () => void }) => (
  <SheetFrame title="Public profile preview" onClose={onClose}>
    <div className="bg-secondary rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Avatar name={profile.name} />
        <div>
          <p className="font-heading font-bold">{profile.name || "Name not set"}</p>
          <p className="text-sm text-muted-foreground">{profile.age > 0 ? `Age ${profile.age}` : "Age not set"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <PreviewRow label="Languages" value={profile.languages.join(", ") || "Not shared yet"} />
        <PreviewRow label="Travel style" value={profile.travelStyle.join(", ") || "Not shared yet"} />
        <PreviewRow label="Shared interests" value={profile.activityInterests.join(", ") || "Not shared yet"} />
      </div>
    </div>
    <div className="mt-4 rounded-2xl bg-teal-light p-4">
      <div className="flex items-start gap-2">
        <EyeOff size={17} className="text-teal mt-0.5" />
        <p className="text-sm leading-6 text-foreground">
          Budget details, no-gos, health, accessibility and sensitive preferences stay private by default.
        </p>
      </div>
    </div>
  </SheetFrame>
);

const PreviewRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
    <p className="text-sm font-heading font-semibold">{value}</p>
  </div>
);

const EditSheet = ({
  section,
  profile,
  customValue,
  setCustomValue,
  updateProfile,
  toggleInArray,
  addCustomItem,
  onClose,
  onPreview,
}: {
  section: EditSection;
  profile: UserProfile;
  customValue: string;
  setCustomValue: (value: string) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  toggleInArray: (field: keyof UserProfile, value: string) => void;
  addCustomItem: (field: keyof UserProfile) => void;
  onClose: () => void;
  onPreview: () => void;
}) => {
  const title = {
    basic: "Edit basic information",
    travel: "Edit travel style & budget",
    interests: "Edit interests",
    nogos: "Edit no-gos",
    comfort: "Edit health, accessibility & comfort",
    visibility: "Privacy details",
  }[section];

  return (
    <SheetFrame title={title} onClose={onClose}>
      {section === "basic" && (
        <div className="flex flex-col gap-4">
          <TextField label="Name" value={profile.name} onChange={(value) => updateProfile({ name: value })} />
          <TextField label="Age" type="number" value={String(profile.age || "")} onChange={(value) => updateProfile({ age: parseInt(value, 10) || 0 })} />
          <ChipEditor
            label="Languages"
            options={LANGUAGE_OPTIONS}
            selected={profile.languages}
            onToggle={(value) => toggleInArray("languages", value)}
            customValue={customValue}
            onCustomChange={setCustomValue}
            onCustomAdd={() => addCustomItem("languages")}
            addLabel="Add language"
          />
        </div>
      )}

      {section === "travel" && (
        <div className="flex flex-col gap-4">
          <BudgetRangeSlider value={profile.budgetRange} onChange={(value) => updateProfile({ budgetRange: value })} />
          <RangeField
            label="Travel duration range"
            fromLabel="Minimum days"
            toLabel="Maximum days"
            suffix=" days"
            value={profile.duration}
            onChange={(value) => updateProfile({ duration: value })}
          />
          <ChipEditor label="Travel style" options={TRAVEL_STYLE_OPTIONS} selected={profile.travelStyle} onToggle={(value) => toggleInArray("travelStyle", value)} />
          <CustomEntry
            label="Add custom travel style"
            value={customValue}
            onChange={setCustomValue}
            onAdd={() => addCustomItem("travelStyle")}
          />
          <SingleChoice label="Preferred weather" options={TEMPERATURE_OPTIONS} selected={profile.preferredTemperature} onSelect={(value) => updateProfile({ preferredTemperature: value })} />
        </div>
      )}

      {section === "interests" && (
        <div className="flex flex-col gap-4">
          <ChipEditor label="Interests" options={ACTIVITY_OPTIONS} selected={profile.activityInterests} onToggle={(value) => toggleInArray("activityInterests", value)} />
          <CustomEntry
            label="Add custom interest"
            value={customValue}
            onChange={setCustomValue}
            onAdd={() => addCustomItem("activityInterests")}
          />
        </div>
      )}

      {section === "nogos" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-warning-light p-3 text-sm text-foreground">No-gos are treated as strong constraints in suggestions.</p>
          <ChipEditor label="No-gos" options={NOGO_OPTIONS} selected={profile.noGos} onToggle={(value) => toggleInArray("noGos", value)} />
          <CustomEntry
            label="Add custom no-go"
            value={customValue}
            onChange={setCustomValue}
            onAdd={() => addCustomItem("noGos")}
          />
        </div>
      )}

      {section === "comfort" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-teal-light p-3 text-sm leading-6 text-foreground">
            These details stay private and are only used to improve suggestions unless you choose to share them.
          </p>
          <ChipEditor label="Health details" options={DISABILITY_OPTIONS} selected={profile.disabilities} onToggle={(value) => toggleInArray("disabilities", value)} />
          <ChipEditor label="Comfort concerns" options={FEAR_OPTIONS} selected={profile.fears} onToggle={(value) => toggleInArray("fears", value)} />
          <SingleChoice label="Mobility" options={MOBILITY_OPTIONS} selected={profile.mobilityLevel} onSelect={(value) => updateProfile({ mobilityLevel: value })} />
          <ChipEditor label="Dietary needs" options={DIETARY_OPTIONS} selected={profile.dietaryNeeds} onToggle={(value) => toggleInArray("dietaryNeeds", value)} />
          <CustomEntry
            label="Add custom private note"
            value={customValue}
            onChange={setCustomValue}
            onAdd={() => addCustomItem("disabilities")}
          />
        </div>
      )}

      {section === "visibility" && (
        <div className="flex flex-col gap-3">
          <p className="rounded-2xl bg-teal-light p-4 text-sm leading-6 text-foreground">
            Only relevant preferences are used for matching and group suggestions. Sensitive details stay private by default.
          </p>
          <VisibilityRule icon={<Eye size={17} />} title="Shared with matches" text="Name, age, languages, travel style and shared interests." />
          <VisibilityRule icon={<BrainCircuit size={17} />} title="Used for suggestions" text="Budget, duration, no-gos and preference signals." />
          <VisibilityRule icon={<Lock size={17} />} title="Private by default" text="Health, accessibility and sensitive comfort details." />
          <button onClick={onPreview} className="w-full rounded-2xl bg-secondary py-3 text-sm font-heading font-bold">
            Preview public profile
          </button>
        </div>
      )}

      <button onClick={onClose} className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-heading font-bold text-primary-foreground">
        Done
      </button>
    </SheetFrame>
  );
};

const VisibilityRule = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="rounded-2xl bg-card border border-border p-4 flex items-start gap-3">
    <div className="text-teal mt-0.5">{icon}</div>
    <div>
      <p className="font-heading font-bold text-sm">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 leading-5">{text}</p>
    </div>
  </div>
);

const SheetFrame = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] bg-foreground/25 backdrop-blur-sm flex items-end justify-center px-3 pb-3">
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 28, opacity: 0 }}
      className="w-full max-w-[430px] max-h-[86vh] overflow-y-auto rounded-[1.75rem] bg-background p-4 shadow-vacation"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-lg font-extrabold">{title}</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const TextField = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="block">
    <span className="text-sm font-semibold text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
    />
  </label>
);

const parseBudgetRange = (value: string) => {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length >= 2) return [numbers[0], numbers[1]];
  if (numbers.length === 1) return [numbers[0], Math.min(5000, numbers[0] + 500)];
  return [300, 800];
};

const formatBudgetRange = ([min, max]: number[]) => `€${min} – €${max}`;

const BudgetRangeSlider = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [range, setRange] = useState<number[]>(parseBudgetRange(value));
  const currentLabel = value || "Not set";

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-heading font-bold">Budget range</p>
          <p className="text-xs text-muted-foreground mt-1">Private and used for suggestions.</p>
        </div>
        <span className="rounded-full bg-coral-light px-3 py-1 text-xs font-bold text-primary">
          {currentLabel}
        </span>
      </div>
      <Slider
        value={range}
        min={100}
        max={5000}
        step={50}
        minStepsBetweenThumbs={2}
        onValueChange={(next) => {
          const ordered = [...next].sort((a, b) => a - b);
          setRange(ordered);
          onChange(formatBudgetRange(ordered));
        }}
      />
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>€100</span>
        <span>€5000</span>
      </div>
    </div>
  );
};

const RangeField = ({
  label,
  fromLabel,
  toLabel,
  value,
  onChange,
  prefix = "",
  suffix = "",
}: {
  label: string;
  fromLabel: string;
  toLabel: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) => {
  const numbers = value.match(/\d+/g) ?? [];
  const [from, setFrom] = useState(numbers[0] ?? "");
  const [to, setTo] = useState(numbers[1] ?? "");

  const commit = (nextFrom: string, nextTo: string) => {
    const cleanedFrom = nextFrom.replace(/[^\d]/g, "");
    const cleanedTo = nextTo.replace(/[^\d]/g, "");
    if (!cleanedFrom && !cleanedTo) {
      onChange("");
      return;
    }
    if (cleanedFrom && cleanedTo) {
      onChange(`${prefix}${cleanedFrom} - ${prefix}${cleanedTo}${suffix}`);
      return;
    }
    onChange(`${prefix}${cleanedFrom || cleanedTo}${suffix}`);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="rounded-2xl border border-border bg-white px-3 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground">{fromLabel}</span>
          <input
            value={from}
            inputMode="numeric"
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d]/g, "");
              setFrom(next);
              commit(next, to);
            }}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
            placeholder="0"
          />
        </label>
        <label className="rounded-2xl border border-border bg-white px-3 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground">{toLabel}</span>
          <input
            value={to}
            inputMode="numeric"
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d]/g, "");
              setTo(next);
              commit(from, next);
            }}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
            placeholder="0"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {value || "Set a range to help Planly compare realistic options."}
      </p>
    </div>
  );
};

const ChipEditor = ({
  label,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  onCustomAdd,
  addLabel = "Add custom item",
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  onCustomAdd?: () => void;
  addLabel?: string;
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addCustom = () => {
    onCustomAdd?.();
    setShowCustomInput(false);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
        {onCustomAdd && onCustomChange && (
          <button
            onClick={() => setShowCustomInput((current) => !current)}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-primary transition-colors"
            aria-label={addLabel}
          >
            <Plus size={15} />
          </button>
        )}
      </div>
      {showCustomInput && onCustomAdd && onCustomChange && (
        <div className="mt-3 flex gap-2 rounded-2xl border border-border bg-card p-2">
          <input
            value={customValue ?? ""}
            onChange={(event) => onCustomChange(event.target.value)}
            className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder={addLabel}
          />
          <button
            onClick={addCustom}
            className="w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
            aria-label={addLabel}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const SingleChoice = ({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (value: string) => void }) => (
  <div>
    <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            selected === option ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

const CustomEntry = ({ label, value, onChange, onAdd }: { label: string; value: string; onChange: (value: string) => void; onAdd: () => void }) => (
  <div className="rounded-2xl bg-card border border-border p-3">
    <p className="text-sm font-heading font-bold">{label}</p>
    <p className="text-xs text-muted-foreground mt-1">Custom entries help Planly understand your travel preferences more precisely.</p>
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        placeholder="Add custom entry"
      />
      <button onClick={onAdd} className="w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center" aria-label={label}>
        <Plus size={16} />
      </button>
    </div>
  </div>
);

const RequiredHint = () => (
  <div className="rounded-2xl bg-coral-light px-3 py-2 text-xs font-semibold text-primary">
    Required for matching and group suggestions.
  </div>
);

const OptionalSetupHint = () => (
  <div className="rounded-2xl bg-teal-light px-3 py-2 text-xs font-semibold text-teal">
    Add what you know now. You can complete these details later.
  </div>
);

const PrivacySetupNote = () => (
  <div className="rounded-2xl bg-teal-light p-4">
    <div className="flex items-start gap-2">
      <ShieldCheck size={17} className="text-teal mt-0.5" />
      <p className="text-sm leading-6 text-foreground">
        Sensitive preferences stay private by default. Planly only uses them to improve matches and group suggestions.
      </p>
    </div>
  </div>
);

const OnboardingProfile = ({
  profile,
  step,
  setStep,
  updateProfile,
  toggleInArray,
  addCustomItem,
  customValue,
  setCustomValue,
  onComplete,
}: {
  profile: UserProfile;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  updateProfile: (partial: Partial<UserProfile>) => void;
  toggleInArray: (field: keyof UserProfile, value: string) => void;
  addCustomItem: (field: keyof UserProfile) => void;
  customValue: string;
  setCustomValue: (value: string) => void;
  onComplete: () => void;
}) => {
  const steps = [
    { title: "Welcome to Planly", subtitle: "Set up the details Planly needs for better suggestions." },
    { title: "How will you start?", subtitle: "Choose whether you already have a group or want to find buddies." },
    { title: "Basic information", subtitle: "Required details for matching." },
    { title: "Travel preferences", subtitle: "Required ranges and styles for suggestions." },
    { title: "Interests", subtitle: "Add at least one interest." },
    { title: "Optional constraints", subtitle: "No-gos and private comfort details can improve suggestions." },
    { title: "Ready", subtitle: "Review what is missing before you start." },
  ];
  const missingBasicFields = requiredChecks
    .filter((check) => basicInfoKeys.has(check.key) && !check.isComplete(profile))
    .map((check) => check.label);
  const missingPreferenceFields = requiredChecks
    .filter((check) => !basicInfoKeys.has(check.key) && !check.isComplete(profile))
    .map((check) => check.label);
  const canContinueFromBasic = missingBasicFields.length === 0;
  const hasMissingPreferences = missingPreferenceFields.length > 0;
  const inviteLink = `https://planly.app/invite/demo-${profile.id}`;

  const next = () => {
    if (step === 2 && !canContinueFromBasic) {
      toast.error("Please complete your basic information before continuing.");
      return;
    }
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    onComplete();
  };

  const reviewMissingDetails = () => {
    if (!profile.budgetRange || !profile.duration || profile.travelStyle.length === 0) {
      setStep(3);
      return;
    }
    setStep(4);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied.");
    } catch {
      toast.success("Invite link copied.");
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 min-h-screen flex flex-col">
      <div className="mb-6">
        <div className="flex gap-1 mb-4">
          {steps.map((_, index) => (
            <div key={index} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <h1 className="font-heading text-2xl font-bold">{steps[step].title}</h1>
        <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col gap-5">
        {step === 0 && (
          <>
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <Sparkles size={28} className="text-primary mb-3" />
              <p className="text-sm leading-6 text-muted-foreground">
                Planly uses your preferences as decision support. You stay in control of what gets shared.
              </p>
            </div>
            <PrivacySetupNote />
          </>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <ModeCard icon={<UserPlus size={22} />} title="Find travel buddies" desc="Continue to buddy matching after setup." selected={profile.travelMode === "solo"} onClick={() => updateProfile({ travelMode: "solo" })} />
            <ModeCard icon={<Users size={22} />} title="I already have a group" desc="Create a mock invite link for friends." selected={profile.travelMode === "friends"} onClick={() => updateProfile({ travelMode: "friends" })} />
            {profile.travelMode === "friends" && (
              <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
                <p className="font-heading font-bold text-sm">Invite friends</p>
                <p className="mt-2 truncate rounded-2xl bg-secondary px-3 py-2 text-xs text-muted-foreground">{inviteLink}</p>
                <button onClick={copyInvite} className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-heading font-bold text-primary-foreground">
                  Copy invite link
                </button>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <>
            <RequiredHint />
            <TextField label="Name" value={profile.name} onChange={(value) => updateProfile({ name: value })} />
            <TextField label="Age" type="number" value={String(profile.age || "")} onChange={(value) => updateProfile({ age: parseInt(value, 10) || 0 })} />
            <ChipEditor
              label="Languages required"
              options={LANGUAGE_OPTIONS}
              selected={profile.languages}
              onToggle={(value) => toggleInArray("languages", value)}
              customValue={customValue}
              onCustomChange={setCustomValue}
              onCustomAdd={() => addCustomItem("languages")}
              addLabel="Add language"
            />
          </>
        )}
        {step === 3 && (
          <>
            <OptionalSetupHint />
            <BudgetRangeSlider value={profile.budgetRange} onChange={(value) => updateProfile({ budgetRange: value })} />
            <RangeField
              label="Travel duration range"
              fromLabel="Minimum days"
              toLabel="Maximum days"
              suffix=" days"
              value={profile.duration}
              onChange={(value) => updateProfile({ duration: value })}
            />
            <ChipEditor label="Travel style" options={TRAVEL_STYLE_OPTIONS} selected={profile.travelStyle} onToggle={(value) => toggleInArray("travelStyle", value)} />
            <CustomEntry
              label="Add custom travel style"
              value={customValue}
              onChange={setCustomValue}
              onAdd={() => addCustomItem("travelStyle")}
            />
            <SingleChoice label="Preferred weather" options={TEMPERATURE_OPTIONS} selected={profile.preferredTemperature} onSelect={(value) => updateProfile({ preferredTemperature: value })} />
          </>
        )}
        {step === 4 && (
          <>
            <OptionalSetupHint />
            <ChipEditor label="Interests" options={ACTIVITY_OPTIONS} selected={profile.activityInterests} onToggle={(value) => toggleInArray("activityInterests", value)} />
            <CustomEntry
              label="Add custom interest"
              value={customValue}
              onChange={setCustomValue}
              onAdd={() => addCustomItem("activityInterests")}
            />
          </>
        )}
        {step === 5 && (
          <>
            <PrivacySetupNote />
            <ChipEditor label="No-gos optional" options={NOGO_OPTIONS} selected={profile.noGos} onToggle={(value) => toggleInArray("noGos", value)} />
            <CustomEntry
              label="Add custom no-go"
              value={customValue}
              onChange={setCustomValue}
              onAdd={() => addCustomItem("noGos")}
            />
            <ChipEditor label="Health details" options={DISABILITY_OPTIONS} selected={profile.disabilities} onToggle={(value) => toggleInArray("disabilities", value)} />
            <SingleChoice label="Mobility" options={MOBILITY_OPTIONS} selected={profile.mobilityLevel} onSelect={(value) => updateProfile({ mobilityLevel: value })} />
            <ChipEditor label="Dietary needs" options={DIETARY_OPTIONS} selected={profile.dietaryNeeds} onToggle={(value) => toggleInArray("dietaryNeeds", value)} />
          </>
        )}
        {step === 6 && (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal flex items-center justify-center mb-4">
              <Check size={22} />
            </div>
            <h2 className="font-heading text-xl font-extrabold">Your profile is ready.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasMissingPreferences
                ? "Add some more details to get better buddy matches and group suggestions."
                : "Planly can now suggest better buddies and group ideas."}
            </p>
            {hasMissingPreferences && (
              <div className="mt-4 rounded-2xl bg-warning-light p-3">
                <p className="text-sm font-semibold text-foreground">Review missing details</p>
                <div className="mt-3 flex flex-col gap-2">
                  {missingPreferenceFields.map((field) => (
                    <span key={field} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-warning">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {step === steps.length - 1 ? (
        <div className="flex flex-col gap-2 mt-6">
          {hasMissingPreferences && (
            <button onClick={reviewMissingDetails} className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold">
              Review missing details
            </button>
          )}
          <button
            onClick={next}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2"
          >
            Start planning
            <Check size={18} />
          </button>
        </div>
      ) : (
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep((current) => current - 1)} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold">
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const ModeCard = ({ icon, title, desc, selected, onClick }: { icon: React.ReactNode; title: string; desc: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all ${
      selected ? "bg-coral-light ring-2 ring-primary shadow-card" : "bg-card shadow-card"
    }`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-heading font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    {selected && <Check size={20} className="text-primary mt-1" />}
  </button>
);

export default ProfileScreen;
