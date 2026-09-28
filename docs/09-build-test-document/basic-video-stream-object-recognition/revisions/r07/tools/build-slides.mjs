import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { slides, chapters } from "./content.mjs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";

const workspaceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(workspaceDir, "../../../../..");
const runtimeRoot = process.env.CODEX_PRESENTATION_RUNTIME ??
  "/Users/paboelustodo/.cache/codex-runtimes/codex-primary-runtime/dependencies";
const skillDir = process.env.CODEX_PRESENTATION_SKILL ??
  "/Users/paboelustodo/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
process.env.RUNTIME_NODE_MODULES = path.join(runtimeRoot, "node/node_modules");
const require = createRequire(path.join(runtimeRoot, "node/node_modules/package.json"));
const { Presentation, PresentationFile, FileBlob } = await import(pathToFileURL(require.resolve("@oai/artifact-tool")));
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")));
const font = resolvePresentationFont({fontFamily: "Arial"});
const codeFont = resolvePresentationFont({fontFamily: "Courier New"});
const W = 1600, H = 900;
const C = { ink:"#102C43", muted:"#506476", blue:"#17667B", pale:"#EEF5F6",
            rule:"#D0DBE1", paper:"#FFFFFF", amber:"#805500" };
const buildDir = path.join(workspaceDir, ".build");
await fs.mkdir(buildDir, {recursive:true});
await fs.mkdir(path.join(workspaceDir, "artifacts"), {recursive:true});
const bananaReference = await fs.readFile(path.join(repoRoot,"ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/banana.JPG"));
const bananaReferenceData = "data:image/jpeg;base64,"+bananaReference.toString("base64");
const positiveFixtureFrame = await fs.readFile(path.join(workspaceDir,"assets/positive-fixture-frame.jpg"));
const negativeFixtureFrame = await fs.readFile(path.join(workspaceDir,"assets/negative-fixture-frame.jpg"));
const positiveFixtureFrameData = "data:image/jpeg;base64,"+positiveFixtureFrame.toString("base64");
const negativeFixtureFrameData = "data:image/jpeg;base64,"+negativeFixtureFrame.toString("base64");
const deck = Presentation.create({slideSize:{width:W,height:H}});
const xml = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function wrap(value, limit) {
  return String(value).split("\n").flatMap(line => {
    if(line.length <= limit) return [line];
    const words=line.split(" "); let result=[], current="";
    for(const word of words) {
      if(current && current.length+word.length+1>limit){result.push(current);current=word;}
      else current+=(current?" ":"")+word;
    }
    if(current)result.push(current);
    return result;
  });
}
const geometries=[];
for (const [index, content] of slides.entries()) {
  const slide = deck.slides.add();
  const directory=path.join(workspaceDir,content.slug);
  await fs.mkdir(directory,{recursive:true});
  if(content.narration.length>800)throw Error(content.slug+": narration exceeds Google Vids scene limit");
  if(content.codeLinks.length>3)throw Error(content.slug+": at most three code links");
  for(const [,target] of content.codeLinks)await fs.access(path.join(repoRoot,target));
  const cover=content.kind==="cover";
  slide.background.fill=cover?C.ink:C.paper;
  const parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" style="max-width:100%;height:auto;display:block" role="img" aria-labelledby="title desc">',
    '<title id="title">'+xml(content.title.replaceAll("\n"," "))+'</title>',
    '<desc id="desc">'+xml(content.subtitle)+'. Read in top-to-bottom order. Speaker notes are in the paired Markdown file.</desc>',
    '<rect width="'+W+'" height="'+H+'" fill="'+(cover?C.ink:C.paper)+'"/>'];
  const bounds=[];
  function rect(x,y,w,h,fill,line="none",lineWidth=0){
    const shape=slide.shapes.add({geometry:"rect",position:{left:x,top:y,width:w,height:h},
      fill,line:{fill:line,width:lineWidth}});
    parts.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+line+'" stroke-width="'+lineWidth+'"/>');
    return shape;
  }
  function text(value,x,y,w,{size=34,bold=false,color=C.ink,family=font,leading=1.22,align="left",maxChars=88,href}={}){
    const lines=wrap(value,maxChars);
    const h=lines.length*size*leading+10;
    const shape=slide.shapes.add({geometry:"textbox",position:{left:x,top:y,width:w,height:h},
      fill:"none",line:{fill:"none",width:0},name:"text-"+bounds.length});
    shape.text=lines.join("\n");
    shape.text.style={typeface:family,fontSize:size,bold,color,autoFit:"none",...(href?{underline:"sng"}:{}),
      alignment:align,verticalAlignment:"top",insets:{left:0,right:0,top:0,bottom:0}};
    if(href){
      shape.text.get(value).link={uri:pathToFileURL(href).href,isExternal:true};
      const relative=path.relative(directory,href).split(path.sep).map(encodeURIComponent).join("/");
      parts.push('<a href="'+xml(relative)+'" aria-label="'+xml(value)+'" style="cursor:pointer">');
    }
    parts.push('<text font-family="'+xml(family)+'" font-size="'+size+'" font-weight="'+(bold?700:400)+'" fill="'+color+'"'+(align==="center"?' text-anchor="middle"':"")+'>'+
      lines.map((line,i)=>'<tspan x="'+(align==="center"?x+w/2:x)+'" y="'+(y+size+i*size*leading)+'">'+(xml(line)||" ")+'</tspan>').join("")+"</text>");
    if(href){
      parts[parts.length-1]=parts.at(-1).replace('<text ', '<text text-decoration="underline" ');
      parts.push("</a>");
    }
    bounds.push({value, x,y,w,h,fontSize:size});
    if(y+h>H-4)throw Error(content.slug+": text exceeds slide: "+value);
    return shape;
  }
  function rule(y){rect(76,y,W-152,1,C.rule);}
  function down(y,x=W/2){
    slide.shapes.add({geometry:"downArrow",position:{left:x-10,top:y,width:20,height:24},fill:C.blue,line:{fill:"none",width:0}});
    parts.push('<path d="M '+(x-3)+' '+y+' H '+(x+3)+' V '+(y+14)+' H '+(x+10)+' L '+x+' '+(y+24)+' L '+(x-10)+' '+(y+14)+' H '+(x-3)+' Z" fill="'+C.blue+'"/>');
  }
  function code(lines,y=466){
    const rendered=lines.flatMap(line=>wrap(line,88));
    if(rendered.length>7)throw Error(content.slug+": split the code excerpt");
    text("Selected Swift lines",76,y-42,W-152,{size:23,color:C.muted});
    rect(76,y-8,W-152,rendered.length*31+26,C.pale);
    text(rendered.join("\n"),98,y,W-196,{size:26,family:codeFont,leading:1.19,maxChars:88});
  }
  if(cover){
    text("AIShopVision",88,114,W-176,{size:32,color:"#A8D6DD",bold:true});
    text(content.title,88,252,W-176,{size:78,color:"#FFFFFF",bold:true,leading:1.14,maxChars:36});
    text(content.subtitle,92,536,W-184,{size:38,color:"#D1E3E9",leading:1.3,maxChars:60});
    text("Revision 07 / working tree / 20 September 2026",92,810,W-184,{size:24,color:"#A8C1CF"});
  } else {
    text(content.title,76,42,W-152,{size:50,bold:true,maxChars:56});
    text(content.subtitle,78,118,W-156,{size:28,color:C.muted,maxChars:95});
    if(content.kind==="flow"){
      const n=content.nodes.length, height=n===5?92:106, gap=n===5?30:42;
      const top=n===5?196:212, width=1240, left=(W-width)/2;
      content.nodes.forEach(([label,detail],i)=>{
        const y=top+i*(height+gap);
        rect(left,y,width,height,C.pale,C.rule,1);
        text(label,left+20,y+9,width-40,{size:32,bold:true,align:"center",maxChars:72});
        text(detail,left+20,y+51,width-40,{size:25,color:C.muted,align:"center",maxChars:90});
        if(i<n-1)down(y+height+3);
      });
      text(content.foot,76,803,W-152,{size:26,color:C.muted,maxChars:111});
    } else if(content.kind==="technical"){
      content.steps.forEach((line,i)=>{
        text(String(i+1).padStart(2,"0"),76,200+i*69,65,{size:30,color:C.blue,bold:true});
        text(line,160,198+i*69,W-236,{size:32,maxChars:88});
      });
      code(content.codeLines);
      text(content.test,76,743,W-152,{size:29,bold:true,color:C.blue,maxChars:90});
      text(content.proof,76,791,W-152,{size:27,color:C.muted,maxChars:98});
    } else if(content.kind==="episode"){
      content.nodes.forEach(([label,detail],i)=>{
        const y=190+i*110;
        rect(180,y,1240,83,C.pale,C.rule,1);
        text(label,210,y+8,200,{size:29,bold:true});
        text(detail,430,y+14,960,{size:27,maxChars:65});
        if(i<3)down(y+84);
      });
      code(content.codeLines,695);
      text(content.test+" / "+content.proof,76,813,W-152,{size:24,color:C.muted,maxChars:110});
    } else if(content.kind==="fixtures"){
      text("The fixture choice gives the diagnostic a clear expected outcome.",76,170,W-152,{size:30,color:C.muted,maxChars:92});
      const fixtures=[
        {label:"Positive fixture",result:"Banana appears",detail:"Expected: possible-match episode",blob:positiveFixtureFrame,data:positiveFixtureFrameData,alt:"Still from the positive fixture showing the banana"},
        {label:"Control fixture",result:"No banana appears",detail:"Expected: no false candidate",blob:negativeFixtureFrame,data:negativeFixtureFrameData,alt:"Still from the negative fixture showing a kitchen scene without a banana"}
      ];
      fixtures.forEach((fixture,i)=>{
        const x=i===0?120:860;
        rect(x,222,620,340,C.paper,C.rule,2);
        slide.images.add({blob:fixture.blob,contentType:"image/jpeg",alt:fixture.alt,fit:"cover",position:{left:x+16,top:238,width:588,height:210}});
        parts.push('<image href="'+fixture.data+'" x="'+(x+16)+'" y="238" width="588" height="210" preserveAspectRatio="xMidYMid slice"/>');
        text(fixture.label,x+16,465,588,{size:29,bold:true,color:C.blue,align:"center"});
        text(fixture.result,x+16,502,588,{size:34,bold:true,align:"center"});
        text(fixture.detail,x+16,544,588,{size:24,color:C.muted,align:"center"});
      });
      text("The HITL uses either video in the same three-step journey",76,605,W-152,{size:27,bold:true,color:C.blue,align:"center"});
      const journey=[
        ["1  Choose", "Select the positive or control video"],
        ["2  Observe", "Watch playback and the provisional signal"],
        ["3  Review", "Inspect the report, images, and event log"]
      ];
      journey.forEach(([label,detail],i)=>{
        const x=140+i*450;
        text(label,x,659,420,{size:30,bold:true,align:"center"});
        text(detail,x,704,420,{size:24,color:C.muted,align:"center",maxChars:34});
      });
    } else if(content.kind==="testing"){
      content.rows.forEach(([label,command,detail],i)=>{
        const y=207+i*188;
        text(label,76,y,W-152,{size:30,bold:true,color:C.blue});
        text(command,76,y+50,W-152,{size:36,bold:true,maxChars:75});
        text(detail,76,y+106,W-152,{size:29,color:C.muted,maxChars:94});
        if(i<2)rule(y+163);
      });
      text(content.foot,76,803,W-152,{size:25,color:C.amber,maxChars:113});
    } else {
      const isResults=content.kind==="results";
      const isReview=content.kind==="review";
      const showBananaReference=false;
      const rowWidth=showBananaReference?930:W-152;
      if(showBananaReference){
        slide.images.add({blob:bananaReference,contentType:"image/jpeg",alt:"Banana reference photograph used by the positive fixture",fit:"contain",position:{left:1080,top:198,width:390,height:390}});
        parts.push('<image href="'+bananaReferenceData+'" x="1080" y="198" width="390" height="390" preserveAspectRatio="xMidYMid meet"/>');
        parts.push('<text font-family="Arial" font-size="22" font-weight="700" fill="'+C.blue+'" text-anchor="middle"><tspan x="1275" y="625">Banana reference image</tspan></text>');
      }
      content.rows.forEach((row,i)=>{
        const y=202+i*146;
        text(row[0],76,y,rowWidth,{size:29,bold:true,color:C.blue});
        text(row[1],76,y+42,rowWidth,{size:isResults?34:33,bold:isResults,maxChars:showBananaReference?55:84});
        if(row[2])text(row[2],76,y+88,rowWidth,{size:27,color:C.muted,maxChars:showBananaReference?60:100});
        if(i<3){
          if(showBananaReference)rect(76,y+131,rowWidth,1,C.rule);
          else rule(y+131);
        }
      });
      if(content.foot)text(content.foot,76,803,W-152,{size:isReview?26:25,color:isReview?C.amber:C.muted,maxChars:111});
    }
    if(content.codeLinks.length){
      text("Code:",76,855,90,{size:23,color:C.muted});
      content.codeLinks.forEach(([label,target],i)=>text(label,170+i*430,855,410,
        {size:23,color:C.blue,href:path.join(repoRoot,target)}));
    }
    text(String(index+1).padStart(2,"0"),W-78,850,45,{size:18,color:C.muted});
  }
  parts.push("</svg>");
  const finePrint=[...content.codeLinks,...(content.extraLinks??[])].map(([label,target])=>"- ["+label+"]("+path.relative(directory,path.join(repoRoot,target)).split(path.sep).map(encodeURIComponent).join("/")+")");
  if(content.slug==="30-fine-print")finePrint.push("- [Complete changed-file coverage](../artifacts/file-coverage.csv)");
  if(content.slug==="27-iphone-runbook")finePrint.push("- [Phone session runbook](../runbook.md)");
  if(content.slug==="04-how-to-test")finePrint.push("- [Fresh gate evidence](../artifacts/evidence/mac-gate-r04.log)");
  const notes="# "+content.title.replaceAll("\n"," ")+"\n\n## Speaker notes\n\n"+content.narration+"\n\n## Fine print\n\n"+finePrint.join("\n")+"\n";
  await fs.writeFile(path.join(directory,"speaker-notes.md"),notes);
  if(notes.trimEnd().split("\n").length>50)throw Error(content.slug+": notes exceed 50 lines");
  slide.speakerNotes.textFrame.setText(notes);
  await fs.writeFile(path.join(directory,"slide.svg"),parts.join("\n")+"\n");
  const png=await deck.export({slide,format:"png",scale:0.9});
  await fs.writeFile(path.join(buildDir,content.slug+".png"),new Uint8Array(await png.arrayBuffer()));
  const layout=await slide.export({format:"layout"});
  await fs.writeFile(path.join(buildDir,content.slug+".layout.json"),await layout.text());
  geometries.push({slide:index+1,bounds});
  console.log("Rendered "+content.slug);
}
await fs.writeFile(path.join(buildDir,"geometry.json"),JSON.stringify(geometries,null,2));

