import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import HealthCheckIn from "./pages/HealthCheckIn";
import Reminders from "./pages/Reminders";
import Gestures from "./pages/Gestures";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/check-in"} component={HealthCheckIn} />
      <Route path={"/reminders"} component={Reminders} />
      <Route path={"/gestures"} component={Gestures} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
