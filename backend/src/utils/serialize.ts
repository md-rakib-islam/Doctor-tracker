/** Maps a lean Mongo document to an API DTO: `_id` -> `id`, strips `__v`. */
export function serialize<T extends { _id: unknown }>(doc: T) {
  const { _id, ...rest } = doc as T & { __v?: number };
  delete rest.__v;
  return { id: String(_id), ...rest } as Omit<T, '_id' | '__v'> & { id: string };
}
