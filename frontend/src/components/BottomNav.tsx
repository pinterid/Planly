import { Home, Heart, Users, User } from "lucide-react";
import { motion } from "framer-motion";

export type Tab = "home" | "buddies" | "groups" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs = [
  { id: "home" as Tab, icon: Home, label: "Home" },
  { id: "buddies" as Tab, icon: Heart, label: "Buddies" },
  { id: "groups" as Tab, icon: Users, label: "Groups" },
  { id: "profile" as Tab, icon: User, label: "Profile" },
];

const BottomNav = ({ active, onChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-white/95 backdrop-blur-xl border-t border-border shadow-card md:bottom-6 md:rounded-t-[1.75rem] md:border">
      <div className="mx-auto flex items-center justify-around h-[4.35rem]">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
