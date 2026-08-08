import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("../dashboard");
const scanId = "00000000-0000-4000-8000-000000000001";
const report = {
  productName: "Sea Salt",
  summary: "The selected center product is a white-and-blue salt container.",
  visibleEvidence: ["Center crosshair aligns with the salt container", "Cheerios is off-center"],
  missingInformation: ["Price is not visible"],
  conclusion: "insufficient_evidence",
  conclusionReason: "Price is missing.",
  confidence: "high"
};
const record = {
  scanId, status: "pending", mode: "targetProduct", appVersion: "1.2 (3)",
  initialFindings: report,
  reviews: [{ scanId: "review-1", disposition: "verified", reviewerId: "reviewer-1", notes: "Target confirmed" }]
};
const firebaseStub = `globalThis.firebase={auth:()=>({currentUser:{getIdToken:async()=>"token"},signInWithPopup:async()=>{},signOut:async()=>{},onAuthStateChanged:fn=>fn(location.search.includes("signedOut")?null:{uid:"reviewer-1"})})};firebase.auth.GoogleAuthProvider=class{};`;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
function json(response, payload) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}
http.createServer(async (request, response) => {
  if (request.url.startsWith("/__/firebase/")) {
    response.writeHead(200, { "Content-Type": "text/javascript" });
    response.end(request.url.includes("firebase-auth") ? firebaseStub : "");
    return;
  }
  if (request.url === "/inspections") return json(response, { pending: [record], recent: [record] });
  if (request.url === `/inspections/${scanId}`) return json(response, record);
  if (request.url === `/inspections/${scanId}/evidence`) {
    const bytes = await readFile(new URL("../test-fixtures/tiny.jpg.base64", import.meta.url), "utf8");
    response.writeHead(200, { "Content-Type": "image/jpeg" });
    response.end(Buffer.from(bytes.replace(/\s+/g, ""), "base64"));
    return;
  }
  if (request.url === `/inspections/${scanId}/reviews`) return json(response, { ok: true });
  const pathname = new URL(request.url, "http://local").pathname;
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  const target = path.resolve(root, file);
  if (!target.startsWith(root)) { response.writeHead(404); response.end(); return; }
  try {
    const content = await readFile(target);
    response.writeHead(200, { "Content-Type": types[path.extname(target)] ?? "application/octet-stream" });
    response.end(content);
  } catch { response.writeHead(404); response.end(); }
}).listen(4179, "127.0.0.1", () => console.log("Dashboard preview: http://127.0.0.1:4179"));
