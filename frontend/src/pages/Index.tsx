import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import BuddiesScreen from "@/components/BuddiesScreen";
import GroupPlanningScreen from "@/components/GroupPlanningScreen";
import ProfileScreen from "@/components/ProfileScreen";
import { isOnboardingComplete } from "@/data/profileStore";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());
  const [initialGroupId, setInitialGroupId] = useState<string | null>(null);

  if (showOnboarding) {
    return (
      <div className="min-h-screen max-w-md mx-auto relative">
        <ProfileScreen isOnboarding onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  const openGroup = (id: string) => {
    setInitialGroupId(id);
    setActiveTab("groups");
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onOpenGroup={openGroup} onGoTo={setActiveTab} />;
      case "buddies":
        return <BuddiesScreen onOpenGroup={openGroup} />;
      case "groups":
        return (
          <GroupPlanningScreen
            initialGroupId={initialGroupId}
            onGroupOpened={() => setInitialGroupId(null)}
          />
        );
      case "profile":
        return <ProfileScreen />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pt-2"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default Index;