const rel=target=>path.relative(workspaceDir,path.join(repoRoot,target)).split(path.sep).map(encodeURIComponent).join("/");
for(const chapter of chapters){
  const subset=slides.slice(chapter.start,chapter.end);
  const lines=["# "+chapter.title,"","Revision 07. Read vertically. Code links work here; video links are visual only.",""];
  for(const s of subset)lines.push("!["+s.title.replaceAll("\n"," ")+"]("+s.slug+"/slide.svg)","",
    s.codeLinks.map(([label,target])=>"["+label+"]("+rel(target)+")").concat("[Speaker notes]("+s.slug+"/speaker-notes.md)").join(" · "),"");
  if(lines.length>50)throw Error("Reader exceeds 50 lines");
  await fs.writeFile(path.join(workspaceDir,"chapter-"+chapter.id+".md"),lines.join("\n")+"\n");
}
const index=["# Sprint 001 solution and code walkthrough","","Revision 07, 20 September 2026. Working tree based on 90a5f8b; draft for review.",
  "30 slides in four subject-based chapters. Physical-iPhone acceptance remains pending.","",
  "## Read or watch","",
  ...chapters.map(c=>"- [Chapter "+c.id+": "+c.title+"](chapter-"+c.id+".md)"),
  "- [Narrated interactive player](player/index.html) · reads the notes and keeps code links clickable",
  "- [Video collection and measured durations](videos.md) · [Full PowerPoint](artifacts/Sprint-001-Walkthrough-r07.pptx)",
  "- [Phone runbook](runbook.md) · [Revision notes](revision-notes.md) · [Changed-file map](artifacts/file-coverage.csv)","",
  "## Slides","",
  ...slides.map((s,i)=>(i+1)+". ["+s.title.replaceAll("\n"," ")+"]("+s.slug+"/slide.svg) · [notes]("+s.slug+"/speaker-notes.md)"),
  "","Each slide has one editable SVG and notes ending in Fine print. Notes stay below 50 lines.",
  "Narration and notes share tools/content.mjs. Video exports omit headings and source links."];
