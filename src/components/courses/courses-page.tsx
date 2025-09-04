"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import { LayoutGrid, List, Search, SortAsc } from "lucide-react";
import { useMemo, useState } from "react";
import useUserStore from "@/utils/userStore";
import CourseGrid from "./course-grid";
import CourseList from "./course-list";

type SortOption = "name" | "progress" | "category" | "recent";
type FilterOption = "all" | "favorites" | "in-progress" | "completed";

export default function CoursesPage() {
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filterBy] = useState<FilterOption>("all");
  const { user, isLoading } = useUserStore();

  const filteredAndSortedCourses = useMemo(() => {
    if (!user?.courses) return [];

    let courses = [...user.courses];

    // Apply search filter
    if (searchQuery) {
      courses = courses.filter(
        (course) =>
          course.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.shortname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.coursecategory
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Apply category filter
    switch (filterBy) {
      case "favorites":
        courses = courses.filter((course) => course.isfavourite);
        break;
      case "in-progress":
        courses = courses.filter(
          (course) =>
            course.hasprogress && course.progress > 0 && course.progress < 100,
        );
        break;
      case "completed":
        courses = courses.filter(
          (course) => course.hasprogress && course.progress === 100,
        );
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        courses.sort((a, b) => a.fullname.localeCompare(b.fullname));
        break;
      case "progress":
        courses.sort((a, b) => b.progress - a.progress);
        break;
      case "category":
        courses.sort((a, b) =>
          a.coursecategory.localeCompare(b.coursecategory),
        );
        break;
      case "recent":
        courses.sort((a, b) => b.id - a.id);
        break;
    }

    return courses;
  }, [user?.courses, searchQuery, sortBy, filterBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              My Courses
            </h1>
            <p className="text-sm text-foreground/60">
              Manage and track your academic progress across all enrolled
              courses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              size="sm"
              aria-label="Courses Display Mode"
              selectedKey={displayMode}
              variant="light"
              onSelectionChange={(selected) =>
                setDisplayMode(selected as "grid" | "list")
              }
            >
              <Tab
                key="grid"
                title={
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={16} />
                    <span className="hidden sm:inline">Grid</span>
                  </div>
                }
              />
              <Tab
                key="list"
                title={
                  <div className="flex items-center gap-2">
                    <List size={16} />
                    <span className="hidden sm:inline">List</span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={16} className="text-default-400" />}
            className="sm:max-w-xs"
            variant="bordered"
            size="sm"
          />

          <div className="flex items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="bordered"
                  size="sm"
                  startContent={<SortAsc size={16} />}
                >
                  Sort:{" "}
                  {sortBy === "name"
                    ? "Name"
                    : sortBy === "progress"
                      ? "Progress"
                      : sortBy === "category"
                        ? "Category"
                        : "Recent"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) =>
                  setSortBy(Array.from(keys)[0] as SortOption)
                }
                selectionMode="single"
              >
                <DropdownItem key="name">Name</DropdownItem>
                <DropdownItem key="progress">Progress</DropdownItem>
                <DropdownItem key="category">Category</DropdownItem>
                <DropdownItem key="recent">Recent</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {displayMode === "grid" ? (
        <CourseGrid courses={filteredAndSortedCourses} />
      ) : (
        <CourseList courses={filteredAndSortedCourses} />
      )}
    </div>
  );
}
