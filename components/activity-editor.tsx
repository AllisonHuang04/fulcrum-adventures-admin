"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ImageIcon, Video, Upload, X, Plus, Trash2 } from "lucide-react"
import { AdminHeader } from "./admin-header"
import { useRouter } from "next/navigation"
import { saveActivity, updateActivity, getActivityById } from "@/lib/activity-storage"
import { toast } from "@/hooks/use-toast"

interface ActivityEditorProps {
  mode: "create" | "edit"
  activityId?: string
}

const gradeLabels = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

export function ActivityEditor({ mode, activityId }: ActivityEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [duration, setDuration] = useState("")
  const [gradeRange, setGradeRange] = useState<[number, number]>([0, 12])
  const [groupSizeMin, setGroupSizeMin] = useState<string>("")
  const [groupSizeMax, setGroupSizeMax] = useState<string>("")
  const [groupSizeAny, setGroupSizeAny] = useState(false)
  const [energyLevel, setEnergyLevel] = useState("")
  const [setup, setSetup] = useState("")
  const [overview, setOverview] = useState("")
  const [prepContent, setPrepContent] = useState("")
  const [materialItems, setMaterialItems] = useState<{ id: string; text: string; checked: boolean }[]>([])
  const [newMaterialItem, setNewMaterialItem] = useState("")
  const [playContent, setPlayContent] = useState("")
  const [reflectionContent, setReflectionContent] = useState("")
  const [variationsContent, setVariationsContent] = useState("")
  const [safetyContent, setSafetyContent] = useState("")
  const [customTabs, setCustomTabs] = useState<{ id: string; name: string; content: string }[]>([])
  const [activeTab, setActiveTab] = useState("prep")
  const [showAddTab, setShowAddTab] = useState(false)
  const [newTabName, setNewTabName] = useState("")
  const [thumbnailUploaded, setThumbnailUploaded] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
    } else if (mode === "edit" && activityId) {
      const activity = getActivityById(activityId)
      if (activity) {
        setTitle(activity.title)
        setSelectedCategories(activity.category)
        setDuration(activity.duration)
        setEnergyLevel(activity.energyLevel)
        setSetup(activity.setup)
        setOverview(activity.overview)
        setPrepContent(activity.content.prep)
        if (activity.content.materials) {
          const items = activity.content.materials.split("\n").filter((item) => item.trim())
          setMaterialItems(
            items.map((item, index) => ({
              id: `${index}`,
              text: item,
              checked: false,
            })),
          )
        }
        setPlayContent(activity.content.play)
        setReflectionContent(activity.content.reflection)
        setVariationsContent(activity.content.additional.variations)
        setSafetyContent(activity.content.additional.safety)
        setCustomTabs(activity.content.customTabs)

        // Parse grade level
        const gradeParts = activity.gradeLevel.split("-")
        if (gradeParts.length === 2) {
          const minGrade = gradeParts[0].toLowerCase() === "k" ? 0 : Number.parseInt(gradeParts[0])
          const maxGrade = Number.parseInt(gradeParts[1])
          setGradeRange([minGrade, maxGrade])
        }

        // Parse group size
        const groupParts = activity.groupSize.split("-")
        if (activity.groupSize.toLowerCase() === "any") {
          setGroupSizeAny(true)
        } else if (groupParts.length === 2) {
          setGroupSizeMin(groupParts[0])
          setGroupSizeMax(groupParts[1])
        }
        // Set thumbnailUploaded based on existing activity
        if (activity.thumbnailUrl) {
          setThumbnailUploaded(true)
        }
      }
    }
  }, [router, mode, activityId])

  const categories = ["ice breaker", "team building", "problem solving", "reflection", "wellness", "energizer"]

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const addMaterialItem = () => {
    if (newMaterialItem.trim()) {
      setMaterialItems([
        ...materialItems,
        { id: Math.random().toString(36).substring(7), text: newMaterialItem.trim(), checked: false },
      ])
      setNewMaterialItem("")
    }
  }

  const removeMaterialItem = (id: string) => {
    setMaterialItems(materialItems.filter((item) => item.id !== id))
  }

  const updateMaterialItem = (id: string, text: string) => {
    setMaterialItems(materialItems.map((item) => (item.id === id ? { ...item, text } : item)))
  }

  const addCustomTab = () => {
    if (newTabName.trim()) {
      setCustomTabs([
        ...customTabs,
        {
          id: Math.random().toString(36).substring(7),
          name: newTabName,
          content: "",
        },
      ])
      setNewTabName("")
      setShowAddTab(false)
    }
  }

  const removeCustomTab = (id: string) => {
    setCustomTabs(customTabs.filter((tab) => tab.id !== id))
  }

  const updateCustomTabContent = (id: string, content: string) => {
    setCustomTabs(customTabs.map((tab) => (tab.id === id ? { ...tab, content } : tab)))
  }

  const formatGradeRange = () => {
    if (gradeRange[0] === gradeRange[1]) {
      return gradeLabels[gradeRange[0]]
    }
    return `${gradeLabels[gradeRange[0]]}-${gradeLabels[gradeRange[1]]}`
  }

  const handleSave = (status: "published" | "draft") => {
    // Validation
    if (!title.trim()) {
      toast({
        variant: "error",
        description: "Title is required",
      })
      return
    }

    if (selectedCategories.length === 0) {
      toast({
        variant: "error",
        description: "Please select at least one category",
      })
      return
    }

    // Removed gradeRange validation as it's handled by Slider
    // if (!gradeRange) {
    //   toast({
    //     variant: "error",
    //     description: "Grade level is required",
    //   })
    //   return
    // }

    if (!groupSizeAny && (!groupSizeMin || !groupSizeMax)) {
      toast({
        variant: "error",
        description: "Group size is required",
      })
      return
    }

    if (!thumbnailUploaded && !activityId) {
      toast({
        variant: "error",
        description: "Thumbnail image is required",
      })
      return
    }

    const groupSize = groupSizeAny ? "Any" : `${groupSizeMin}-${groupSizeMax}`

    const materialsString = materialItems.map((item) => item.text).join("\n")

    const activityData = {
      title,
      category: selectedCategories,
      energyLevel,
      duration,
      gradeLevel: formatGradeRange(),
      groupSize,
      setup,
      status,
      overview,
      content: {
        prep: prepContent,
        setup: setup, // This is the 'setup' field from the form, not setupContent
        materials: materialsString,
        play: playContent,
        reflection: reflectionContent,
        additional: {
          variations: variationsContent,
          safety: safetyContent,
        },
        customTabs,
      },
    }

    if (activityId) {
      updateActivity(activityId, activityData)
      toast({
        variant: "success",
        description: `Activity ${status === "published" ? "published" : "saved as draft"} successfully`,
      })
    } else {
      saveActivity(activityData)
      toast({
        variant: "success",
        description: `Activity ${status === "published" ? "published" : "saved as draft"} successfully`,
      })
    }

    router.push("/activities")
  }

  return (
    <div className="min-h-screen bg-surface">
      <AdminHeader />

      {/* Subheader with page actions - removed as per updates */}

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {mode === "create" ? "Create New Activity" : "Edit Activity"}
          </h2>
        </div>

        {/* Basic Info Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-6 text-lg font-semibold text-foreground">Basic Information</h3>

            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Activity Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter activity title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat}
                      variant={selectedCategories.includes(cat) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Grade Level <span className="text-destructive">*</span>
                </Label>
                <div className="mt-4 px-2">
                  <Slider
                    value={gradeRange}
                    onValueChange={(value) => setGradeRange(value as [number, number])}
                    min={0}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    {gradeLabels.map((label, index) => (
                      <span key={index} className="w-8 text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Selected: <span className="uppercase">{formatGradeRange()}</span>
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Group Size <span className="text-destructive">*</span>
                </Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="any-size"
                      checked={groupSizeAny}
                      onCheckedChange={(checked) => setGroupSizeAny(checked as boolean)}
                    />
                    <label htmlFor="any-size" className="cursor-pointer text-sm">
                      Any size
                    </label>
                  </div>
                  {!groupSizeAny && (
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={groupSizeMin}
                        onChange={(e) => setGroupSizeMin(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={groupSizeMax}
                        onChange={(e) => setGroupSizeMax(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">people</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <Label htmlFor="energy" className="text-sm font-medium">
                    Energy Level
                  </Label>
                  <Select value={energyLevel} onValueChange={setEnergyLevel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select energy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {energyLevel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEnergyLevel("")}
                      className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Duration
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="< 15 min">&lt; 15 min</SelectItem>
                      <SelectItem value="15-20 min">15-20 min</SelectItem>
                      <SelectItem value="30+ min">30+ min</SelectItem>
                    </SelectContent>
                  </Select>
                  {duration && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDuration("")}
                      className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="setup" className="text-sm font-medium">
                    Setup
                  </Label>
                  <Select value={setup} onValueChange={setSetup}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select setup type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prop">Prop</SelectItem>
                      <SelectItem value="no prop">No Prop</SelectItem>
                    </SelectContent>
                  </Select>
                  {setup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSetup("")}
                      className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="overview" className="text-sm font-medium">
                  Activity Overview
                </Label>
                <Textarea
                  id="overview"
                  placeholder="Brief description of the activity..."
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-6 text-lg font-semibold text-foreground">Media</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">
                  Thumbnail Image <span className="text-destructive">*</span>
                </Label>
                <div className="mt-2 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Upload thumbnail</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 bg-transparent"
                      onClick={() => setThumbnailUploaded(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Activity Video (optional)</Label>
                <div className="mt-2 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50">
                  <div className="text-center">
                    <Video className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Upload video</p>
                    <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">Activity Content</h3>
              {!showAddTab ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTab(true)}
                  className="w-full bg-transparent sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Tab
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Tab name"
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    className="h-9 w-full sm:w-40"
                  />
                  <Button size="sm" onClick={addCustomTab} className="h-9 bg-primary hover:bg-primary-light">
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddTab(false)} className="h-9">
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full flex-wrap justify-start">
                <TabsTrigger value="prep">Prep</TabsTrigger>
                <TabsTrigger value="play">Play</TabsTrigger>
                <TabsTrigger value="reflection">Reflection</TabsTrigger>
                <TabsTrigger value="additional">Additional</TabsTrigger>
                {customTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="group relative">
                    {tab.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCustomTab(tab.id)
                      }}
                      className="ml-2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="prep" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Preparation Instructions</Label>
                    <Textarea
                      placeholder="Describe what facilitators need to do before the activity..."
                      value={prepContent}
                      onChange={(e) => setPrepContent(e.target.value)}
                      className="mt-2 min-h-[150px]"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Setup</Label>
                    <p className="mt-1 text-xs text-muted-foreground">How to set up the space and arrange materials</p>
                    <Textarea
                      placeholder="Describe how to set up the space..."
                      value={setup}
                      onChange={(e) => setSetup(e.target.value)}
                      className="mt-2 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Materials Checklist</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Add items needed for this activity</p>
                    <div className="mt-3 space-y-3">
                      {materialItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Input
                            value={item.text}
                            onChange={(e) => updateMaterialItem(item.id, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterialItem(item.id)}
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new material item..."
                          value={newMaterialItem}
                          onChange={(e) => setNewMaterialItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addMaterialItem()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button onClick={addMaterialItem} size="sm" className="bg-primary hover:bg-primary-light">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="play" className="mt-6">
                <Label className="text-sm font-medium">Step-by-Step Instructions</Label>
                <Textarea
                  placeholder="Describe how to facilitate the activity..."
                  value={playContent}
                  onChange={(e) => setPlayContent(e.target.value)}
                  className="mt-2 min-h-[200px]"
                />
              </TabsContent>

              <TabsContent value="reflection" className="mt-6">
                <Label className="text-sm font-medium">Reflection & Debrief</Label>
                <Textarea
                  placeholder="Questions and prompts for reflection..."
                  value={reflectionContent}
                  onChange={(e) => setReflectionContent(e.target.value)}
                  className="mt-2 min-h-[200px]"
                />
              </TabsContent>

              <TabsContent value="additional" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Variations</Label>
                    <Textarea
                      placeholder="Alternative ways to run this activity..."
                      value={variationsContent}
                      onChange={(e) => setVariationsContent(e.target.value)}
                      className="mt-2 min-h-[150px]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Safety Notes</Label>
                    <Textarea
                      placeholder="Important safety considerations..."
                      value={safetyContent}
                      onChange={(e) => setSafetyContent(e.target.value)}
                      className="mt-2 min-h-[150px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {customTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  <Label className="text-sm font-medium">{tab.name}</Label>
                  <Textarea
                    placeholder={`Enter content for ${tab.name}...`}
                    value={tab.content}
                    onChange={(e) => updateCustomTabContent(tab.id, e.target.value)}
                    className="mt-2 min-h-[200px]"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => router.push("/activities")}
            className="w-full bg-transparent sm:w-auto"
          >
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave("draft")} className="w-full bg-transparent sm:w-auto">
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave("published")}
            className="w-full bg-primary hover:bg-primary-light sm:w-auto"
          >
            {mode === "create" ? "Publish Activity" : "Update Activity"}
          </Button>
        </div>
      </main>
    </div>
  )
}
