export function createMemoryVistaFirestore() {
  const state = { documents: new Map(), tail: Promise.resolve(), failUpdate: false };
  const ref = (path) => ({ path, collection: (name) => collection(`${path}/${name}`) });
  const collection = (path) => ({ doc: (id) => ref(`${path}/${id}`) });
  const firestore = {
    collection,
    runTransaction(work) {
      const operation = state.tail.then(async () => {
        const draft = new Map([...state.documents].map(([key, value]) =>
          [key, structuredClone(value)]));
        const transaction = {
          async get(reference) {
            const value = draft.get(reference.path);
            return { exists: value !== undefined,
              data: () => value === undefined ? undefined : structuredClone(value) };
          },
          create(reference, value) {
            if (draft.has(reference.path)) throw new Error("already exists");
            draft.set(reference.path, structuredClone(value));
          },
          update(reference, value) {
            if (state.failUpdate) {
              state.failUpdate = false;
              throw new Error("injected finalization failure");
            }
            draft.set(reference.path, { ...draft.get(reference.path),
              ...structuredClone(value) });
          }
        };
        const result = await work(transaction);
        state.documents = draft;
        return result;
      });
      state.tail = operation.catch(() => {});
      return operation;
    }
  };
  return { firestore, get documents() { return state.documents; },
    failNextUpdate() { state.failUpdate = true; } };
}
