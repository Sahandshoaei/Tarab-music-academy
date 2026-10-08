// سرویس قالب‌ها (F7-1)
import { templateSchema } from "../schemas/template.schema";
import * as repo from "../repositories/template.repository";

export class TemplateServiceError extends Error {}

export async function listTemplates(includeInactive = true) {
  return repo.listTemplates(includeInactive);
}

export async function getTemplate(id: number) {
  const t = await repo.findTemplateById(id);
  if (!t) throw new TemplateServiceError("قالب یافت نشد.");
  return t;
}

export async function createTemplate(input: unknown) {
  const v = templateSchema.parse(input);
  if (await repo.findTemplateByTitle(v.title)) throw new TemplateServiceError("عنوان قالب تکراری است.");
  return repo.createTemplate({ title: v.title, body: v.body, isActive: v.isActive });
}

export async function updateTemplate(id: number, input: unknown) {
  const v = templateSchema.parse(input);
  const existing = await repo.findTemplateByTitle(v.title);
  if (existing && existing.id !== id) throw new TemplateServiceError("عنوان قالب تکراری است.");
  return repo.updateTemplate(id, { title: v.title, body: v.body, isActive: v.isActive ?? true });
}
