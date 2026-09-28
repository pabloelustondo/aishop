import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { slides } from "./content.mjs";

const workspaceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(workspaceDir, "../../..");
const runtimeRoot = process.env.CODEX_PRESENTATION_RUNTIME ??
  "/Users/paboelustodo/.cache/codex-runtimes/codex-primary-runtime/dependencies";
const skillDir = process.env.CODEX_PRESENTATION_SKILL ??
  "/Users/paboelustodo/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
process.env.RUNTIME_NODE_MODULES = path.join(runtimeRoot, "node/node_modules");
const require = createRequire(path.join(runtimeRoot, "node/node_modules/package.json"));
const { Presentation, PresentationFile } = await import(pathToFileURL(require.resolve("@oai/artifact-tool")));
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
    text("Implementation walkthrough / 20 September 2026",92,810,W-184,{size:24,color:"#A8C1CF"});
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
      content.rows.forEach((row,i)=>{
        const y=202+i*146;
        text(row[0],76,y,W-152,{size:29,bold:true,color:C.blue});
        text(row[1],76,y+42,W-152,{size:isResults?34:33,bold:isResults,maxChars:84});
        if(row[2])text(row[2],76,y+88,W-152,{size:27,color:C.muted,maxChars:100});
        if(i<3)rule(y+131);
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
  const notes=await fs.readFile(path.join(directory,"speaker-notes.md"),"utf8");
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
// SVG images embedded in Markdown cannot activate their internal anchors.
// Mirror the same links beneath each image so the reader can open code directly.
for(const [file,title,subset] of [
  ["overview.md","Overview",slides.slice(0,5)],
  ["code-walkthrough.md","Code and test walkthrough",slides.slice(5)]
]){
  const lines=["# "+title,"","Slides scale to the document width. Read and scroll vertically.",""];
  for(const content of subset){
    const links=content.codeLinks.map(([label,target])=>"["+label+"]("+
      path.relative(workspaceDir,path.join(repoRoot,target)).split(path.sep).map(encodeURIComponent).join("/")+")");
    lines.push("!["+content.title.replaceAll("\n"," ")+"]("+content.slug+"/slide.svg)","",
      (links.length?"Code: "+links.join(" · ")+" — ":"")+"[Speaker notes]("+content.slug+"/speaker-notes.md)","");
  }
  await fs.writeFile(path.join(workspaceDir,file),lines.join("\n")+"\n");
}
if (process.argv.includes("--previews-only")) process.exit(0);
const candidatePath=path.join(buildDir,"candidate.pptx");
await(await PresentationFile.exportPptx(deck)).save(candidatePath);
const revision=process.env.DECK_REVISION ?? "01";
const finalPath=path.join(workspaceDir,"artifacts","Sprint-001-Video-Walkthrough-r"+revision+".pptx");
await finalizePresentation({
  workspaceDir,candidatePath,finalPath,
  explicitTotalSlideCount:slides.length,
  pythonExecutable:path.join(runtimeRoot,"python/bin/python3"),
  integrityValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs:["--expected-slide-size-emu",String(W*9525)+","+String(H*9525),"--validate-heading-fit"],
  requiredNativeTableOwnerSlides:[], requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:"design",families:[font,codeFont]},
  verifyArtifactToolImport:true,
  receiptPath:path.join(buildDir,"validation-r"+revision+".json")
});
console.log(finalPath);
