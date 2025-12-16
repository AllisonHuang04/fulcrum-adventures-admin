export interface Activity {
    id: string
    title: string
    category: string[]
    energyLevel: string
    duration: string
    gradeLevel: string
    groupSize: string
    setup: string
    status: "published" | "draft" | "archived"
    overview: string
    lastEdited: string
    createdAt: Date
    thumbnailUrl?: string
    content: {
      prep: string
      setup: string
      materials: string
      play: string
      reflection: string
      additional: {
        variations: string
        safety: string
      }
    }
    customTabs: { id: string; name: string; content: string }[]
  }
  
  const STORAGE_KEY = "fulcrum_activities"
  
  export function getActivities(): Activity[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      // Initialize with mock data
      const mockActivities: Activity[] = [
        {
          id: "1",
          title: "Circle of Friends",
          category: ["ice breaker", "team building"],
          energyLevel: "medium",
          duration: "15-20 min",
          gradeLevel: "6-8",
          groupSize: "15+",
          setup: "no prop",
          status: "published",
          overview: "A great icebreaker to help students connect and learn names",
          lastEdited: "2 days ago",
          createdAt: new Date("2024-01-15"),
          thumbnailUrl: "/placeholder.svg?height=200&width=300",
          content: {
            prep: "",
            setup: "",
            materials: "",
            play: "",
            reflection: "",
            additional: { variations: "", safety: "" },
          },
          customTabs: [],
        },
        {
          id: "2",
          title: "Human Knot",
          category: ["problem solving"],
          energyLevel: "high",
          duration: "15-20 min",
          gradeLevel: "9-12",
          groupSize: "<15",
          setup: "no prop",
          status: "published",
          overview: "A physical problem-solving activity that requires teamwork",
          lastEdited: "1 week ago",
          createdAt: new Date("2024-01-10"),
          content: {
            prep: "",
            setup: "",
            materials: "",
            play: "",
            reflection: "",
            additional: { variations: "", safety: "" },
          },
          customTabs: [],
        },
        {
          id: "3",
          title: "Mindful Breathing",
          category: ["reflection", "wellness"],
          energyLevel: "low",
          duration: "< 15 min",
          gradeLevel: "k-2",
          groupSize: "15+",
          setup: "no prop",
          status: "draft",
          overview: "A calming mindfulness exercise for stress relief",
          lastEdited: "3 days ago",
          createdAt: new Date("2024-01-20"),
          content: {
            prep: "",
            setup: "",
            materials: "",
            play: "",
            reflection: "",
            additional: { variations: "", safety: "" },
          },
          customTabs: [],
        },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockActivities))
      return mockActivities
    }
    return JSON.parse(data)
  }
  
  export function saveActivity(activity: Omit<Activity, "id" | "createdAt" | "lastEdited">): Activity {
    const activities = getActivities()
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      lastEdited: "Just now",
    }
    activities.push(newActivity)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
    return newActivity
  }
  
  export function updateActivity(id: string, updates: Partial<Activity>): Activity | null {
    const activities = getActivities()
    const index = activities.findIndex((a) => a.id === id)
    if (index === -1) return null
  
    activities[index] = {
      ...activities[index],
      ...updates,
      lastEdited: "Just now",
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
    return activities[index]
  }
  
  export function getActivityById(id: string): Activity | null {
    const activities = getActivities() 
    return activities.find((a) => a.id === id) || null
  }
  
  export function deleteActivity(id: string): boolean {
    const activities = getActivities()
    const filtered = activities.filter((a) => a.id !== id)
    if (filtered.length === activities.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }
  