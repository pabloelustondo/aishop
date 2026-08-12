export function vistaServerTimestamp(clock) {
  const value = clock();
  const iso = value instanceof Date ? value.toISOString() : String(value);
  return iso.replace(/\.000Z$/, "Z");
}
