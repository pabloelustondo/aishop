import fs from "node:fs/promises";

const svgPath = "/Users/paboelustodo/-PROJECTS/aishop/docs/guides/items-vision/04-high-level-architecture/04-visual.svg";
const assets = [
  ["__AI_SHOP_PHONE__", "/Users/paboelustodo/-PROJECTS/aishop/docs/06-solution-design-and-architecture/mockups/ai-shop-camera-mockup.png", "image/png"],
  ["__WEB_AGENT__", "/Users/paboelustodo/-PROJECTS/aishop/docs/09-build-and-test/sprint-009-browser-evidence/sprint009-agent-1440.png", "image/png"],
  ["__VISTA_SHELF__", "/Users/paboelustodo/-PROJECTS/aishop/docs/TesstData/WhatsApp Image 2026-09-06 at 14.41.26.jpeg", "image/jpeg"],
];

let svg = await fs.readFile(svgPath, "utf8");
for (const [token, filePath, mediaType] of assets) {
  if (!svg.includes(token)) throw new Error(`Missing SVG image token: ${token}`);
  const bytes = await fs.readFile(filePath);
  svg = svg.replace(token, `data:${mediaType};base64,${bytes.toString("base64")}`);
}
await fs.writeFile(svgPath, svg);
console.log("Embedded three source images in 04-visual.svg");
