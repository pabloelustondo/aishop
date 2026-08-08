const DISPOSITIONS = Object.freeze({ verified: "verified", corrected: "corrected",
  rejected: "rejected" });

export function createInspectionRecordStore({ firestore, serverTimestamp }) {
  const scans = firestore.collection("inspections");
  return Object.freeze({
    async createInitial(record) {
      const data = {
        ...record,
        status: "pending",
        initialFindings: structuredClone(record.initialFindings),
        createdAt: serverTimestamp(),
        reviewCount: 0
      };
      await scans.doc(record.scanId).create(data);
      return data;
    },
    async createFailure(record) {
      const data = {
        ...record,
        status: "failed",
        initialFindings: null,
        createdAt: serverTimestamp(),
        reviewCount: 0
      };
      await scans.doc(record.scanId).create(data);
      return data;
    },
    async appendReview(scanId, review) {
      if (!Object.hasOwn(DISPOSITIONS, review.disposition)) {
        throw new TypeError("Invalid review disposition.");
      }
      const ref = scans.doc(scanId);
      const eventRef = ref.collection("reviews").doc();
      const event = { ...review, reviewedAt: serverTimestamp() };
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error("Inspection not found.");
        transaction.create(eventRef, event);
        transaction.update(ref, {
          status: DISPOSITIONS[review.disposition],
          latestReviewAt: event.reviewedAt,
          reviewCount: (snapshot.data().reviewCount ?? 0) + 1
        });
      });
      return event;
    }
  });
}
