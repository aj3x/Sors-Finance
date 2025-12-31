"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  DollarSign,
  Tags,
  Code2,
  TrendingUp,
  PiggyBank,
  Home,
  CreditCard,
  BarChart3,
  ChevronRight,
  Settings,
  Loader2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useSnapshot } from "@/lib/snapshot-context";

const navItems = [
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
  },
  {
    title: "Budget",
    url: "/budget",
    icon: Wallet,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Tags,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const portfolioSubItems = [
  { title: "Overview", url: "/portfolio", icon: BarChart3 },
  { title: "Savings", url: "/portfolio/savings", icon: PiggyBank },
  { title: "Investments", url: "/portfolio/investments", icon: TrendingUp },
  { title: "Assets", url: "/portfolio/assets", icon: Home },
  { title: "Debt", url: "/portfolio/debt", icon: CreditCard },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { progress, isSnapshotInProgress } = useSnapshot();

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:mt-1 group-data-[collapsible=icon]:-mb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Sors</span>
                  <span className="text-xs text-muted-foreground">Budget Tracking Tool</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Dashboard"
                >
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Portfolio with collapsible sub-items */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={pathname.startsWith("/portfolio")}
                      tooltip="Portfolio"
                    >
                      <TrendingUp />
                      <span>Portfolio</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {portfolioSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.url}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Other nav items */}
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Snapshot Progress Indicator */}
        {isSnapshotInProgress && (
          <div className="px-3 py-2 group-data-[collapsible=icon]:px-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden truncate">
                Updating prices...
              </span>
            </div>
            <div className="mt-1 group-data-[collapsible=icon]:hidden">
              <Progress value={progressPercent} className="h-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{progress.currentTicker}</span>
                <span>{progress.completed}/{progress.total}</span>
              </div>
            </div>
          </div>
        )}
        {process.env.NODE_ENV === "development" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dev"}
                tooltip="Developer"
              >
                <Link href="/dev">
                  <Code2 />
                  <span>Developer</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