if(index.length>50)throw Error("Index exceeds 50 lines");
await fs.writeFile(path.join(workspaceDir,"README.md"),index.join("\n")+"\n");

const git=(...args)=>execFileSync("git",args,{cwd:repoRoot,encoding:"utf8"}).split(args.includes("-z")?"\0":"\n").filter(Boolean);
const changed=[...new Set([...git("diff","--name-only","-z","cbc68ad"),...git("ls-files","--others","--exclude-standard","-z")])].sort();
const mappings=changed.map(file=>{
  const hits=slides.flatMap((s,i)=>[...s.codeLinks,...(s.extraLinks??[])].some(([,p])=>file===p||(p.endsWith("/")&&file.startsWith(p)))?[String(i+1).padStart(2,"0")]:[]);
  if(hits.length)return {file,slides:hits.join(" "),reason:"Linked source/test/evidence or containing component"};
  if(file.startsWith("docs/09-build-test-document/basic-video-stream-object-recognition/"))return {file,slides:"30",reason:"Maintained walkthrough sources, exports, or supporting evidence"};
  if(file.startsWith("docs/00-sdlc2-governance/"))return {file,slides:"",reason:"Governance change in branch/worktree; not application implementation"};
  if(file.startsWith("docs/09-build")||file.startsWith("docs/09-build-and"))return {file,slides:"",reason:"Other sprint documentation or pre-existing documentation relocation"};
  if(file.startsWith("ios/AIShop/01-docs/"))return {file,slides:"01 02 04 25 27",reason:"Sprint planning, contracts, or evidence documents; relocated paths retained in Git inventory"};
  if(file.startsWith("Claude outputs/"))return {file,slides:"28",reason:"Historical review brief; current concerns checked against implementation"};
  if(file.startsWith("e2e/ios/"))return {file,slides:"04 14 26",reason:"Gate, frozen calibration, required-test or bundle verification support"};
  if(file.startsWith("ios/AIShop/AIShop.xcodeproj/")||file.startsWith("ios/AIShop/scripts/"))return {file,slides:"26 27",reason:"Xcode diagnostic integration and Debug/Release fixture packaging"};
  if(file.startsWith("ios/AIShop/AIShopTests/"))return {file,slides:"04 26",reason:"App tests or historical fixture location; package resources now own fixtures"};
  if(file==="ios/AIShop/AIShop/App/AIShopApp.swift")return {file,slides:"26",reason:"Root app routing into diagnostic or ordinary startup"};
  if(file.endsWith(".MOV"))return {file,slides:"",reason:"Original untrimmed media retained in history; not an active fixture"};
  return {file,slides:"",reason:"REVIEW REQUIRED: no explicit mapping"};
});
if(mappings.some(m=>m.reason.startsWith("REVIEW REQUIRED")))throw Error(JSON.stringify(mappings.filter(m=>m.reason.startsWith("REVIEW REQUIRED"))));
const quote=x=>'"'+String(x).replaceAll('"','""')+'"';
await fs.writeFile(path.join(workspaceDir,"artifacts/file-coverage.csv"),["file,slides,reason",...mappings.map(m=>[m.file,m.slides,m.reason].map(quote).join(","))].join("\n")+"\n");
const implementationFiles=changed.filter(p=>/^(ios\/AIShop\/(AIShop\/|AIShopVision\/|AIShopTests\/|AIShop.xcodeproj\/|scripts\/)|e2e\/ios\/)/.test(p));
const fingerprints=[];
for(const file of implementationFiles){
  try {const data=await fs.readFile(path.join(repoRoot,file));fingerprints.push({file,sha256:createHash("sha256").update(data).digest("hex")});}
  catch(e){if(e.code!=="ENOENT")throw e;fingerprints.push({file,deleted:true});}
}
await fs.writeFile(path.join(workspaceDir,"artifacts/source-snapshot.json"),JSON.stringify({date:"2026-09-20",base:"cbc68ad6bf5300b02b6b41584f3d171252eac251",head:git("rev-parse","HEAD")[0],branch:git("branch","--show-current")[0],files:fingerprints},null,2)+"\n");
if(process.argv.includes("--previews-only"))process.exit(0);

