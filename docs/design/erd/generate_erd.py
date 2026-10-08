#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
"""تولید دیاگرام ERD سامانه مدیریت آموزشگاه موسیقی با Graphviz"""

# ─── رنگ‌بندی دامنه‌ها ───
C_AUTH   = ("#312E81", "#EEF2FF")   # header, bg  — احراز هویت
C_PERSON = ("#0F766E", "#F0FDFA")   # اشخاص و سازها
C_ORG    = ("#B45309", "#FFFBEB")   # ترم/اتاق/تنظیمات
C_SCHED  = ("#1D4ED8", "#EFF6FF")   # زمان‌بندی (هسته‌ای)
C_ATT    = ("#7E22CE", "#FAF5FF")   # حضور و غیاب
C_FIN    = ("#6B7280", "#F3F4F6")   # MVP-2 مالی
C_SMS    = ("#BE123C", "#FFF1F2")   # MVP-3 پیامک

FONT = "Vazirmatn"

# ─── موجودیت‌ها ───
# rows: (marker, name, type)  marker ∈ {"", PK, FK, UQ, "PK·FK", "FK·UQ"}
E = []

def ent(name, fa, color, cluster, rows, mvp2=False):
    E.append(dict(name=name, fa=fa, color=color, cluster=cluster, rows=rows, mvp2=mvp2))

TS = ("", "createdAt / updatedAt", "DateTime")  # ستون‌های زمانی مشترک

ent("User", "کاربر", C_AUTH, "auth", [
    ("PK", "id", "String (cuid)"),
    ("", "name", "String?"),
    ("UQ", "email", "String"),
    ("", "passwordHash", "String?"),
    ("", "role", "Role"),
    ("", "isActive", "Boolean"),
    TS,
])
ent("Account", "حساب OAuth", C_AUTH, "auth", [
    ("PK", "id", "String"),
    ("FK", "userId", "String"),
    ("", "provider + providerAccountId", "String"),
    ("", "type / tokens …", "—"),
])
ent("Session", "نشست", C_AUTH, "auth", [
    ("PK", "id", "String"),
    ("UQ", "sessionToken", "String"),
    ("FK", "userId", "String"),
    ("", "expires", "DateTime"),
])
ent("VerificationToken", "توکن تأیید", C_AUTH, "auth", [
    ("PK", "identifier + token", "String"),
    ("", "expires", "DateTime"),
])

ent("Instrument", "ساز / رشته", C_PERSON, "person", [
    ("PK", "id", "Int"),
    ("UQ", "name", "String"),
    ("", "sortOrder", "Int"),
    ("", "isActive", "Boolean"),
    TS,
])
ent("Teacher", "استاد", C_PERSON, "person", [
    ("PK", "id", "Int"),
    ("", "fullName", "String"),
    ("", "phone", "String"),
    ("FK·UQ", "userId", "String?"),
    ("", "notes", "String?"),
    ("", "isActive ⟵ Soft Delete", "Boolean"),
    TS,
])
ent("Student", "هنرجو", C_PERSON, "person", [
    ("PK", "id", "Int"),
    ("", "fullName", "String"),
    ("UQ", "nationalId (کد ملی)", "String"),
    ("", "phone", "String"),
    ("", "guardianPhone", "String"),
    ("", "address", "String?"),
    ("", "registrationDate", "Date"),
    ("", "referralSource", "Enum?"),
    ("FK·UQ", "userId", "String?"),
    ("", "isActive ⟵ Soft Delete", "Boolean"),
    TS,
])
ent("TeacherInstrument", "سازهای تدریسی", C_PERSON, "person", [
    ("PK·FK", "teacherId", "Int"),
    ("PK·FK", "instrumentId", "Int"),
    ("", "createdAt", "DateTime"),
])
ent("StudentInstrument", "سازهای آموزشی", C_PERSON, "person", [
    ("PK·FK", "studentId", "Int"),
    ("PK·FK", "instrumentId", "Int"),
    ("", "createdAt", "DateTime"),
])

