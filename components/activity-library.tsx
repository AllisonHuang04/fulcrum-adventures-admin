"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Pencil, Archive, Filter, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { AdminHeader } from "@/components/admin-header"
import { useRouter } from "next/navigation"
import { getActivities, updateActivity, deleteActivity, type Activity } from "@/lib/activity-storage"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

const energyColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  high: "bg-green-100 text-green-700 hover:bg-green-100",
}

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700 hover:bg-green-100",
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  archived: "bg-red-100 text-red-700 hover:bg-red-100",
}

export function ActivityLibrary() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [energyFilters, setEnergyFilters] = useState<string[]>([])
  const [durationFilters, setDurationFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkArchiveDialogOpen, setBulkArchiveDialogOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
    } else {
      setActivities(getActivities())
    }
  }, [router])

  const filteredAndSortedActivities = activities
    .filter((activity) => {
      const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || activity.status === statusFilter
      const matchesEnergy = energyFilters.length === 0 || energyFilters.includes(activity.energyLevel)
      const matchesDuration = durationFilters.length === 0 || durationFilters.includes(activity.duration)
      const matchesCategory =
        categoryFilters.length === 0 || activity.category.some((cat) => categoryFilters.includes(cat))
      return matchesSearch && matchesStatus && matchesEnergy && matchesDuration && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title)
      } else if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title)
      }
      return 0
    })

  const handleStatusChange = (activityId: string, newStatus: "published" | "draft" | "archived") => {
    const updated = updateActivity(activityId, { status: newStatus })
    if (updated) {
      setActivities(getActivities())
      toast({
        variant: "success",
        description: `Activity ${newStatus === "archived" ? "archived" : "updated"} successfully`,
      })
    }
  }

  const toggleEnergyFilter = (energy: string) => {
    setEnergyFilters((prev) => (prev.includes(energy) ? prev.filter((e) => e !== energy) : [...prev, energy]))
  }

  const toggleDurationFilter = (duration: string) => {
    setDurationFilters((prev) => (prev.includes(duration) ? prev.filter((d) => d !== duration) : [...prev, duration]))
  }

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilters((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const clearAllFilters = () => {
    setEnergyFilters([])
    setDurationFilters([])
    setCategoryFilters([])
  }

  const activeFilterCount = energyFilters.length + durationFilters.length + categoryFilters.length

  const toggleSelectActivity = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedActivities.length === filteredAndSortedActivities.length) {
      setSelectedActivities([])
    } else {
      setSelectedActivities(filteredAndSortedActivities.map((a) => a.id))
    }
  }

  const handleBulkDelete = () => {
    selectedActivities.forEach((id) => deleteActivity(id))
    setActivities(getActivities())
    setSelectedActivities([])
    setSelectMode(false)
    setBulkDeleteDialogOpen(false)
    toast({
      variant: "success",
      description: `${selectedActivities.length} activities deleted successfully`,
    })
  }

  const handleBulkArchive = () => {
    selectedActivities.forEach((id) => updateActivity(id, { status: "archived" }))
    setActivities(getActivities())
    setSelectedActivities([])
    setSelectMode(false)
    setBulkArchiveDialogOpen(false)
    toast({
      variant: "success",
      description: `${selectedActivities.length} activities archived successfully`,
    })
  }

  const handleDelete = (activityId: string) => {
    setActivityToDelete(activityId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (activityToDelete) {
      const success = deleteActivity(activityToDelete)
      if (success) {
        setActivities(getActivities())
        toast({
          variant: "success",
          description: "Activity deleted successfully",
        })
      }
      setActivityToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <AdminHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Top Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Activities</h2>
          <div className="flex gap-2">
            {!selectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectMode(true)}
                  className="w-full bg-transparent sm:w-auto"
                >
                  Select
                </Button>
                <Link href="/activities/new" className="w-full sm:w-auto">
                  <Button className="w-full bg-primary hover:bg-primary-light">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Activity
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectMode(false)
                    setSelectedActivities([])
                  }}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkArchiveDialogOpen(true)}
                  disabled={selectedActivities.length === 0}
                  className="bg-transparent"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive ({selectedActivities.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={selectedActivities.length === 0}
                  className="bg-transparent text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedActivities.length})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <p className="mb-2 text-xs font-semibold text-foreground">Energy Level</p>
                  <div className="space-y-2">
                    {["low", "medium", "high"].map((energy) => (
                      <div key={energy} className="flex items-center space-x-2">
                        <Checkbox
                          id={`energy-${energy}`}
                          checked={energyFilters.includes(energy)}
                          onCheckedChange={() => toggleEnergyFilter(energy)}
                        />
                        <label htmlFor={`energy-${energy}`} className="text-sm capitalize cursor-pointer">
                          {energy}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <p className="mb-2 text-xs font-semibold text-foreground">Duration</p>
                  <div className="space-y-2">
                    {["< 15 min", "15-20 min", "30+ min"].map((duration) => (
                      <div key={duration} className="flex items-center space-x-2">
                        <Checkbox
                          id={`duration-${duration}`}
                          checked={durationFilters.includes(duration)}
                          onCheckedChange={() => toggleDurationFilter(duration)}
                        />
                        <label htmlFor={`duration-${duration}`} className="text-sm cursor-pointer">
                          {duration}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <p className="mb-2 text-xs font-semibold text-foreground">Category</p>
                  <div className="space-y-2">
                    {["ice breaker", "team building", "problem solving", "reflection", "wellness", "energizer"].map(
                      (category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={categoryFilters.includes(category)}
                            onCheckedChange={() => toggleCategoryFilter(category)}
                          />
                          <label htmlFor={`category-${category}`} className="text-sm capitalize cursor-pointer">
                            {category}
                          </label>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {energyFilters.map((energy) => (
                <Badge key={energy} variant="secondary" className="capitalize">
                  {energy}
                  <button onClick={() => toggleEnergyFilter(energy)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {durationFilters.map((duration) => (
                <Badge key={duration} variant="secondary">
                  {duration}
                  <button onClick={() => toggleDurationFilter(duration)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {categoryFilters.map((category) => (
                <Badge key={category} variant="secondary" className="capitalize">
                  {category}
                  <button onClick={() => toggleCategoryFilter(category)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                {selectMode && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedActivities.length === filteredAndSortedActivities.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[150px] font-semibold">Title</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Category</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Grade Level</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Group Size</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Energy</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Duration</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Last Edited</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={selectMode ? 10 : 9} className="text-center text-muted-foreground">
                    No activities found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    {selectMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedActivities.includes(activity.id)}
                          onCheckedChange={() => toggleSelectActivity(activity.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {activity.category.map((cat) => (
                          <Badge key={cat} variant="secondary" className="w-fit text-xs capitalize">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground uppercase">{activity.gradeLevel}</TableCell>
                    <TableCell className="text-muted-foreground">{activity.groupSize}</TableCell>
                    <TableCell>
                      {activity.energyLevel && (
                        <Badge variant="secondary" className={energyColors[activity.energyLevel]}>
                          {activity.energyLevel.charAt(0).toUpperCase() + activity.energyLevel.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{activity.duration}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[activity.status]}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{activity.lastEdited}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/activities/${activity.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {activity.status !== "archived" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(activity.id, "archived")}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {activity.status === "archived" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(activity.id, "published")}>
                              Restore
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the activity from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedActivities.length} activities?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected activities from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkArchiveDialogOpen} onOpenChange={setBulkArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {selectedActivities.length} activities?</AlertDialogTitle>
            <AlertDialogDescription>
              The selected activities will be moved to archived status. You can restore them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchive}>Archive All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
