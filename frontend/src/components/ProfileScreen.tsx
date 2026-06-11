import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, User, Save, Users as UsersIcon, UserPlus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  getProfile,
  saveProfile,
  UserProfile,
  DISABILITY_OPTIONS,
  FEAR_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  BUDGET_OPTIONS,
  DURATION_OPTIONS,
  TEMPERATURE_OPTIONS,
  NOGO_OPTIONS,
  DIETARY_OPTIONS,
  LANGUAGE_OPTIONS,
  MOBILITY_OPTIONS,
  ACCOMMODATION_OPTIONS,
  ACTIVITY_OPTIONS,
} from "@/data/profileStore";
import { toast } from "sonner";

const AVATARS = ["🧳", "👩‍💼", "🧑‍💻", "🎨", "👨‍👩‍👧‍👦", "🏄", "🎒", "✈️"];

interface ProfileScreenProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
}

const ProfileScreen = ({ isOnboarding = false, onComplete }: ProfileScreenProps) => {
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [step, setStep] = useState(0);

  const update = (partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  const toggleInArray = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => {
      const arr = prev[field] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  };

  const handleSave = () => {
    saveProfile({ ...profile, onboardingComplete: true });
    toast.success("Welcome to Planly!");
    onComplete?.();
  };

  // Onboarding wireframe flow: Welcome → Mode → Basics → Style → Budget → Duration & Temp → No-gos → Health
  const onboardingSteps = [
    { title: "Welcome to Planly", subtitle: "Plan trips together, effortlessly" },
    { title: "Travel with...", subtitle: "How do you usually travel?" },
    { title: "About you", subtitle: "Just the basics" },
    { title: "Travel Style", subtitle: "Choose your vibe" },
    { title: "Budget", subtitle: "What's your range?" },
    { title: "Duration & Weather", subtitle: "When you go, how warm?" },
    { title: "Travel No-gos", subtitle: "Things to avoid" },
    { title: "Health & Comfort", subtitle: "Help us match you better" },
  ];

  if (isOnboarding) {
    return (
      <div className="px-4 pt-6 pb-4 min-h-screen flex flex-col">
        <div className="mb-6">
          <div className="flex gap-1 mb-4">
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "gradient-coral" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <h1 className="font-heading text-2xl font-bold">{onboardingSteps[step].title}</h1>
          <p className="text-sm text-muted-foreground">{onboardingSteps[step].subtitle}</p>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-5"
        >
          {step === 0 && (
            <div className="text-center pt-6">
              <div className="text-7xl mb-4">🧭</div>
              <p className="text-muted-foreground">
                Set your preferences once. Planly finds destinations that work for everyone in your group.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              <ModeCard
                icon={<UserPlus size={22} />}
                title="Find Travel Buddies"
                desc="Match with compatible people to plan a trip"
                selected={profile.travelMode === "solo"}
                onClick={() => update({ travelMode: "solo" })}
              />
              <ModeCard
                icon={<UsersIcon size={22} />}
                title="Travel with Friends"
                desc="I already have a group I want to plan with"
                selected={profile.travelMode === "friends"}
                onClick={() => update({ travelMode: "friends" })}
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => update({ avatar: a })}
                      className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all ${
                        profile.avatar === a ? "ring-2 ring-primary bg-coral-light scale-110" : "bg-secondary"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <FieldInput label="Name" value={profile.name} onChange={(v) => update({ name: v })} placeholder="Your name" />
              <FieldInput label="Age" value={profile.age.toString()} onChange={(v) => update({ age: parseInt(v) || 0 })} type="number" />
              <ChipSelect label="Languages" options={LANGUAGE_OPTIONS} selected={profile.languages} onToggle={(v) => toggleInArray("languages", v)} />
            </>
          )}

          {step === 3 && (
            <ListSelect
              options={TRAVEL_STYLE_OPTIONS}
              selected={profile.travelStyle}
              onToggle={(v) => toggleInArray("travelStyle", v)}
              icons={{ Adventure: "🏔️", Relaxation: "🌴", Cultural: "🏛️", Luxury: "💎", Budget: "💰" }}
            />
          )}

          {step === 4 && (() => {
            const current = parseInt((profile.budgetRange || "").replace(/[^\d]/g, ""), 10) || 500;
            const setBudget = (n: number) => {
              const clamped = Math.max(100, Math.min(5000, Math.round(n)));
              update({ budgetRange: `€${clamped}` });
            };
            return (
              <div className="space-y-6 px-1">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">€{current}</div>
                  <div className="text-sm text-muted-foreground mt-1">per person, per trip</div>
                </div>
                <Slider
                  value={[current]}
                  min={100}
                  max={5000}
                  step={50}
                  onValueChange={(v) => setBudget(v[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>€100</span>
                  <span>€5000</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Or enter exact amount:</span>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-muted-foreground">€</span>
                    <Input
                      type="number"
                      min={100}
                      max={5000}
                      value={current}
                      onChange={(e) => setBudget(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-center pt-2">
                  {[300, 500, 800, 1500, 3000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setBudget(preset)}
                      className="px-3 py-1.5 rounded-full text-xs border border-border hover:border-primary hover:bg-primary/10 transition"
                    >
                      €{preset}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {step === 5 && (
            <>
              <ListSelect
                label="Travel Duration"
                options={DURATION_OPTIONS}
                selected={profile.duration ? [profile.duration] : []}
                onToggle={(v) => update({ duration: profile.duration === v ? "" : v })}
                icons={{ "1-2 Days": "📅", "2-4 Days": "🗓️", "4+ Days": "📆" }}
                single
              />
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Preferred Temperature</label>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPERATURE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => update({ preferredTemperature: t })}
                      className={`py-4 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        profile.preferredTemperature === t
                          ? "gradient-coral text-primary-foreground shadow-card"
                          : "bg-card shadow-card"
                      }`}
                    >
                      <span className="text-2xl">{t === "Warm" ? "☀️" : t === "Cool" ? "❄️" : "🌤️"}</span>
                      <span className="text-sm font-heading font-semibold">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <ListSelect
              options={NOGO_OPTIONS}
              selected={profile.noGos}
              onToggle={(v) => toggleInArray("noGos", v)}
              icons={{
                "Crowded Places": "👥",
                "Expensive Destinations": "💸",
                "Long Flights": "✈️",
                "Unstable Weather": "⛈️",
                "Limited Connectivity": "📵",
              }}
            />
          )}

          {step === 7 && (
            <>
              <ChipSelect label="Disabilities / Conditions" options={DISABILITY_OPTIONS} selected={profile.disabilities} onToggle={(v) => toggleInArray("disabilities", v)} />
              <ChipSelect label="Fears / Phobias" options={FEAR_OPTIONS} selected={profile.fears} onToggle={(v) => toggleInArray("fears", v)} />
              <SingleSelect label="Mobility Level" options={MOBILITY_OPTIONS} selected={profile.mobilityLevel} onSelect={(v) => update({ mobilityLevel: v })} />
              <ChipSelect label="Dietary Needs" options={DIETARY_OPTIONS} selected={profile.dietaryNeeds} onToggle={(v) => toggleInArray("dietaryNeeds", v)} />
              <ChipSelect label="Activity Interests" options={ACTIVITY_OPTIONS} selected={profile.activityInterests} onToggle={(v) => toggleInArray("activityInterests", v)} />
            </>
          )}
        </motion.div>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < onboardingSteps.length - 1) setStep((s) => s + 1);
              else handleSave();
            }}
            className="flex-1 py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2"
          >
            {step < onboardingSteps.length - 1 ? (
              <>Continue <ChevronRight size={18} /></>
            ) : (
              <>Done <Check size={18} /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Settings view
  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
        <User size={22} className="text-primary" /> Profile
      </h1>

      <div className="space-y-5">
        <div className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-coral-light flex items-center justify-center text-3xl">
            {profile.avatar}
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-lg">{profile.name || "Set your name"}</p>
            <p className="text-sm text-muted-foreground">
              Age {profile.age} · {profile.budgetRange || "—"} · {profile.duration || "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => update({ avatar: a })}
              className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                profile.avatar === a ? "ring-2 ring-primary bg-coral-light" : "bg-secondary"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <FieldInput label="Name" value={profile.name} onChange={(v) => update({ name: v })} />
        <FieldInput label="Age" value={profile.age.toString()} onChange={(v) => update({ age: parseInt(v) || 0 })} type="number" />

        <CollapsibleSection title="Travel Style & Budget">
          <ChipSelect label="Style" options={TRAVEL_STYLE_OPTIONS} selected={profile.travelStyle} onToggle={(v) => toggleInArray("travelStyle", v)} />
          <SingleSelect label="Budget" options={BUDGET_OPTIONS} selected={profile.budgetRange} onSelect={(v) => update({ budgetRange: v })} />
          <SingleSelect label="Duration" options={DURATION_OPTIONS} selected={profile.duration} onSelect={(v) => update({ duration: v })} />
          <SingleSelect label="Temperature" options={TEMPERATURE_OPTIONS} selected={profile.preferredTemperature} onSelect={(v) => update({ preferredTemperature: v })} />
        </CollapsibleSection>

        <CollapsibleSection title="No-gos">
          <ChipSelect options={NOGO_OPTIONS} selected={profile.noGos} onToggle={(v) => toggleInArray("noGos", v)} />
        </CollapsibleSection>

        <CollapsibleSection title="Health & Comfort">
          <ChipSelect label="Disabilities" options={DISABILITY_OPTIONS} selected={profile.disabilities} onToggle={(v) => toggleInArray("disabilities", v)} />
          <ChipSelect label="Fears" options={FEAR_OPTIONS} selected={profile.fears} onToggle={(v) => toggleInArray("fears", v)} />
          <SingleSelect label="Mobility" options={MOBILITY_OPTIONS} selected={profile.mobilityLevel} onSelect={(v) => update({ mobilityLevel: v })} />
          <ChipSelect label="Dietary" options={DIETARY_OPTIONS} selected={profile.dietaryNeeds} onToggle={(v) => toggleInArray("dietaryNeeds", v)} />
        </CollapsibleSection>

        <CollapsibleSection title="Activities & Languages">
          <ChipSelect label="Interests" options={ACTIVITY_OPTIONS} selected={profile.activityInterests} onToggle={(v) => toggleInArray("activityInterests", v)} />
          <ChipSelect label="Languages" options={LANGUAGE_OPTIONS} selected={profile.languages} onToggle={(v) => toggleInArray("languages", v)} />
          <ChipSelect label="Accommodation" options={ACCOMMODATION_OPTIONS} selected={profile.accommodationPrefs} onToggle={(v) => toggleInArray("accommodationPrefs", v)} />
        </CollapsibleSection>

        <button
          onClick={() => { saveProfile(profile); toast.success("Profile saved!"); }}
          className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <Save size={18} /> Save Profile
        </button>
      </div>
    </div>
  );
};

const ModeCard = ({ icon, title, desc, selected, onClick }: {
  icon: React.ReactNode; title: string; desc: string; selected: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all ${
      selected ? "bg-coral-light ring-2 ring-primary shadow-card" : "bg-card shadow-card"
    }`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? "gradient-coral text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-heading font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    {selected && <Check size={20} className="text-primary mt-1" />}
  </button>
);

const ListSelect = ({ label, options, selected, onToggle, icons, single }: {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  icons?: Record<string, string>;
  single?: boolean;
}) => (
  <div>
    {label && <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>}
    <div className="space-y-2">
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              isSel ? "bg-coral-light ring-2 ring-primary shadow-card" : "bg-card shadow-card"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
              {icons?.[opt] ?? "📍"}
            </div>
            <span className="flex-1 text-left font-heading font-semibold">{opt}</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSel ? "border-primary bg-primary" : "border-border"}`}>
              {isSel && (single ? <div className="w-2 h-2 rounded-full bg-primary-foreground" /> : <Check size={12} className="text-primary-foreground" />)}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const FieldInput = ({ label, value, onChange, placeholder, type = "text" }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div className="bg-card rounded-xl p-3 shadow-card">
    {label && <label className="text-[11px] text-muted-foreground font-medium">{label}</label>}
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm font-medium outline-none text-foreground placeholder:text-muted-foreground"
    />
  </div>
);

const ChipSelect = ({ label, options, selected, onToggle }: {
  label?: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) => (
  <div>
    {label && <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected.includes(opt) ? "gradient-coral text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SingleSelect = ({ label, options, selected, onSelect }: {
  label?: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) => (
  <div>
    {label && <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === opt ? "gradient-coral text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const CollapsibleSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between text-left">
        <span className="font-heading font-semibold">{title}</span>
        <ChevronRight size={18} className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
};

export default ProfileScreen;
