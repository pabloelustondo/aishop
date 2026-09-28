import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";

const workspaceDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const runtime="/Users/paboelustodo/.cache/codex-runtimes/codex-primary-runtime/dependencies";
const skillDir="/Users/paboelustodo/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
process.env.RUNTIME_NODE_MODULES=path.join(runtime,"node/node_modules");
const require=createRequire(path.join(process.env.RUNTIME_NODE_MODULES,"package.json"));
const {Presentation,PresentationFile,FileBlob}=await import(pathToFileURL(require.resolve("@oai/artifact-tool")));
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,"container_tools/artifact_tool_utils.mjs")));
const sourcePath=path.join(workspaceDir,"artifacts/Sprint-001-Video-Walkthrough-r03.pptx");
const sourceHash=createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
const source=await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const proto=source.toProto();
if(proto.slides.length!==15)throw Error("Expected the reviewed 15-slide source");
proto.slides=[proto.slides[0],proto.slides[4],proto.slides[5]];
const pilot=Presentation.load(proto);
const scripts=["01-title.md","02-architecture.md","03-orchestration.md"];
for(const [i,file] of scripts.entries()){
  const text=(await fs.readFile(path.join(workspaceDir,"narration-pilot",file),"utf8")).trim();
  if(text.split("\n").length>50)throw Error("Narration exceeds 50 lines: "+file);
  pilot.slides.getItem(i).speakerNotes.textFrame.setText(text);
}
const build=path.join(workspaceDir,".build/vids-pilot");
await fs.mkdir(build,{recursive:true});
const candidatePath=path.join(build,"candidate.pptx");
const revision=process.env.PILOT_REVISION??"01";
const finalPath=path.join(workspaceDir,"artifacts/Sprint-001-Google-Vids-Pilot-r"+revision+".pptx");
await(await PresentationFile.exportPptx(pilot)).save(candidatePath);
await finalizePresentation({
  workspaceDir,candidatePath,finalPath,explicitTotalSlideCount:3,
  pythonExecutable:path.join(runtime,"python/bin/python3"),
  integrityValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs:["--expected-slide-size-emu","15240000,8572500","--validate-heading-fit"],
  requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:"reference",families:["Arial","Courier New"],referencePath:sourcePath,referenceSha256:sourceHash},
  verifyArtifactToolImport:true,receiptPath:path.join(build,"validation-r"+revision+".json")
});
const output=await PresentationFile.importPptx(await FileBlob.load(finalPath));
for(let i=0;i<3;i++){
  const png=await output.export({slide:output.slides.getItem(i),format:"png",scale:0.75});
  await fs.writeFile(path.join(build,"slide-"+(i+1)+".png"),new Uint8Array(await png.arrayBuffer()));
}
if(createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex")!==sourceHash)throw Error("Source changed");
console.log(finalPath);
