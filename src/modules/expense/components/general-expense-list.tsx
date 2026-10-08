"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { generalExpenseCategoryLabels } from "@/lib/constants";
import { deleteGeneralExpenseAction } from "../actions/expense.actions";
import { GeneralExpenseEditForm } from "./general-expense-form";
import type { GeneralExpenseCategory } from "@prisma/client";

type Expense = {
  id: number;
  title: string;
  category: GeneralExpenseCategory;
  amount: number;
  paidAt: Date;
  note: string | null;
};

export function GeneralExpenseList({ expenses }: { expenses: Expense[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (expenses.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">هزینه جانبی در این بازه/فیلتر یافت نشد.</p>;
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-right">تاریخ</th>
              <th className="px-3 py-2 text-right">عنوان</th>
              <th className="px-3 py-2 text-right">دسته</th>
              <th className="px-3 py-2 text-right">مبلغ</th>
              <th className="px-3 py-2 text-right">توضیح</th>
              <th className="px-3 py-2 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <React.Fragment key={e.id}>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2 whitespace-nowrap" dir="ltr">
                    {formatJalali(e.paidAt)}
                  </td>
                  <td className="px-3 py-2 font-medium">{e.title}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">
                      {generalExpenseCategoryLabels[e.category]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-medium">{toPersianDigits(e.amount.toLocaleString("en-US"))}</td>
                  <td className="px-3 py-2 max-w-[180px] truncate text-xs text-muted-foreground">{e.note || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === e.id ? null : e.id)}>
                        {editingId === e.id ? "بستن" : "ویرایش"}
                      </Button>
                      <form action={deleteGeneralExpenseAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          حذف
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
                {editingId === e.id && (
                  <tr className="border-b bg-muted/20">
                    <td colSpan={6} className="p-3">
                      <GeneralExpenseEditForm
                        expense={{
                          id: e.id,
                          title: e.title,
                          category: e.category,
                          amount: e.amount,
                          paidAt: formatJalali(e.paidAt),
                          note: e.note,
                        }}
                        onDone={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-bold">
            <tr>
              <td colSpan={3} className="px-3 py-2 text-left">جمع فیلترشده</td>
              <td className="px-3 py-2">{toPersianDigits(total.toLocaleString("en-US"))} تومان</td>
              <td colSpan={2} className="px-3 py-2 text-xs font-normal text-muted-foreground">
                {toPersianDigits(String(expenses.length))} ردیف
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
