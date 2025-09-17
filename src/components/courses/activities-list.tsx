"use client";

import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { Calendar, ExternalLink, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseActivity } from "@/utils/moodleParser";
import { getAssignmentStatusChip, getQuizStatusChip } from "./status-chips";
import type { StoreCourse } from "./types";

interface ActivitiesListProps {
  course: StoreCourse;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "quiz":
      return "📝";
    case "assign":
      return "📄";
    case "resource":
      return "📎";
    case "forum":
      return "💬";
    case "url":
      return "🔗";
    case "folder":
      return "📁";
    default:
      return "📋";
  }
};

const getActivityTypeLabel = (type: string) => {
  switch (type) {
    case "quiz":
      return "Quiz";
    case "assign":
      return "Assignment";
    case "resource":
      return "Resource";
    case "forum":
      return "Forum";
    case "url":
      return "Link";
    case "folder":
      return "Folder";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export default function ActivitiesList({ course }: ActivitiesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(new Set<string>());

  const allActivities = useMemo(() => {
    if (!course.content) return [] as CourseActivity[];
    return course.content.sections.flatMap((s) => s.activities);
  }, [course.content]);

  const activityTypes = useMemo(() => {
    const types = new Set(allActivities.map((a) => a.type));
    return Array.from(types).sort();
  }, [allActivities]);

  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

    // Filter out activities without URLs (locked/unavailable)
    filtered = filtered.filter((activity) => activity.url);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((activity) =>
        activity.name.toLowerCase().includes(query),
      );
    }

    // Apply type filter
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((activity) =>
        selectedTypes.has(activity.type),
      );
    }

    return filtered;
  }, [allActivities, searchQuery, selectedTypes]);

  const toggleTypeFilter = (type: string) => {
    const newSelectedTypes = new Set(selectedTypes);
    if (newSelectedTypes.has(type)) {
      newSelectedTypes.delete(type);
    } else {
      newSelectedTypes.add(type);
    }
    setSelectedTypes(newSelectedTypes);
  };

  const getActivityStatusChip = (activity: CourseActivity) => {
    if (activity.type === "quiz") {
      return getQuizStatusChip(activity.quizInfo, activity.dueDate, activity);
    } else if (activity.type === "assign") {
      return getAssignmentStatusChip(activity.assignmentInfo, activity.dueDate);
    }
    return null;
  };

  // Group activities by section
  const activitiesBySection = useMemo(() => {
    if (!course.content) return [];

    return course.content.sections
      .map((section) => ({
        ...section,
        activities: section.activities.filter((activity) =>
          filteredActivities.includes(activity),
        ),
      }))
      .filter((section) => section.activities.length > 0);
  }, [course.content, filteredActivities]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="border border-divider">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold flex-1">All Activities</h2>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="w-4 h-4 text-foreground/50" />}
              endContent={
                searchQuery && (
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )
              }
              size="sm"
              variant="bordered"
            />

            {showFilters && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground/80">
                  Filter by Type:
                </div>
                <div className="flex flex-wrap gap-2">
                  {activityTypes.map((type) => (
                    <Chip
                      key={type}
                      size="sm"
                      variant={selectedTypes.has(type) ? "solid" : "flat"}
                      color={selectedTypes.has(type) ? "primary" : "default"}
                      className="cursor-pointer"
                      onClick={() => toggleTypeFilter(type)}
                    >
                      {getActivityIcon(type)} {getActivityTypeLabel(type)}
                    </Chip>
                  ))}
                </div>
                {selectedTypes.size > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setSelectedTypes(new Set())}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Activities by Section */}
      {activitiesBySection.map((section) => (
        <Card key={section.id} className="border border-divider">
          <CardHeader>
            <div>
              <h3 className="text-lg font-semibold">{section.name}</h3>
              {section.summary && (
                <p className="text-sm text-foreground/60 mt-1">
                  {section.summary}
                </p>
              )}
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-divider">
              {section.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="font-medium text-foreground truncate"
                          title={activity.name}
                        >
                          {activity.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip size="sm" variant="flat" color="default">
                            {getActivityTypeLabel(activity.type)}
                          </Chip>
                          {activity.dueDate && (
                            <>
                              <span className="text-xs text-foreground/40">
                                •
                              </span>
                              <span className="text-xs text-foreground/60 flex items-center gap-1">
                                <Calendar size={12} />
                                Due {activity.dueDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getActivityStatusChip(activity)}
                    {activity.url && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => window.open(activity.url, "_blank")}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {filteredActivities.length === 0 && (
        <Card className="border border-divider">
          <CardBody className="text-center py-8">
            <p className="text-foreground/60">
              {searchQuery.trim() || selectedTypes.size > 0
                ? "No activities match your search or filter criteria."
                : "No activities found."}
            </p>
            {(searchQuery.trim() || selectedTypes.size > 0) && (
              <Button
                size="sm"
                variant="light"
                onPress={() => {
                  setSearchQuery("");
                  setSelectedTypes(new Set());
                }}
                className="mt-2"
              >
                Clear all filters
              </Button>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
