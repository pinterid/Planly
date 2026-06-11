import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Heart, X, UserPlus, ChevronRight } from "lucide-react";
import { groups } from "@/data/mockData";

const GroupsScreen = () => {
  const [activeTab, setActiveTab] = useState<"friends" | "matches">("friends");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const group = groups.find((g) => g.id === selectedGroup);

  return (
    <div className="px-4 pt-4 pb-4">
      {!selectedGroup ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => setActiveTab("friends")}
              className={`font-heading text-xl font-bold transition-colors ${
                activeTab === "friends" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`font-heading text-lg font-semibold transition-colors flex items-center gap-1 ${
                activeTab === "matches" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              ✨ Matches
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className="w-full bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full gradient-coral flex items-center justify-center text-primary-foreground font-heading font-bold">
                  {g.name.charAt(g.name.length - 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold">{g.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {g.members.join(", ")}
                  </p>
                  {g.lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MessageCircle size={12} />
                      {g.lastMessage}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </div>

          <button className="w-full mt-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold flex items-center justify-center gap-2">
            <UserPlus size={18} />
            Add more Friends
          </button>
        </motion.div>
      ) : (
        <GroupDetail group={group!} onBack={() => setSelectedGroup(null)} />
      )}
    </div>
  );
};

const GroupDetail = ({
  group,
  onBack,
}: {
  group: (typeof groups)[0];
  onBack: () => void;
}) => {
  const [trips, setTrips] = useState(group.trips);

  const handleVote = (index: number, vote: boolean) => {
    setTrips((prev) =>
      prev.map((t, i) =>
        i === index
          ? { ...t, votes: vote ? t.votes + 1 : t.votes, voted: true }
          : t
      )
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack} className="text-sm text-primary font-medium mb-4">
        ← Back
      </button>

      <h1 className="font-heading text-xl font-bold mb-1">{group.name}</h1>
      <p className="text-sm text-muted-foreground mb-5">
        {group.members.join(" • ")}
      </p>

      <div className="bg-card rounded-xl p-4 shadow-card mb-5">
        <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-2">
          Shared Preferences
        </h3>
        <div className="flex gap-3">
          <span className="px-3 py-1 rounded-full bg-coral-light text-sm font-medium">
            Budget: {group.budget}
          </span>
          <span className="px-3 py-1 rounded-full bg-teal-light text-sm font-medium">
            Style: {group.style}
          </span>
        </div>
      </div>

      <h3 className="font-heading font-semibold mb-3">Trip Options</h3>
      <div className="space-y-3">
        <AnimatePresence>
          {trips.map((trip, i) => (
            <motion.div
              key={trip.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-heading font-semibold">{trip.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: trip.votes }).map((_, j) => (
                    <Heart
                      key={j}
                      size={14}
                      className="text-primary"
                      fill="hsl(var(--primary))"
                    />
                  ))}
                </div>
              </div>
              {!trip.voted && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(i, true)}
                    className="w-8 h-8 rounded-full bg-coral-light flex items-center justify-center"
                  >
                    <Heart size={14} className="text-primary" />
                  </button>
                  <button
                    onClick={() => handleVote(i, false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex gap-3">
        <button className="flex-1 py-3 rounded-xl gradient-coral text-primary-foreground font-heading font-semibold">
          Suggested Trips
        </button>
        <button className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold flex items-center justify-center gap-2">
          <MessageCircle size={16} />
          Chat
        </button>
      </div>
    </motion.div>
  );
};

export default GroupsScreen;
