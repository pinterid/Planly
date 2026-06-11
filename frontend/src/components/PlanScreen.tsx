import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Wallet, Compass, Sparkles, Plus, Heart, TrendingUp, X, Hotel, Sun, Star } from "lucide-react";
import { tripOptions, type TripOption } from "@/data/mockData";
import barcelonaImg from "@/assets/trip-barcelona.jpg";
import lisbonImg from "@/assets/trip-lisbon.jpg";
import berlinImg from "@/assets/trip-berlin.jpg";

const images: Record<string, string> = {
  barcelona: barcelonaImg,
  lisbon: lisbonImg,
  berlin: berlinImg,
};

const preferenceOptions = [
  "Adventure",
  "Good Food",
  "Night life",
  "Culture",
  "Relax",
  "Beach",
];

const PlanScreen = () => {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("4-5 Days");
  const [when, setWhen] = useState("In July");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(["Adventure", "Good Food"]);
  const [showResults, setShowResults] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripOption | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => setLiked((p) => ({ ...p, [id]: !p[id] }));

  const avgLikeness = Math.round(
    tripOptions.reduce((s, t) => s + t.likeness, 0) / tripOptions.length
  );
  const topMatch = [...tripOptions].sort((a, b) => b.likeness - a.likeness)[0];

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="font-heading text-xl font-bold mb-5">Plan your Trip</h1>

      {!showResults ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Field
            icon={<MapPin size={18} className="text-primary" />}
            label="Destination"
            value={destination}
            placeholder="Where to?"
            onChange={setDestination}
          />
          <Field
            icon={<Calendar size={18} className="text-primary" />}
            label="Duration"
            value={duration}
            onChange={setDuration}
          />
          <Field
            icon={<Calendar size={18} className="text-primary" />}
            label="When"
            value={when}
            onChange={setWhen}
          />

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {preferenceOptions.map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedPrefs.includes(pref)
                      ? "gradient-coral text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {pref}
                </button>
              ))}
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Plus size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-card">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Details
            </label>
            <textarea
              className="w-full bg-transparent text-sm resize-none outline-none min-h-[60px] text-foreground placeholder:text-muted-foreground"
              placeholder="Write a prompt... (e.g. I want a budget-friendly beach trip)"
            />
          </div>

          <button
            onClick={() => setShowResults(true)}
            className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <Sparkles size={18} />
            Find Trips
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={() => setShowResults(false)}
            className="text-sm text-primary font-medium mb-4 inline-block"
          >
            ← Back to planning
          </button>
          {/* Likeness summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard icon={<TrendingUp size={14} />} label="Avg match" value={`${avgLikeness}%`} />
            <StatCard icon={<Star size={14} />} label="Top pick" value={topMatch.destination} />
            <StatCard icon={<Heart size={14} />} label="Liked by" value={`${topMatch.likes.toLocaleString()}`} />
          </div>

          <h2 className="font-heading text-lg font-bold mb-4">Trip Options</h2>
          <div className="space-y-4">
            {tripOptions.map((trip, i) => (
              <motion.button
                type="button"
                onClick={() => setSelectedTrip(trip)}
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="relative">
                  <img
                    src={images[trip.image]}
                    alt={trip.destination}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    width={640}
                    height={512}
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-bold flex items-center gap-1">
                    <TrendingUp size={12} className="text-primary" />
                    {trip.likeness}% match
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(trip.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center"
                    aria-label="Like trip"
                  >
                    <Heart
                      size={16}
                      className={liked[trip.id] ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-bold text-lg leading-tight">{trip.destination}</h3>
                      <p className="text-xs text-muted-foreground">{trip.country}</p>
                    </div>
                    <span className="text-primary font-bold">{trip.price}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {trip.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Compass size={14} />
                      {trip.style}
                    </span>
                  </div>
                  {/* Likeness bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full gradient-coral"
                        style={{ width: `${trip.likeness}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart size={11} /> {trip.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trip detail modal */}
      <AnimatePresence>
        {selectedTrip && (
          <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} liked={!!liked[selectedTrip.id]} onLike={() => toggleLike(selectedTrip.id)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-xl p-2.5 shadow-card">
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
      {icon}
      {label}
    </div>
    <div className="font-heading font-bold text-sm mt-0.5 truncate">{value}</div>
  </div>
);

const TripDetailModal = ({
  trip,
  onClose,
  liked,
  onLike,
}: {
  trip: TripOption;
  onClose: () => void;
  liked: boolean;
  onLike: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
  >
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-card-hover max-h-[85vh] overflow-y-auto"
    >
      <div className="relative">
        <img src={images[trip.image]} alt={trip.destination} className="w-full h-44 object-cover" />
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="font-heading font-bold text-2xl text-white drop-shadow">{trip.destination}</h3>
            <p className="text-xs text-white/90 drop-shadow">{trip.country}</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-sm font-bold flex items-center gap-1">
            <TrendingUp size={14} className="text-primary" />
            {trip.likeness}%
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{trip.description}</p>

        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Wallet size={14} />} label="Price" value={trip.price} />
          <StatCard icon={<Calendar size={14} />} label="Duration" value={trip.duration} />
          <StatCard icon={<Sun size={14} />} label="Weather" value={trip.weather} />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <Hotel size={12} /> Stay
          </div>
          <div className="text-sm font-medium">{trip.hotel}</div>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Highlights</div>
          <ul className="space-y-1.5">
            {trip.highlights.map((h) => (
              <li key={h} className="text-sm flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full gradient-coral shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Vibe</div>
          <div className="flex flex-wrap gap-1.5">
            {trip.tags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart size={12} /> Liked by {trip.likes.toLocaleString()} travellers
          </div>
          <button
            onClick={onLike}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              liked ? "gradient-coral text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Heart size={12} className={liked ? "fill-current" : ""} />
            {liked ? "Liked" : "Like"}
          </button>
        </div>

        <button className="w-full py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold shadow-card">
          Book this trip
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const Field = ({
  icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
    {icon}
    <div className="flex-1">
      <label className="text-[11px] text-muted-foreground font-medium">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-medium outline-none text-foreground placeholder:text-muted-foreground"
      />
    </div>
    <Wallet size={16} className="text-muted-foreground" />
  </div>
);

export default PlanScreen;
