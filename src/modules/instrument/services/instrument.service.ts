// منطق سازها (F3-AC2) — نام یکتا؛ غیرفعال‌سازی = Soft Delete
import { instrumentSchema } from "../schemas/instrument.schema";
import * as repo from "../repositories/instrument.repository";

export class InstrumentServiceError extends Error {}

export async function getInstruments() {
  return repo.listInstruments();
}

export async function createInstrument(input: unknown) {
  const { name } = instrumentSchema.parse(input);
  const existing = await repo.findInstrumentByName(name);
  if (existing) throw new InstrumentServiceError("این ساز قبلاً ثبت شده است.");
  return repo.createInstrument(name);
}

export async function setInstrumentActive(id: number, isActive: boolean) {
  await repo.setInstrumentActive(id, isActive);
}
