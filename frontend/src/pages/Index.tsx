import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import BuddiesScreen from "@/components/BuddiesScreen";
import GroupPlanningScreen from "@/components/GroupPlanningScreen";
import ProfileScreen from "@/components/ProfileScreen";
import LoginScreen from "@/components/LoginScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { getProfile, isOnboardingComplete, isSignedIn, logIn, signOut } from "@/data/profileStore";

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
      <div className="min-h-screen w-full bg-background md:flex md:items-center md:justify-center md:px-4">
        <div className="relative mx-auto flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden app-shell shadow-vacation md:h-[calc(100vh-3rem)] md:rounded-[2rem]">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <ProfileScreen
              isOnboarding
              onComplete={() => {
                setShowOnboarding(false);
                if (getProfile().travelMode === "solo") {
                  setActiveTab("buddies");
                }
              }}
            />
          </div>
          <Sonner className="toaster group planly-sonner" position="bottom-center" offset="1.25rem" visibleToasts={2} />
        </div>
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
            onOpenProfile={() => setActiveTab("profile")}
            onOpenBuddies={() => setActiveTab("buddies")}
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
    <div className="min-h-screen w-full bg-background md:flex md:items-center md:justify-center md:px-4">
      <div className="relative mx-auto flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden app-shell shadow-vacation md:h-[calc(100vh-3rem)] md:rounded-[2rem]">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-full pt-2"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav active={activeTab} onChange={setActiveTab} />
        <Sonner className="toaster group planly-sonner" position="bottom-center" offset="5.25rem" visibleToasts={2} />
      </div>
    </div>
  );
};

export default Index;
