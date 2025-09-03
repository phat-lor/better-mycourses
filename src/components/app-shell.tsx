"use client";

import {
  Avatar,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Chip,
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
  ScrollShadow,
  Tab,
  Tabs,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { FastForward } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useUserStore from "@/utils/userStore";
import { ThemeSwitcher } from "./theme-switcher";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const routes = [
    { key: "dashboard", title: "Dashboard", href: "/app/home" },
    { key: "courses", title: "Courses", href: "/app/courses" },
    { key: "assignments", title: "Assignments", href: "/app/assignments" },
    { key: "grades", title: "Grades", href: "/app/grades" },
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
                <DropdownItem key="logout" color="danger">
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
                      <Chip size="sm">{user?.courses?.length || 0}</Chip>
                    </div>
                  ) : (
                    route.title
                  )
                }
              />
            ))}
          </Tabs>
          <div className="flex items-center gap-4">
            <Tooltip content="Quick actions" placement="bottom">
              <Button isIconOnly radius="full" size="sm" variant="faded">
                <Icon
                  className="text-default-500"
                  icon="lucide:plus"
                  width={16}
                />
              </Button>
            </Tooltip>
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
