export function createMemoryVistaBucket() {
  const objects = new Map();
  const saves = [];
  let saveAttempts = 0;
  let failedSaveNumber = null;
  const bucket = { file(path) { return {
    async save(bytes, options) {
      saveAttempts += 1;
      if (saveAttempts === failedSaveNumber) {
        failedSaveNumber = null;
        throw new Error("injected storage failure");
      }
      if (objects.has(path)) {
        const error = new Error("precondition failed");
        error.code = 412;
        throw error;
      }
      const value = { bytes: Buffer.from(bytes), metadata: structuredClone(options.metadata) };
      objects.set(path, value);
      saves.push({ path, bytes: value.bytes, options });
    },
    async download() {
      const value = objects.get(path);
      if (!value) throw new Error("missing object");
      return [Buffer.from(value.bytes)];
    },
    async getMetadata() {
      const value = objects.get(path);
      if (!value) throw new Error("missing metadata");
      return [{ size: String(value.bytes.length), ...structuredClone(value.metadata) }];
    }
  }; } };
  return { bucket, objects, saves,
    failNextSave() { failedSaveNumber = saveAttempts + 1; },
    failSaveAt(number) { failedSaveNumber = number; } };
}
