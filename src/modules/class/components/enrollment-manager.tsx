// مدیریت هنرجویان کلاس — کامپوننت سرور (فرم‌های ساده با Server Action)
// افزودن/حذف = فعال/غیرفعال کردن Enrollment (soft — سابقه حضور F5 می‌ماند)
import { Button } from "@/components/ui/button";
import {
  addStudentToClassAction,
  removeStudentFromClassAction,
} from "../actions/class.actions";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function EnrollmentManager({
  classId,
  classType,
  enrollments,
  availableStudents,
}: {
  classId: number;
  classType: string;
  enrollments: {
    studentId: number;
    isActive: boolean;
    student: { fullName: string; phone: string };
  }[];
  /** هنرجویان فعال که ثبت‌نام فعالِ در این کلاس ندارند */
  availableStudents: { id: number; fullName: string }[];
}) {
  const active = enrollments.filter((e) => e.isActive);
  const inactive = enrollments.filter((e) => !e.isActive);
  const privateFull = classType === "PRIVATE" && active.length >= 1;

  return (
    <div className="space-y-3 text-sm">
      {active.length === 0 ? (
        <p className="text-muted-foreground">هنرجویی ثبت‌نام فعال ندارد.</p>
      ) : (
        active.map((e) => (
          <div
            key={e.studentId}
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <span className="font-bold">{e.student.fullName}</span>
            <span className="text-xs text-muted-foreground" dir="ltr">
              {e.student.phone}
            </span>
            <form action={removeStudentFromClassAction} className="ms-auto">
              <input type="hidden" name="classId" value={classId} />
              <input type="hidden" name="studentId" value={e.studentId} />
              <Button type="submit" size="sm" variant="outline">
                حذف
              </Button>
            </form>
          </div>
        ))
      )}

      {inactive.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">ثبت‌نام‌های غیرفعال (سابقه حفظ شده):</p>
          {inactive.map((e) => (
            <div
              key={e.studentId}
              className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 opacity-70"
            >
              <span>{e.student.fullName}</span>
              <form action={addStudentToClassAction} className="ms-auto">
                <input type="hidden" name="classId" value={classId} />
                <input type="hidden" name="studentId" value={e.studentId} />
                <Button type="submit" size="sm" variant="ghost">
                  افزودن مجدد
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      {privateFull ? (
        <p className="text-xs text-muted-foreground">
          کلاس خصوصی فقط یک هنرجو دارد — برای تغییر، اول هنرجوی فعلی را حذف کنید.
        </p>
      ) : availableStudents.length > 0 ? (
        <form action={addStudentToClassAction} className="flex gap-2">
          <input type="hidden" name="classId" value={classId} />
          <select name="studentId" className={selectCls} aria-label="انتخاب هنرجو">
            {availableStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            افزودن هنرجو
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          هنرجوی فعال دیگری برای افزودن موجود نیست.
        </p>
      )}
    </div>
  );
}
