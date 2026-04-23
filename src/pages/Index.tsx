import { AppProvider, useApp } from "@/context/AppContext";
import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";

const AppShell = () => {
  const { session, group } = useApp();
  return session && group ? <Dashboard /> : <Onboarding />;
};

const Index = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default Index;
