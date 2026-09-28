(() => {
  const { chapters, slides } = WALKTHROUGH;
  const controls = {
    previous: document.querySelector("#previous"), next: document.querySelector("#next"),
    play: document.querySelector("#play"), pause: document.querySelector("#pause"),
    speed: document.querySelector("#speed"), speedValue: document.querySelector("#speed-value"),
    voice: document.querySelector("#voice"), autoplay: document.querySelector("#autoplay"),
  };
  const view = {
    image: document.querySelector("#slide-image"), chapter: document.querySelector("#chapter-label"),
    count: document.querySelector("#slide-count"), title: document.querySelector("#slide-title"),
    subtitle: document.querySelector("#slide-subtitle"), notes: document.querySelector("#speaker-notes"),
    links: document.querySelector("#slide-links"),
  };
  let current = 0;
  let speaking = false;
  let utterance = null;

  function chapterFor(slide) { return chapters.find((chapter) => chapter.id === slide.chapter); }
  function render() {
    const slide = slides[current];
    const chapter = chapterFor(slide);
    view.image.src = slide.image;
    view.image.alt = `Slide ${slide.index}: ${slide.title}`;
    view.chapter.textContent = `Chapter ${chapter.id}: ${chapter.title}`;
    view.count.textContent = `Slide ${slide.index} of ${slides.length}`;
    view.title.textContent = slide.title;
    view.subtitle.textContent = slide.subtitle;
    view.notes.textContent = slide.narration;
    view.links.replaceChildren(...slide.links.map((link) => {
      const anchor = document.createElement("a");
      anchor.href = link.href; anchor.target = "_blank"; anchor.rel = "noopener"; anchor.textContent = link.label;
      return anchor;
    }));
    controls.previous.disabled = current === 0;
    controls.next.disabled = current === slides.length - 1;
  }
  function stop() {
    speechSynthesis.cancel(); speaking = false; utterance = null;
    controls.play.disabled = false; controls.pause.disabled = true; controls.play.textContent = "Read this slide";
  }
  function read() {
    stop();
    const slide = slides[current];
    utterance = new SpeechSynthesisUtterance(slide.narration);
    utterance.rate = Number(controls.speed.value);
    const voice = speechSynthesis.getVoices().find((candidate) => candidate.name === controls.voice.value);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      speaking = false; controls.play.disabled = false; controls.pause.disabled = true; controls.play.textContent = "Read this slide";
      if (controls.autoplay.checked && current < slides.length - 1) { current += 1; render(); read(); }
    };
    utterance.onerror = () => stop();
    speaking = true; controls.play.disabled = true; controls.pause.disabled = false; controls.play.textContent = "Reading";
    speechSynthesis.speak(utterance);
  }
  function go(delta) { stop(); current = Math.max(0, Math.min(slides.length - 1, current + delta)); render(); }
  function populateVoices() {
    const previous = controls.voice.value;
    const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
    controls.voice.replaceChildren(new Option("System voice", ""), ...voices.map((voice) => new Option(`${voice.name} (${voice.lang})`, voice.name)));
    controls.voice.value = previous;
  }
  controls.previous.addEventListener("click", () => go(-1));
  controls.next.addEventListener("click", () => go(1));
  controls.play.addEventListener("click", read);
  controls.pause.addEventListener("click", stop);
  controls.speed.addEventListener("input", () => { controls.speedValue.textContent = `${Number(controls.speed.value).toFixed(1)}×`; });
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, button, a")) return;
    if (event.code === "Space") { event.preventDefault(); speaking ? stop() : read(); }
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  });
  speechSynthesis.onvoiceschanged = populateVoices;
  populateVoices(); render();
})();
