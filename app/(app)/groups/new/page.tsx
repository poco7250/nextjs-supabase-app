import { GroupForm } from "@/components/groups/group-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createGroupAction } from "@/app/(app)/groups/actions";

/**
 * 그룹 생성 페이지 (F001). 만든 사람은 자동으로 owner가 되고, 생성 후 그룹 홈으로 이동한다.
 */
export default function NewGroupPage() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="sr-only">그룹 만들기</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 그룹</CardTitle>
          <CardDescription className="break-keep">
            그룹을 만들면 초대 링크가 함께 생겨요. 만든 사람은 소유자가 돼요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm action={createGroupAction} submitLabel="그룹 만들기" />
        </CardContent>
      </Card>
    </section>
  );
}