ent("Term", "ترم تحصیلی", C_ORG, "org", [
    ("PK", "id", "Int"),
    ("", "name", "String"),
    ("", "startDate", "Date"),
    ("", "endDate", "Date"),
    ("", "isActive (حداکثر یک فعال)", "Boolean"),
    TS,
])
ent("Room", "اتاق", C_ORG, "org", [
    ("PK", "id", "Int"),
    ("UQ", "name", "String"),
    ("", "isActive", "Boolean"),
    TS,
])
ent("SchoolSettings", "تنظیمات آموزشگاه", C_ORG, "org", [
    ("PK", "id (همیشه ۱)", "Int"),
    ("", "schoolName", "String?"),
    ("", "openTime", "String (HH:mm)"),
    ("", "closeTime", "String (HH:mm)"),
    ("", "closedDays", "Weekday[]"),
])

ent("Class", "کلاس (سری)", C_SCHED, "sched", [
    ("PK", "id", "Int"),
    ("", "title", "String?"),
    ("", "type", "ClassType"),
    ("", "scheduleType", "ScheduleType"),
    ("FK", "teacherId", "Int"),
    ("FK", "roomId", "Int"),
    ("FK", "instrumentId", "Int"),
    ("FK", "termId", "Int"),
    ("", "weekday (فقط WEEKLY)", "Weekday?"),
    ("", "startTime / endTime", "String?"),
    ("", "isActive ⟵ Soft Delete", "Boolean"),
    TS,
])
ent("ClassSession", "جلسه", C_SCHED, "sched", [
    ("PK", "id", "Int"),
    ("FK", "classId", "Int"),
    ("", "date", "Date"),
    ("", "startTime / endTime", "String (HH:mm)"),
    ("FK", "roomId ⟵ غیرنرمال", "Int"),
    ("FK", "teacherId ⟵ غیرنرمال", "Int"),
    ("", "status", "SessionStatus"),
    ("", "isOverridden", "Boolean"),
    TS,
])
ent("Enrollment", "ثبت‌نام در کلاس", C_SCHED, "sched", [
    ("PK", "id", "Int"),
    ("FK·UQ", "classId + studentId", "Int"),
    ("", "isActive", "Boolean"),
    ("", "enrolledAt", "DateTime"),
])

ent("Attendance", "حضور و غیاب", C_ATT, "att", [
    ("PK", "id", "Int"),
    ("FK·UQ", "sessionId + studentId", "Int"),
    ("", "status", "AttendanceStatus"),
    ("", "note", "String?"),
    ("FK", "recordedById", "String?"),
    ("", "recordedAt", "DateTime"),
])

ent("Invoice", "فاکتور شهریه", C_FIN, "fin", [
    ("PK", "id", "Int"),
    ("FK", "studentId", "Int"),
    ("FK", "termId", "Int"),
    ("", "totalAmount", "Int (تومان)"),
    ("", "issuedAt", "DateTime"),
    TS,
], mvp2=True)
ent("Installment", "قسط", C_FIN, "fin", [
    ("PK", "id", "Int"),
    ("FK", "invoiceId", "Int"),
    ("", "amount", "Int (تومان)"),
    ("", "dueDate", "Date"),
    ("", "position", "Int"),
    TS,
], mvp2=True)
ent("Payment", "پرداخت", C_FIN, "fin", [
    ("PK", "id", "Int"),
    ("FK", "studentId", "Int"),
    ("", "amount", "Int (تومان)"),
    ("", "method", "PaymentMethod?"),
    ("", "paidAt", "DateTime"),
    TS,
], mvp2=True)
ent("PaymentInstallment", "تخصیص پرداخت", C_FIN, "fin", [
    ("PK·FK", "paymentId", "Int"),
    ("PK·FK", "installmentId", "Int"),
    ("", "appliedAmount", "Int"),
], mvp2=True)

