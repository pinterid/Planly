import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Heart, MapPin, Wallet, Compass, ChevronLeft, Sparkles } from "lucide-react";
import { travelers, TravelerProfile } from "@/data/mockData";

interface MatchScreenProps {
  onBack?: () => void;
  onMatch?: (traveler: TravelerProfile) => void;
  title?: string;
  subtitle?: string;
}

const MatchScreen = ({ onBack, onMatch, title, subtitle }: MatchScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [matched, setMatched] = useState<TravelerProfile | null>(null);

  const current = travelers[currentIndex % travelers.length];

  const handleSwipe = (dir: "left" | "right") => {
    setDirection(dir);
    if (dir === "right" && onMatch) {
      setMatched(current);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) handleSwipe("right");
    else if (info.offset.x < -100) handleSwipe("left");
  };

  if (matched && onMatch) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-4 pt-4 pb-4"
      >
        {onBack && (
          <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <Sparkles size={36} className="text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">It's a match!</p>
          <div className="w-20 h-20 rounded-full bg-coral-light flex items-center justify-center text-4xl mx-auto my-3">
            {matched.avatar}
          </div>
          <h2 className="font-heading text-xl font-bold mb-1">
            You and {matched.name} want to travel together
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Travel styles align — start planning together?
          </p>
          <button
            onClick={() => { onMatch(matched); setMatched(null); }}
            className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold mb-2"
          >
            Create group with {matched.name}
          </button>
          <button
            onClick={() => setMatched(null)}
            className="w-full py-2.5 rounded-xl bg-secondary font-heading font-semibold text-sm"
          >
            Keep swiping
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-4">
      {onBack && (
        <button onClick={onBack} className="self-start text-sm text-primary font-medium mb-2 flex items-center gap-1">
          <ChevronLeft size={16} /> Back
        </button>
      )}
      <h1 className="font-heading text-xl font-bold mb-1">{title ?? "Travel Match"}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mb-3 text-center">{subtitle}</p>}

      <div className="relative w-full max-w-sm h-[460px] mt-2">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id + "-" + currentIndex}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
              rotate: direction === "left" ? -15 : direction === "right" ? 15 : 0,
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 bg-card rounded-2xl shadow-card p-6 cursor-grab active:cursor-grabbing"
          >
            <ProfileCard profile={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={() => handleSwipe("left")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shadow-card hover:shadow-card-hover transition-shadow"
        >
          <X size={24} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="w-16 h-16 rounded-full gradient-coral flex items-center justify-center shadow-card hover:shadow-card-hover transition-shadow"
        >
          <Heart size={26} className="text-primary-foreground" fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

const ProfileCard = ({ profile }: { profile: TravelerProfile }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 rounded-full bg-coral-light flex items-center justify-center text-3xl">
        {profile.avatar}
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold">
          {profile.name}, {profile.age}
        </h2>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-4">
      <Tag icon={<Wallet size={14} />} label={`Budget: ${profile.budget}`} variant="coral" />
      <Tag icon={<Compass size={14} />} label={`Style: ${profile.style}`} variant="teal" />
      <Tag icon={<MapPin size={14} />} label={`Dest: ${profile.destination}`} variant="amber" />
    </div>

    <div className="mt-2">
      <p className="text-sm font-semibold text-muted-foreground mb-2">About Me:</p>
      <ul className="space-y-2">
        {profile.about.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="text-primary mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

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

export default MatchScreen;
