import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { disconnectSocket } from "../realtime/socket";
import BranchSwitcher from "../components/BranchSwitcher";
import OwnerBranchSwitcher from "../components/OwnerBranchSwitcher";
import SubscriptionBanner from "../components/SubscriptionBanner";
import NotificationBell from "../components/NotificationBell";
import InsightsAssistant from "../components/insights/InsightsAssistant";
import TopNav from "../components/TopNav";
import { PageBandContext, usePageBandSlot } from "../components/common/PageHeader";
import SubscriptionGate from "../components/subscription/SubscriptionGate";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { clearStorageKeepingTheme } from "../utils/theme";
import { hasTick } from "../utils/can";
import { buildNav, isOwnerMenu } from "../config/navItems";

// The ONE layout for every clinic user: the menu comes from their ticks + the plan.
export default function AppLayout() {
  const { t } = useTranslation();
  const { hasFeature } = useSubscription();
  const { user } = useAuth();
  const owner = isOwnerMenu(user);
  const [branchName, setBranchName] = useState("");
  const band = usePageBandSlot();

  const items = buildNav(user, hasFeature, { branchName }).map((it) => ({
    key: it.key, to: it.to, end: it.end, indent: it.indent, label: t(it.labelKey, it.labelArgs),
  }));

  const handleLogout = () => {
    if (window.confirm(t("layout.logout_confirm"))) {
      clearStorageKeepingTheme(); // keeps dark/light preference
      disconnectSocket();
      window.location.href = "/";
    }
  };

  const switcher = owner ? (
    <OwnerBranchSwitcher
      currentId={user?.branch_id}
      onBranches={(list) => setBranchName(list.find((b) => Number(b.id) === Number(user?.branch_id))?.name || "")}
    />
  ) : <BranchSwitcher />;

  // the renewal banner is for the people who look after the clinic
  const showBanner = hasTick(user, "manage_subscription", "manage_branch_settings");

  return (
    <PageBandContext.Provider value={band.value}>
    <div className="flex h-screen flex-col overflow-hidden bg-ground text-slate-900">
      <TopNav
        items={items}
        title={user?.clinic_name || ""}
        subtitle={user?.name || ""}
        onLogout={handleLogout}
        logoutLabel={t("nav.logout")}
        rightExtras={<NotificationBell />}
        switcher={switcher}
      />

      <div id="main-scroll" className="flex-1 overflow-y-auto">
        <main>
          {/* the band continues under the menu with the page title; the page floats up over its edge */}
          <div className={`ocean-band band-dark ${band.active ? "" : "hidden"}`}>
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 md:px-6">
              <div ref={band.ref} />
              <div ref={band.tabsRef} className="mt-4 empty:hidden" />
            </div>
          </div>
          <div className={`relative mx-auto w-full max-w-[1400px] px-4 pb-10 md:px-6 ${band.active ? "-mt-11" : "pt-5"}`}>
            {showBanner && <SubscriptionBanner />}
            <SubscriptionGate><Outlet /></SubscriptionGate>
          </div>
        </main>
      </div>

      {hasTick(user, "use_insights_assistant") && hasFeature("insights_assistant") && <InsightsAssistant />}
    </div>
    </PageBandContext.Provider>
  );
}