# ─── MVP-3: سرویس پیامک (F7) ───
ent("SmsTemplate", "قالب پیامک", C_SMS, "sms", [
    ("PK", "id", "Int"),
    ("UQ", "title (عنوان)", "String"),
    ("", "body (متغیرها)", "String"),
    ("", "isActive", "Boolean"),
    TS,
], mvp2=True)
ent("SmsBatch", "دسته ارسال", C_SMS, "sms", [
    ("PK", "id", "String (cuid)"),
    ("", "label", "String"),
    ("", "audienceType", "Enum"),
    ("", "audienceRef", "String?"),
    ("", "totalCount", "Int"),
    ("FK", "sentById", "String"),
    ("", "createdAt", "DateTime"),
], mvp2=True)
ent("SmsMessage", "پیامک", C_SMS, "sms", [
    ("PK", "id", "Int"),
    ("FK", "batchId", "String"),
    ("FK", "studentId", "Int"),
    ("", "phone", "String"),
    ("", "phoneTarget", "Enum"),
    ("FK", "templateId", "Int?"),
    ("", "body ⟵ Snapshot", "String"),
    ("", "status", "SmsStatus"),
    ("", "providerRef", "String?"),
    ("", "sentAt / deliveredAt", "DateTime?"),
], mvp2=True)

# ─── روابط ───
# (from, to, label, style)  — جهت یال: از سمت «۱» به سمت «چند»
R = [
    ("User", "Account", "", "solid"),
    ("User", "Session", "", "solid"),
    ("User", "Teacher", "پروفایل — فاز آینده", "dashed"),
    ("User", "Student", "پروفایل — فاز آینده", "dashed"),
    ("Teacher", "TeacherInstrument", "تدریس", "solid"),
    ("Instrument", "TeacherInstrument", "", "solid"),
    ("Student", "StudentInstrument", "می‌آموزد", "solid"),
    ("Instrument", "StudentInstrument", "", "solid"),
    ("Teacher", "Class", "دقیقاً یک استاد", "solid"),
    ("Room", "Class", "اتاق پیش‌فرض", "solid"),
    ("Instrument", "Class", "سازِ کلاس", "solid"),
    ("Term", "Class", "ترم فعال", "solid"),
    ("Class", "ClassSession", "تولید جلسات", "solid"),
    ("Room", "ClassSession", "اتاق جلسه", "solid"),
    ("Teacher", "ClassSession", "استاد جلسه", "solid"),
    ("Class", "Enrollment", "ثبت‌نام", "solid"),
    ("Student", "Enrollment", "", "solid"),
    ("ClassSession", "Attendance", "ثبت وضعیت", "solid"),
    ("Student", "Attendance", "سابقه", "solid"),
    ("User", "Attendance", "ثبت‌کننده", "dashed"),
    # MVP-2
    ("Student", "Invoice", "شهریه", "dashed"),
    ("Term", "Invoice", "", "dashed"),
    ("Invoice", "Installment", "اقساط", "dashed"),
    ("Student", "Payment", "پرداخت", "dashed"),
    ("Payment", "PaymentInstallment", "تخصیص", "dashed"),
    ("Installment", "PaymentInstallment", "", "dashed"),
    # MVP-3 — پیامک
    ("User", "SmsBatch", "ارسال‌کننده", "dashed"),
    ("Student", "SmsMessage", "گیرنده", "dashed"),
    ("SmsBatch", "SmsMessage", "", "dashed"),
    ("SmsTemplate", "SmsMessage", "مبنا", "dashed"),
]

CLUSTERS = [
    ("auth",   "احراز هویت — Auth.js (F1)", "#C7D2FE"),
    ("person", "اشخاص و سازها (F2, F3)", "#99F6E4"),
    ("org",    "ترم، اتاق و تنظیمات (F0)", "#FDE68A"),
    ("sched",  "زمان‌بندی و برنامه کلاسی (F4) — فیچر هسته‌ای", "#BFDBFE"),
    ("att",    "حضور و غیاب (F5)", "#E9D5FF"),
    ("fin",    "MVP-2 — مدیریت مالی (F6) — فاز بعد", "#D1D5DB"),
    ("sms",    "MVP-3 — سرویس پیامک (F7) — فاز بعد", "#FECDD3"),
]

ENT = {e["name"]: e for e in E}


