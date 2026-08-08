function records(snapshot) {
  return snapshot.docs.map((document) => ({
    scanId: document.id,
    ...document.data()
  }));
}

export function createInspectionRecordReader({ firestore }) {
  const scans = firestore.collection("inspections");
  return Object.freeze({
    async listForReview(limit = 50) {
      const [pendingSnapshot, recentSnapshot] = await Promise.all([
        scans.where("status", "==", "pending")
          .orderBy("createdAt", "asc").limit(limit).get(),
        scans.orderBy("createdAt", "desc").limit(limit).get()
      ]);
      return Object.freeze({
        pending: records(pendingSnapshot),
        recent: records(recentSnapshot)
      });
    },
    async getDetail(scanId) {
      const ref = scans.doc(scanId);
      const [snapshot, reviewSnapshot] = await Promise.all([
        ref.get(),
        ref.collection("reviews").orderBy("reviewedAt", "asc").get()
      ]);
      if (!snapshot.exists) return null;
      return Object.freeze({
        scanId: snapshot.id,
        ...snapshot.data(),
        reviews: records(reviewSnapshot)
      });
    }
  });
}
