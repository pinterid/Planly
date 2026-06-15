import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import BuddiesScreen from "@/components/BuddiesScreen";
import GroupPlanningScreen from "@/components/GroupPlanningScreen";
import ProfileScreen from "@/components/ProfileScreen";
import LoginScreen from "@/components/LoginScreen";
import { isOnboardingComplete, isSignedIn, logIn, signOut } from "@/data/profileStore";

const Index = () => {
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());
  const [initialGroupId, setInitialGroupId] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <LoginScreen
        onLogIn={(name) => {
          logIn(name);
          setSignedIn(true);
          setShowOnboarding(!isOnboardingComplete());
        }}
      />
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen w-full max-w-[430px] mx-auto relative app-shell overflow-hidden shadow-vacation md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[2rem]">
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
        return (
          <ProfileScreen
            onSignOut={() => {
              signOut();
              setSignedIn(false);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[430px] mx-auto relative pb-20 app-shell overflow-hidden shadow-vacation md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[2rem]">
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