def node_label(e):
    head, bg = e["color"]
    rows = ""
    for m, n, t in e["rows"]:
        if m:
            marker_cell = f'<TD ALIGN="CENTER" BGCOLOR="#F8FAFC" WIDTH="52"><FONT POINT-SIZE="9" COLOR="#64748B"><B>{m}</B></FONT></TD>'
        else:
            marker_cell = '<TD ALIGN="CENTER" BGCOLOR="#F8FAFC" WIDTH="52"> </TD>'
        rows += (
            f'<TR>'
            f'{marker_cell}'
            f'<TD ALIGN="LEFT" CELLPADDING="3"><FONT POINT-SIZE="11">{n}</FONT></TD>'
            f'<TD ALIGN="LEFT" BGCOLOR="#F8FAFC"><FONT POINT-SIZE="9" COLOR="#64748B">{t}</FONT></TD>'
            f'</TR>'
        )
    style = "ROUNDED,DASHED" if e["mvp2"] else "ROUNDED"
    return (
        f'<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="2" BGCOLOR="{bg}" COLOR="{head}" STYLE="{style}">'
        f'<TR><TD COLSPAN="3" BGCOLOR="{head}" CELLPADDING="6">'
        f'<FONT COLOR="white" POINT-SIZE="13"><B>{e["name"]}</B></FONT>'
        f'<FONT COLOR="#E0E7FF" POINT-SIZE="11"> — {e["fa"]}</FONT>'
        f'</TD></TR>{rows}</TABLE>>'
    )


def build_dot():
    out = [
        "digraph ERD {",
        '  graph [rankdir=TB, splines=spline, nodesep=0.55, ranksep=0.9, newrank=true,',
        '         fontname="%s", labelloc="t", label=<<B>سامانه مدیریت آموزشگاه موسیقی — دیاگرام ER (فاز ۳)</B><BR/><FONT POINT-SIZE="11">PostgreSQL + Prisma — ۲۳ جدول · ۱۱ enum · مرجع: 03-database-design.md · 05-sms-feature.md</FONT>>, fontsize=20];' % FONT,
        '  node [shape=plaintext, fontname="%s"];' % FONT,
        '  edge [fontname="%s", fontsize=10, color="#475569", dir=both, arrowtail=tee, arrowhead=crow, penwidth=1.4];' % FONT,
    ]

    for name, e in ENT.items():
        out.append(f'  "{name}" [label={node_label(e)}];')

    # خوشه‌ها
    for cid, label, color in CLUSTERS:
        members = [e["name"] for e in E if e["cluster"] == cid]
        style = "dashed" if cid == "fin" else "solid"
        out.append(f'  subgraph cluster_{cid} {{')
        out.append(f'    label=<<B>{label}</B>>; fontsize=14; fontcolor="#334155"; color="{color}"; style="{style}"; penwidth=2; margin=16;')
        for m in members:
            out.append(f'    "{m}";')
        out.append("  }")

    # یال‌ها
    for a, b, label, style in R:
        color = "#9CA3AF" if style == "dashed" else "#475569"
        penw = "1.2" if style == "dashed" else "1.6"
        lbl = f' label=<<FONT COLOR="#64748B">{label}</FONT>>' if label else ""
        out.append(f'  "{a}" -> "{b}" [style={style}, color="{color}", penwidth={penw},{lbl}];')

    # راهنما (Legend)
    out.append('  subgraph cluster_legend {')
    out.append('    label=<<B>راهنما</B>>; fontsize=13; fontcolor="#334155"; color="#CBD5E1"; style="rounded"; margin=12;')
    out.append('    legend [label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="2" CELLPADDING="4" BGCOLOR="white">')
    out.append('        <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11"><B>PK</B></FONT></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11">کلید اصلی</FONT></TD><TD WIDTH="30"></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11"><B>FK</B></FONT></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11">کلید خارجی</FONT></TD><TD WIDTH="30"></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11"><B>UQ</B></FONT></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11">یکتا</FONT></TD></TR>')
    out.append('        <TR><TD COLSPAN="3" ALIGN="LEFT"><FONT POINT-SIZE="11">—|&gt; یک‌به‌چند</FONT></TD><TD COLSPAN="3" ALIGN="LEFT"><FONT POINT-SIZE="11">isActive ⟵ Soft Delete</FONT></TD><TD COLSPAN="3" ALIGN="LEFT"><FONT POINT-SIZE="11">کادر خط‌چین = MVP-2 / MVP-3</FONT></TD></TR>')
    out.append('      </TABLE>>];')
    out.append("  }")

    out.append("}")
    return "\n".join(out)


if __name__ == "__main__":
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "erd.dot"), "w", encoding="utf-8") as f:
        f.write(build_dot())
    print("DOT generated: erd/erd.dot")
