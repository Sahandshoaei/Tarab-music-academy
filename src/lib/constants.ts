// ═══════════════════════════════════════════════════════════════════════════
//  برچسب‌های فارسی enum ها — تک منبع حقیقت متن‌های نمایشی
//  (همه فرم‌ها/لیست‌های فاز ۶ از همین‌ها می‌خوانند — متن تکراری ممنوع)
// ═══════════════════════════════════════════════════════════════════════════
import type {
  AttendanceStatus,
  ClassType,
  GeneralExpenseCategory,
  ReferralSource,
  ScheduleType,
  SessionStatus,
  SmsRecipientPhone,
  Weekday,
} from "@prisma/client";

export const classTypeLabels: Record<ClassType, string> = {
  PRIVATE: "خصوصی",
  GROUP: "گروهی",
  SEMI_GROUP: "نیمه‌گروهی",
  PRACTICE: "تمرینی",
};

export const scheduleTypeLabels: Record<ScheduleType, string> = {
  WEEKLY: "تکرارشونده هفتگی",
  SINGLE: "تک‌جلسه (تاریخ دلخواه)",
  AD_HOC: "جلسه‌به‌جلسه",
};

export const weekdayLabels: Record<Weekday, string> = {
  SATURDAY: "شنبه",
  SUNDAY: "یکشنبه",
  MONDAY: "دوشنبه",
  TUESDAY: "سه‌شنبه",
  WEDNESDAY: "چهارشنبه",
  THURSDAY: "پنجشنبه",
  FRIDAY: "جمعه",
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "حاضر",
  ABSENT: "غایب",
  EXCUSED: "موجه",
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  SCHEDULED: "برنامه‌ریزی‌شده",
  CANCELLED: "لغوشده",
};

export const referralSourceLabels: Record<ReferralSource, string> = {
  FRIENDS: "معرفی دوستان",
  INSTAGRAM: "اینستاگرام",
  SIGN: "تابلو",
  OTHER: "سایر",
};

export const smsRecipientPhoneLabels: Record<SmsRecipientPhone, string> = {
  STUDENT: "شماره خود هنرجو",
  GUARDIAN: "شماره قوم نزدیک",
};


export const generalExpenseCategoryLabels: Record<GeneralExpenseCategory, string> = {
  CLEANING: "نظافت",
  ELECTRICITY: "برق",
  GAS: "گاز",
  WATER: "آب",
  RENT: "اجاره",
  OTHER: "سایر",
};

export const generalExpenseCategoryOptions: { value: GeneralExpenseCategory; label: string }[] = [
  { value: "CLEANING", label: "نظافت" },
  { value: "ELECTRICITY", label: "برق" },
  { value: "GAS", label: "گاز" },
  { value: "WATER", label: "آب" },
  { value: "RENT", label: "اجاره" },
  { value: "OTHER", label: "سایر" },
];
