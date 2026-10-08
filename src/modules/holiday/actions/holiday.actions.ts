"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/types/action";
import { addHoliday, removeHoliday } from "../services/holiday.service";

export async function createHolidayAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const date = String(formData.get("date") ?? "");
    const title = String(formData.get("title") ?? "");
    await addHoliday({ date, title });
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در ثبت تعطیلی" };
  }
}

export async function deleteHolidayAction(formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    if (!Number.isInteger(id)) throw new Error("شناسه نامعتبر");
    await removeHoliday(id);
    revalidatePath("/settings");
  } catch (e) {
    console.error(e);
  }
}
