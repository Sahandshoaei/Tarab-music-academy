import { roomSchema } from "../schemas/room.schema";
import * as repo from "../repositories/room.repository";

export class RoomServiceError extends Error {}

export async function getRooms() {
  return repo.listRooms();
}

export async function createRoom(input: unknown) {
  const { name } = roomSchema.parse(input);
  if (await repo.findRoomByName(name)) {
    throw new RoomServiceError("این اتاق قبلاً ثبت شده است.");
  }
  return repo.createRoom(name);
}

export async function setRoomActive(id: number, isActive: boolean) {
  await repo.setRoomActive(id, isActive);
}
