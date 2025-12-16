import { ActivityEditor } from "@/components/activity-editor"

export default function EditActivityPage({ params }: { params: { id: string } }) {
  return <ActivityEditor mode="edit" activityId={params.id} />
}
