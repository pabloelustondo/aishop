"""Check the SVG, Markdown, and PowerPoint code links against the local checkout."""
from pathlib import Path
from urllib.parse import unquote, urlparse
from zipfile import ZipFile
import re
import sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
deck = root / "artifacts" / f"Sprint-001-Video-Walkthrough-r{sys.argv[1] if len(sys.argv) > 1 else '03'}.pptx"
ns = {"s": "http://www.w3.org/2000/svg",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
folders = sorted(p for p in root.iterdir() if p.is_dir() and re.match(r"\d\d-", p.name))
assert len(folders) == 15
total = 0
with ZipFile(deck) as archive:
    for number, folder in enumerate(folders, 1):
        svg = ET.parse(folder / "slide.svg")
        anchors = svg.findall(".//s:a", ns)
        assert (1 <= len(anchors) <= 3) if number >= 3 else not anchors
        svg_targets = [(folder / unquote(a.attrib["href"])).resolve() for a in anchors]
        assert all(p.exists() for p in svg_targets), folder
        relationships = ET.fromstring(archive.read(f"ppt/slides/_rels/slide{number}.xml.rels"))
        links = {r.attrib["Id"]: r.attrib["Target"] for r in relationships
                 if r.attrib["Type"].endswith("/hyperlink")}
        slide = ET.fromstring(archive.read(f"ppt/slides/slide{number}.xml"))
        clicks = slide.findall(".//a:hlinkClick", ns)
        assert len(clicks) == len(anchors), folder
        ppt_targets = []
        for click in clicks:
            url = urlparse(links[click.attrib[f"{{{ns['r']}}}id"]])
            assert url.scheme == "file"
            ppt_targets.append(Path(unquote(url.path)).resolve())
        assert svg_targets == ppt_targets, folder
        reader = root / ("overview.md" if number <= 5 else "code-walkthrough.md")
        section = reader.read_text().split(f"]({folder.name}/slide.svg)", 1)[1].split("![", 1)[0]
        md_targets = [(root / unquote(target)).resolve()
                      for target in re.findall(r"\]\(([^)]+)\)", section)
                      if not target.endswith("speaker-notes.md")]
        assert md_targets == svg_targets, folder
        total += len(anchors)
for markdown in root.rglob("*.md"):
    if ".build" in markdown.parts:
        continue
    assert len(markdown.read_text().splitlines()) <= 50, markdown
    for target in re.findall(r"\]\(([^)]+)\)", markdown.read_text()):
        if not urlparse(target).scheme:
            assert (markdown.parent / unquote(target.split("#")[0])).exists(), (markdown, target)
print(f"PASS: {total} matching code links across SVG, Markdown, and PPTX; all targets exist.")
print("PASS: all presentation Markdown files stay within 50 lines and local links resolve.")
