"use client";

import {
  Avatar,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Chip,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  ScrollShadow,
  Tab,
  Tabs,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { FastForward } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useSessionStore from "@/utils/sessionStore";
import useUserStore from "@/utils/userStore";
import { ThemeSwitcher } from "./layout/theme-switcher";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, clearUser, syncStatus } = useUserStore();
  const { clearSession, isBackgroundSyncing, syncProgress, triggerForceSync } =
    useSessionStore();
  const router = useRouter();
  const pathname = usePathname();

  const routes = [
    { key: "dashboard", title: "Dashboard", href: "/app/home" },
    { key: "courses", title: "Courses", href: "/app/courses" },
    { key: "assignments", title: "Assignments", href: "/app/assignments" },
    { key: "quizzes", title: "Quizzes", href: "/app/quizzes" },
    { key: "calendar", title: "Calendar", href: "/app/calendar" },
  ];

  const getSelectedTab = () => {
    const currentRoute = routes.find((route) => pathname?.includes(route.href));
    return currentRoute?.key || "dashboard";
  };

  const handleTabChange = (key: string | number) => {
    const route = routes.find((r) => r.key === key);
    if (route) {
      router.push(route.href);
    }
  };

  const handleLogout = () => {
    clearSession();
    clearUser();
    router.push("/app/auth");
  };

  const handleForceSync = () => {
    // Trigger force sync through the session store
    // This will be picked up by MoodleProvider and handled as background sync
    triggerForceSync();
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <Navbar
        classNames={{
          base: "pt-2 lg:pt-4 lg:bg-transparent lg:backdrop-filter-none",
          wrapper: "px-4 sm:px-6",
          item: "data-[active=true]:text-primary",
        }}
        height="60px"
      >
        <NavbarBrand className="flex items-center gap-2">
          <NavbarMenuToggle className="mr-2 h-6 sm:hidden" />
          <FastForward size={24} />
          <p className="font-bold text-inherit">Adderall</p>
        </NavbarBrand>
        <Breadcrumbs className="hidden lg:flex" radius="full">
          <BreadcrumbItem>Dashboard</BreadcrumbItem>
          <BreadcrumbItem>Courses</BreadcrumbItem>
        </Breadcrumbs>

        <NavbarContent
          className="ml-auto h-12 max-w-fit items-center gap-0"
          justify="end"
        >
          <NavbarItem className="mr-2 hidden sm:flex">
            <Input
              aria-label="Search"
              classNames={{
                inputWrapper: "bg-content2 dark:bg-content1",
              }}
              labelPlacement="outside"
              placeholder="Search courses..."
              radius="full"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={20}
                />
              }
            />
          </NavbarItem>
          <NavbarItem className="hidden sm:flex">
            <ThemeSwitcher />
          </NavbarItem>
          {/* <NavbarItem className="flex">
            <Popover offset={12} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  disableRipple
                  isIconOnly
                  className="overflow-visible"
                  radius="full"
                  variant="light"
                >
                  <Badge
                    color="danger"
                    content="5"
                    showOutline={false}
                    size="md"
                  >
                    <Icon
                      className="text-default-500"
                      icon="solar:bell-linear"
                      width={22}
                    />
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-w-[90vw] p-0 sm:max-w-[380px]">
                <NotificationsCard className="w-full shadow-none" />
              </PopoverContent>
            </Popover>
          </NavbarItem> */}
          <NavbarItem className="px-2">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  type="button"
                  className="mt-1 h-8 w-8 outline-hidden transition-transform"
                >
                  <Badge
                    color="success"
                    content=""
                    placement="bottom-right"
                    shape="circle"
                  >
                    <Avatar
                      size="sm"
                      fallback={user?.firstName.slice(0, 2).toUpperCase()}
                    />
                  </Badge>
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">
                    {user?.email || "guest@example.com"}
                  </p>
                </DropdownItem>
                <DropdownItem key="settings">My Settings</DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onPress={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu>
          <NavbarMenuItem>
            <Link className="w-full" color="foreground" href="/app/home">
              Dashboard
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem isActive>
            <Link
              aria-current="page"
              className="w-full"
              color="primary"
              href="/app/courses"
            >
              Courses
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full" color="foreground" href="/app/grades">
              Grades
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="w-full" color="foreground" href="/app/settings">
              Settings
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <div className="flex w-full justify-center lg:mt-6 flex-shrink-0">
        <ScrollShadow
          hideScrollBar
          className="border-divider flex w-full max-w-[1024px] justify-between gap-8 border-b px-4 sm:px-8"
          orientation="horizontal"
        >
          <Tabs
            aria-label="Navigation Tabs"
            classNames={{
              tabList: "w-full relative rounded-none p-0 gap-4 lg:gap-6",
              tab: "max-w-fit px-0 h-12",
              cursor: "w-full",
              tabContent: "text-default-400",
            }}
            radius="full"
            variant="underlined"
            selectedKey={getSelectedTab()}
            onSelectionChange={handleTabChange}
          >
            {routes.map((route) => (
              <Tab
                key={route.key}
                title={
                  route.key === "courses" ? (
                    <div className="flex items-center gap-2">
                      <p>{route.title}</p>
                      <Chip
                        size="sm"
                        color={
                          syncStatus.coursesSyncing ? "primary" : "default"
                        }
                      >
                        {user?.courses?.length || 0}
                      </Chip>
                      {syncStatus.coursesSyncing && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  ) : (
                    route.title
                  )
                }
              />
            ))}
          </Tabs>
          <div className="flex items-center gap-4">
            <Popover placement="bottom-end" showArrow>
              <PopoverTrigger>
                <Button
                  radius="full"
                  size="sm"
                  variant="ghost"
                  startContent={
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isBackgroundSyncing
                          ? "bg-blue-500 animate-pulse"
                          : "bg-green-500",
                      )}
                    />
                  }
                >
                  {isBackgroundSyncing ? "Syncing..." : "Synced"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 min-w-80">
                <div className="px-3 py-3 min-w-72">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-small font-bold">
                      {isBackgroundSyncing ? "Background Sync" : "Sync Status"}
                    </div>
                    {!isBackgroundSyncing && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="h-6 w-6 min-w-6"
                        onPress={handleForceSync}
                      >
                        <Icon
                          icon="solar:refresh-linear"
                          width={12}
                          height={12}
                        />
                      </Button>
                    )}
                    {isBackgroundSyncing && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="h-6 w-6 min-w-6 opacity-50"
                        isDisabled
                      >
                        <Icon
                          icon="solar:refresh-linear"
                          width={12}
                          height={12}
                        />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3 w-full min-w-72">
                    {isBackgroundSyncing && (
                      <>
                        <div className="flex justify-between items-center">
                          <div className="text-tiny font-medium">
                            {syncProgress.currentStep}
                          </div>
                          <div className="text-tiny text-foreground/60">
                            {Math.round(syncProgress.progress)}%
                          </div>
                        </div>
                        <Progress
                          value={syncProgress.progress}
                          color="primary"
                          size="sm"
                          className="w-full"
                        />
                      </>
                    )}

                    {!isBackgroundSyncing && (
                      <div className="text-tiny text-foreground/60 mb-2 w-full min-w-72 text-center py-4 border border-transparent">
                        All data is up to date
                      </div>
                    )}

                    {/* Individual sync statuses */}
                    <div className="space-y-2 mt-4 w-full min-w-72">
                      <div className="flex items-center justify-between text-xs">
                        <span>Profile</span>
                        <div className="flex items-center gap-1">
                          {syncStatus.profileSyncing ? (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          <span className="text-foreground/60">
                            {syncStatus.profileSyncing ? "Syncing" : "Synced"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span>Courses</span>
                        <div className="flex items-center gap-1">
                          {syncStatus.coursesSyncing ? (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          <span className="text-foreground/60">
                            {syncStatus.coursesSyncing ? "Syncing" : "Synced"}
                          </span>
                        </div>
                      </div>

                      {/* Attendance Section - Always show the header for consistent width */}
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span>Attendance</span>
                          <div className="flex items-center gap-1">
                            {Object.values(syncStatus.attendanceSyncing).some(
                              (syncing) => syncing,
                            ) ? (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                            <span className="text-foreground/60">
                              {Object.values(syncStatus.attendanceSyncing).some(
                                (syncing) => syncing,
                              )
                                ? "Syncing"
                                : "Synced"}
                            </span>
                          </div>
                        </div>

                        {/* Show individual course sync status only if any are syncing */}
                        {Object.values(syncStatus.attendanceSyncing).some(
                          (syncing) => syncing,
                        ) && (
                          <div className="mt-2">
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {Object.entries(syncStatus.attendanceSyncing).map(
                                ([courseId, syncing]) => {
                                  const course = user?.courses?.find(
                                    (c) => c.id === Number(courseId),
                                  );
                                  return syncing ? (
                                    <div
                                      key={courseId}
                                      className="flex items-center gap-1 text-xs ml-4"
                                    >
                                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                      <span className="text-foreground/60">
                                        {course?.shortname ||
                                          `Course ${courseId}`}
                                      </span>
                                    </div>
                                  ) : null;
                                },
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {isBackgroundSyncing && syncProgress.details && (
                      <div className="text-xs text-foreground/50 mt-3">
                        {syncProgress.details}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </ScrollShadow>
      </div>

      <main className="flex-1 flex w-full justify-center overflow-hidden">
        <div className="w-full max-w-[1024px] px-4 sm:px-8 py-6 overflow-y-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