const requirements={
  workspaceDir,pythonExecutable:path.join(runtimeRoot,"python/bin/python3"),
  integrityValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs:["--expected-slide-size-emu",String(W*9525)+","+String(H*9525),"--validate-heading-fit"],
  requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:"design",families:[font,codeFont]},verifyArtifactToolImport:true
};
const versions=[{name:"Sprint-001-Walkthrough-r07",presentation:deck,count:slides.length}];
for(const chapter of chapters){
  const proto=deck.toProto();proto.slides=proto.slides.slice(chapter.start,chapter.end);
  const subset=Presentation.load(proto);
  for(let i=0;i<subset.slides.items.length;i++)subset.slides.getItem(i).speakerNotes.textFrame.setText(slides[chapter.start+i].narration);
  versions.push({name:"Sprint-001-Chapter-"+chapter.id+"-r07",presentation:subset,count:chapter.end-chapter.start});
}
for(const item of versions){
  const candidatePath=path.join(buildDir,item.name+".pptx");
  const finalPath=path.join(workspaceDir,"artifacts",item.name+".pptx");
  await(await PresentationFile.exportPptx(item.presentation)).save(candidatePath);
  await finalizePresentation({...requirements,candidatePath,finalPath,explicitTotalSlideCount:item.count,
    receiptPath:path.join(buildDir,item.name+".validation.json")});
  console.log(finalPath);
}
const checked=await PresentationFile.importPptx(await FileBlob.load(path.join(workspaceDir,"artifacts/Sprint-001-Walkthrough-r07.pptx")));
for(let i=0;i<slides.length;i++){
  const png=await checked.export({slide:checked.slides.getItem(i),format:"png",scale:0.8});
  await fs.writeFile(path.join(buildDir,"final-"+String(i+1).padStart(2,"0")+".png"),new Uint8Array(await png.arrayBuffer()));
}
