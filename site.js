const lab = window.labContent;
const main = document.querySelector("main");
const navLinks = [...document.querySelectorAll("nav a")];
const collections = {
  people: ["团队", lab.people],
  publications: ["成果", lab.publications],
  news: ["动态", lab.news]
};

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href, className) {
  const node = element("a", text, className);
  node.href = href;
  return node;
}

function heading(title, description) {
  const header = element("header", "", "page-heading");
  header.append(element("h1", title));
  if (description) header.append(element("p", description));
  main.append(header);
  return header;
}

function projectGrid(projects = lab.projects) {
  const grid = element("div", "", "project-grid");
  for (const project of projects) {
    const card = link("", "#project/" + encodeURIComponent(project.id), "project");
    const cover = element("div", "", "cover");
    if (project.image) {
      const image = element("img");
      image.src = project.image;
      image.alt = project.imageAlt || "";
      image.loading = "lazy";
      cover.append(image);
    } else {
      cover.setAttribute("aria-hidden", "true");
    }
    const details = element("div", "", "project-details");
    const arrow = element("span", "↗", "project-arrow");
    arrow.setAttribute("aria-hidden", "true");
    details.append(element("h3", project.title), arrow, element("p", project.description));
    card.append(cover, details);
    grid.append(card);
  }
  return grid;
}

function newsDate(entry) {
  if (entry.meta) return "发布日期 · " + entry.meta;
  if (entry.eventDate) return "活动日期 · " + entry.eventDate;
  return "发布日期未收录";
}

function list(entries, emptyMessage, newsLinks = false) {
  const container = element("div", "", "entries");
  if (!entries.length) container.append(element("p", emptyMessage, "empty"));
  for (const entry of entries) {
    const row = element("article", "", "entry");
    const title = element("h3");
    const href = newsLinks ? "#news/" + encodeURIComponent(entry.id) : entry.url;
    title.append(href ? link(entry.title, href) : document.createTextNode(entry.title));
    row.append(title);
    if (entry.meta && !newsLinks) row.append(element("p", entry.meta, "entry-meta"));
    if (entry.description) row.append(element("p", entry.description));
    if (!newsLinks && entry.sourceUrl) row.append(link(entry.sourceLabel, entry.sourceUrl, "entry-source"));
    if (newsLinks) row.append(element("p", newsDate(entry), "entry-meta news-date"));
    container.append(row);
  }
  return container;
}

function achievements(previewLimit) {
  const categories = [["all", "全部"], ["copyright", "软著"], ["project", "项目"], ["competition", "竞赛"]];
  const projectEntries = lab.projects.map(project => ({
    ...project,
    category: "project",
    url: "#project/" + encodeURIComponent(project.id)
  }));
  const entries = [...lab.publications, ...projectEntries];
  const controls = element("div", "", "achievement-filters");
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "成果分类");
  const results = element("div");
  const buttons = new Map();

  function select(category) {
    for (const [key, button] of buttons) {
      button.setAttribute("aria-pressed", String(key === category));
    }
    const matching = category === "all" ? entries : entries.filter(entry => entry.category === category);
    const visible = previewLimit ? matching.slice(0, previewLimit) : matching;
    results.replaceChildren(list(visible, category === "copyright" ? "暂无已收录的软著。" : "暂无相关成果。"));
  }

  for (const [key, label] of categories) {
    const button = element("button", label);
    button.type = "button";
    button.addEventListener("click", () => select(key));
    buttons.set(key, button);
    controls.append(button);
  }
  main.append(controls, results);
  select("all");
}

let newsSearchIndex;
function newsArchive(previewLimit) {
  const toolbar = element("div", "", "archive-toolbar");
  const label = element("label", "搜索动态");
  const input = element("input");
  input.type = "search";
  input.placeholder = "输入标题、年份或关键词";
  label.append(input);
  const count = element("p", "", "archive-count");
  count.setAttribute("role", "status");
  const results = element("div");
  toolbar.append(label, count);
  main.append(toolbar, results);

  if (previewLimit) {
    count.textContent = lab.news.length + " 条动态";
    results.append(list(lab.news.slice(0, previewLimit), "", true));
    return;
  }

  let previousQuery;
  let pendingFilter;
  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    if (query === previousQuery) return;
    previousQuery = query;
    let entries = lab.news;
    if (query) {
      newsSearchIndex ??= lab.news.map(entry => ({
        entry,
        text: [entry.title, entry.meta, entry.eventDate, entry.description, ...(entry.body || [])].join(" ").toLocaleLowerCase()
      }));
      entries = newsSearchIndex.filter(item => item.text.includes(query)).map(item => item.entry);
    }
    count.textContent = entries.length + " 条动态";
    results.replaceChildren(list(entries, "没有找到匹配的动态。", true));
  }
  function scheduleFilter() {
    cancelAnimationFrame(pendingFilter);
    pendingFilter = requestAnimationFrame(() => {
      if (input.isConnected) filter();
    });
  }
  input.addEventListener("input", event => {
    if (!event.isComposing) scheduleFilter();
  });
  input.addEventListener("compositionend", scheduleFilter);
  filter();
}

function indexSection(title, content, href) {
  const section = element("section", "", "index-section");
  const header = element("header", "", "section-heading");
  header.append(element("h2", title));
  if (href) header.append(link("查看全部 ↗", href));
  section.append(header, content);
  main.append(section);
}

const carouselTimers = [];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const carouselPosts = {
  awards: [["qzone-40", "中国软件杯全国总决赛"], ["qzone-45", "服务外包创新创业大赛"], ["qzone-7", "江苏省大学生计算机设计大赛"]],
  software: [["qzone-10", "多项目研发研讨会"], ["qzone-11", "智能科技项目研讨"], ["qzone-12", "学生团队汇报项目进展"]],
  team: [["qzone-2", "新学期第一次组会"], ["qzone-33", "科技社与开放原子开源社团建"], ["qzone-41", "实验室年度总结表彰大会"]]
};

function featureCarousel(title, category) {
  const carousel = element("figure", "", "feature-art carousel");
  carousel.setAttribute("aria-label", title + "图片轮播");
  const slide = link("", "#news", "carousel-slide");
  const caption = element("span", "", "carousel-caption");
  const controls = element("div", "", "carousel-controls");
  const previous = element("button", "‹");
  const next = element("button", "›");
  const playback = element("button");
  previous.setAttribute("aria-label", "上一张");
  next.setAttribute("aria-label", "下一张");
  for (const button of [previous, playback, next]) button.type = "button";
  controls.append(previous, playback, next);
  carousel.append(slide, controls);

  const slides = carouselPosts[category].map(([id, caption]) => {
    const post = lab.news.find(item => item.id === id);
    const urls = (post?.images || []).slice(0, 3);
    return {id, caption, urls};
  });
  let current = 0;
  let playing = !reducedMotion.matches;
  let hovering = false;
  function show(index) {
    current = (index + slides.length) % slides.length;
    const item = slides[current];
    slide.href = "#news/" + item.id;
    caption.textContent = item.caption;
    const image = element("img");
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    let photo = 0;
    function tryPhoto() {
      if (photo < item.urls.length) image.src = item.urls[photo++];
      else image.hidden = true;
    }
    image.addEventListener("error", tryPhoto);
    slide.replaceChildren(image, caption);
    tryPhoto();
  }
  function setPlayback(value) {
    playing = value;
    playback.textContent = value ? "Ⅱ" : "▷";
    playback.setAttribute("aria-label", value ? "暂停轮播" : "播放轮播");
  }
  previous.addEventListener("click", () => { setPlayback(false); show(current - 1); });
  next.addEventListener("click", () => { setPlayback(false); show(current + 1); });
  playback.addEventListener("click", () => setPlayback(!playing));
  carousel.addEventListener("pointerenter", () => { hovering = true; });
  carousel.addEventListener("pointerleave", () => { hovering = false; });
  carouselTimers.push(setInterval(() => {
    if (playing && !hovering && !carousel.contains(document.activeElement) && !document.hidden) show(current + 1);
  }, 6000));
  setPlayback(playing);
  show(0);
  return carousel;
}

function createNewsViewer(images) {
  const dialog = element("dialog", "", "news-viewer");
  dialog.setAttribute("aria-label", "动态图片查看器");
  const stage = element("div", "", "news-viewer-stage");
  const feedback = element("p", "", "news-viewer-feedback");
  feedback.setAttribute("role", "status");
  const preloaded = new Map();
  const status = element("p");
  status.setAttribute("aria-live", "polite");
  let index = 0;
  function show(nextIndex) {
    index = (nextIndex + images.length) % images.length;
    const photo = element("img");
    photo.referrerPolicy = "no-referrer";
    photo.alt = "动态配图 " + (index + 1);
    feedback.textContent = "正在加载图片…";
    stage.replaceChildren(photo, feedback);
    photo.addEventListener("load", () => {
      if (photo.parentNode !== stage || !dialog.open) return;
      feedback.textContent = "";
      const neighbors = new Set([(index + 1) % images.length, (index + images.length - 1) % images.length]);
      neighbors.delete(index);
      for (const key of preloaded.keys()) if (!neighbors.has(key)) preloaded.delete(key);
      for (const key of neighbors) {
        if (preloaded.has(key)) continue;
        const preview = new Image();
        preview.referrerPolicy = "no-referrer";
        preview.fetchPriority = "low";
        preview.src = images[key];
        preloaded.set(key, preview);
      }
    });
    photo.addEventListener("error", () => {
      if (photo.parentNode !== stage) return;
      photo.hidden = true;
      feedback.textContent = "图片暂无法加载";
    });
    photo.src = images[index];
    status.textContent = (index + 1) + " / " + images.length;
  }
  function control(text, label, action) {
    const button = element("button", text);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.addEventListener("click", action);
    return button;
  }
  const controls = element("div", "", "news-viewer-controls");
  if (images.length > 1) controls.append(control("‹", "上一张", () => show(index - 1)));
  controls.append(status);
  if (images.length > 1) controls.append(control("›", "下一张", () => show(index + 1)));
  controls.append(control("×", "关闭图片", () => dialog.close()));
  dialog.append(stage, controls);
  let swipe;
  stage.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch" || !event.isPrimary || images.length < 2) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointercancel", () => { swipe = undefined; });
  stage.addEventListener("pointerup", event => {
    if (swipe?.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = undefined;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) show(index + (dx < 0 ? 1 : -1));
  });
  dialog.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    show(index + (event.key === "ArrowLeft" ? -1 : 1));
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    preloaded.clear();
    swipe = undefined;
    stage.replaceChildren();
    dialog.remove();
  });
  return nextIndex => {
    document.body.append(dialog);
    dialog.showModal();
    show(nextIndex);
  };
}

function render(route = location.hash.slice(1) || "home", previewLimit) {
  for (const timer of carouselTimers.splice(0)) clearInterval(timer);
  const project = lab.projects.find(item => route === "project/" + encodeURIComponent(item.id));
  const newsDetail = route.startsWith("news/");
  const post = newsDetail && lab.news.find(entry => route === "news/" + encodeURIComponent(entry.id));
  main.replaceChildren();
  document.title = lab.name;
  main.dataset.page = project ? "project" : route;
  for (const item of navLinks) {
    if (item.hash === "#" + route || (project && item.hash === "#research") || (newsDetail && item.hash === "#news")) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }

  if (newsDetail) {
    main.append(link("← 返回动态列表", "#news", "back"));
    if (post) {
      heading(post.title, newsDate(post));
      document.title = post.title + " · " + lab.name;
      const article = element("article", "", "news-body");
      const paragraphs = post.body || (post.description ? post.description.split("\n") : []);
      for (const paragraph of paragraphs) article.append(element("p", paragraph));
      if (post.excerptOnly && (!post.body || !post.sourceUrl)) {
        article.append(element("p", "仅收录 QQ 空间备份中的原帖摘要。", "entry-meta"));
      }
      if (post.sourceUrl) {
        const source = link("查看学校官网报道与原文 →", post.sourceUrl);
        article.append(source);
      }
      if (post.images?.length) {
        const gallery = element("div", "", "news-gallery");
        const openViewer = createNewsViewer(post.images);
        for (const [index, url] of post.images.entries()) {
          const figure = element("figure");
          const image = element("img");
          image.alt = "动态原帖配图 " + (index + 1);
          image.loading = "lazy";
          image.referrerPolicy = "no-referrer";
          const thumbnail = element("button", "", "news-thumbnail");
          thumbnail.type = "button";
          thumbnail.setAttribute("aria-label", "放大查看配图 " + (index + 1));
          thumbnail.addEventListener("click", () => openViewer(index));
          thumbnail.append(image);
          const unavailable = element("figcaption", "原帖配图 " + (index + 1) + " 暂无法加载");
          unavailable.hidden = true;
          image.addEventListener("error", () => {
            thumbnail.hidden = true;
            unavailable.hidden = false;
          });
          figure.append(thumbnail, unavailable);
          gallery.append(figure);
          image.src = url;
        }
        article.append(gallery);
      }
      main.append(article);
    } else {
      heading("未找到这条动态");
    }
  } else if (project) {
    main.append(link("← 所有研究方向", "#research", "back"));
    heading(project.title, project.description);
    document.title = project.title + " · " + lab.name;
    if (project.image) {
      const image = element("img", "", "project-image");
      image.src = project.image;
      image.alt = project.imageAlt || "";
      main.append(image);
    }
    if (project.body) main.append(element("p", project.body, "project-body"));
    if (project.members?.length) {
      indexSection("项目成员", element("p", project.members.join("、")));
    }
    for (const [title, entries] of Object.values(collections)) {
      const related = entries.filter(entry => entry.projects?.includes(project.id));
      if (related.length) {
        const projectEntries = entries === lab.people
          ? related.map(entry => ({ ...entry, description: undefined }))
          : related;
        indexSection(title, list(projectEntries, "", entries === lab.news));
      }
    }
  } else if (route === "research") {
    heading("研发项目", "浏览实验室的项目方向、研发计划与相关组会。");
    const projects = previewLimit ? lab.projects.slice(0, previewLimit) : lab.projects;
    const featured = projects.filter(project => project.featured);
    if (featured.length) {
      indexSection("核心研发项目", projectGrid(featured));
      const otherProjects = projects.filter(project => !project.featured);
      if (otherProjects.length) indexSection("其他研发与历史项目", projectGrid(otherProjects));
    } else {
      main.append(projectGrid(projects));
    }
  } else if (Object.hasOwn(collections, route)) {
    const [title, entries] = collections[route];
    heading(title, route === "news" ? "整理自实验室官方 QQ 空间及金陵科技学院官网。部分动态为原帖摘要。" : undefined);
    document.title = title + " · " + lab.name;
    if (route === "news") newsArchive(previewLimit);
    else if (route === "publications") achievements(previewLimit);
    else main.append(list(previewLimit ? entries.slice(0, previewLimit) : entries, "暂无条目。"));
  } else if (route === "about") {
    heading("关于实验室", lab.intro);
    indexSection("发展与实践", list(lab.about));
    if (lab.contact) indexSection("联系", element("p", lab.contact));
    const fontCredit = element("p", "本站使用鸿蒙黑体（HarmonyOS Sans）。");
    fontCredit.append(" © 2021 Huawei Device Co., Ltd. ", link("查看字体许可全文", "assets/fonts/LICENSE.txt"));
    indexSection("字体许可", fontCredit);
  } else {
    const hero = heading(lab.name, lab.intro);
    hero.className += " home-hero";
    if (lab.name.startsWith("StackFarm")) {
      hero.querySelector("h1").replaceChildren(
        element("span", "StackFarm"),
        element("span", lab.name.slice("StackFarm".length))
      );
    }
    const actions = element("div", "", "hero-actions");
    actions.append(
      link("探索研发项目", "#research", "hero-action primary"),
      link("查看竞赛成果", "#publications", "hero-action")
    );
    const heroContent = element("div", "", "hero-content");
    heroContent.append(...hero.children, actions);
    hero.append(heroContent);
    const highlights = element("div", "", "highlights");
    const features = [
      ["竞赛成果", "从中国软件杯到大学生计算机设计大赛，浏览实验室团队的参赛记录与获奖成果。", "查看竞赛成果", "#publications", "awards"],
      ["研发项目", "从智能文档处理、开源 AI 教学到物联网与智慧农业，了解实验室的研发方向与项目进展。", "浏览研发项目", "#research", "software"],
      ["实验室团队", "了解指导教师，以及他们参与指导的学生研发项目。", "认识团队", "#people", "team"]
    ];
    for (const [title, description, label, href, artwork] of features) {
      const feature = element("section", "", "feature");
      const picture = featureCarousel(title, artwork);
      const copy = element("div", "", "feature-copy");
      copy.append(element("h2", title), element("p", description), link(label + " →", href, "feature-link"));
      feature.append(picture, copy);
      highlights.append(feature);
    }
    main.append(highlights);
    indexSection("近期动态", list(lab.news.slice(0, 3), "暂无动态。", true), "#news");
  }
}

for (const item of document.querySelectorAll("[data-name]")) item.textContent = lab.name;
const siteHeader = document.querySelector(".site-header");
if (siteHeader && typeof ResizeObserver === "function") {
  const resizeHeader = () => {
    main.style.setProperty("--site-header-height", siteHeader.getBoundingClientRect().height + "px");
  };
  resizeHeader();
  new ResizeObserver(resizeHeader).observe(siteHeader);
}
render();
const navRoutes = navLinks.map(item => item.hash.slice(1));
let navigationOverlay;
let navigationAnimation;
window.addEventListener("hashchange", () => {
  if (location.hash === "#main") return;
  document.querySelector(".news-viewer[open]")?.close();
  navigationAnimation?.cancel();
  navigationOverlay?.remove();
  const route = location.hash.slice(1) || "home";
  const from = navRoutes.indexOf(main.dataset.page);
  const to = navRoutes.indexOf(route);
  const slide = from >= 0 && to >= 0 && from !== to && !reducedMotion.matches && typeof main.animate === "function";
  if (slide) {
    const overlay = element("div", "", "navigation-overlay");
    overlay.inert = true;
    overlay.setAttribute("aria-hidden", "true");
    const track = element("div", "", "navigation-track");
    const direction = Math.sign(to - from);
    const distance = Math.abs(to - from);
    const addPanel = (offset = 0) => {
      const panel = element("div", "", "navigation-panel");
      const snapshot = main.cloneNode(true);
      snapshot.removeAttribute("id");
      snapshot.style.marginTop = offset + "px";
      panel.append(snapshot);
      track.append(panel);
    };
    const headerBottom = siteHeader?.getBoundingClientRect().bottom ?? 0;
    addPanel(main.getBoundingClientRect().top - Math.max(0, headerBottom));
    for (let index = from + direction; index !== to; index += direction) {
      render(navRoutes[index], 8);
      addPanel();
    }
    render(route);
    addPanel();
    if (direction < 0) track.replaceChildren(...Array.from(track.children).reverse());
    overlay.append(track);
    document.body.append(overlay);
    navigationOverlay = overlay;
    const positions = ["translateX(0)", `translateX(-${distance * 100}%)`];
    if (direction < 0) positions.reverse();
    const animation = track.animate(positions.map(transform => ({ transform })), {
      duration: Math.min(850, 360 + (distance - 1) * 130),
      easing: "cubic-bezier(.45,0,.25,1)",
      fill: "both"
    });
    navigationAnimation = animation;
    const removeOverlay = () => {
      overlay.remove();
      if (navigationOverlay === overlay) navigationOverlay = undefined;
      if (navigationAnimation === animation) navigationAnimation = undefined;
    };
    animation.finished.then(removeOverlay, removeOverlay);
  } else {
    render(route);
  }
  window.scrollTo(0, 0);
  if (slide) navigationOverlay.style.top = Math.max(0, siteHeader?.getBoundingClientRect().bottom ?? 0) + "px";
  main.focus({ preventScroll: true });
});

const theme = document.querySelector(".theme");
const key = "lab-color-theme";
let saved;
try { saved = localStorage.getItem(key); } catch {}
function applyTheme() {
  const dark = saved === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  theme.textContent = dark ? "☾" : "☀";
  theme.setAttribute("aria-pressed", String(dark));
  theme.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
}
theme.addEventListener("click", async () => {
  theme.disabled = true;
  saved = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem(key, saved); } catch {}
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyTheme();
    theme.disabled = false;
    return;
  }

  const bounds = theme.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const root = document.documentElement;
  root.style.setProperty("--theme-origin", x + "px " + y + "px");
  navigationAnimation?.cancel();
  navigationOverlay?.remove();
  const background = element("div", "", "theme-ripple-overlay");
  const content = element("div", "", "theme-ripple-content");
  const sources = [siteHeader, main, document.querySelector(".site-footer")].filter(Boolean);
  let ripple;
  try {
    background.dataset.theme = content.dataset.theme = saved;
    background.setAttribute("aria-hidden", "true");
    content.setAttribute("aria-hidden", "true");
    content.inert = true;
    for (const source of sources) {
      const rect = source.getBoundingClientRect();
      const copy = source.cloneNode(true);
      copy.removeAttribute("id");
      Object.assign(copy.style, {
        position: "absolute", margin: "0",
        left: rect.left + "px", top: rect.top + "px", width: rect.width + "px"
      });
      content.append(copy);
      source.style.setProperty("--ripple-local-origin", `${x - rect.left}px ${y - rect.top}px`);
      source.classList.add("theme-ripple-source");
    }
    document.body.append(background, content);
    ripple = root.animate([
      { "--theme-ripple-size": "0px" },
      { "--theme-ripple-size": radius + "px" }
    ], { duration: 560, easing: "cubic-bezier(.22,.65,.28,1)", fill: "forwards" });
    await ripple.finished;
  } finally {
    applyTheme();
    ripple?.cancel();
    background.remove();
    content.remove();
    for (const source of sources) {
      source.classList.remove("theme-ripple-source");
      source.style.removeProperty("--ripple-local-origin");
    }
    theme.disabled = false;
  }
});
applyTheme();
theme.hidden = false;

const starfield = element("canvas", "", "theme-particles");
starfield.setAttribute("aria-hidden", "true");
if (window.THREE) {
  let renderer;
  try {
      renderer = new THREE.WebGLRenderer({ canvas: starfield, alpha: true });
  } catch {
    // The theme background remains visible when WebGL is unavailable.
  }
  if (renderer) {
    document.body.prepend(starfield);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1800);
    camera.position.z = 220;

    const positions = new Float32Array(6000 * 3);
    for (let index = 0; index < positions.length; index++) {
      positions[index] = (Math.random() - 0.5) * 1200;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const dotContext = dot.getContext("2d");
    dotContext.fillStyle = "#fff";
    dotContext.beginPath();
    dotContext.arc(16, 16, 15, 0, Math.PI * 2);
    dotContext.fill();
    const dotTexture = new THREE.CanvasTexture(dot);
    const material = new THREE.PointsMaterial({
      color: 0xffffff, map: dotTexture, size: 1.4, transparent: true, opacity: 0.68, depthWrite: false
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    let frame;
    let previousFrame;
    function animate(time) {
      const elapsed = previousFrame === undefined ? 0 : Math.min(time - previousFrame, 50);
      previousFrame = time;
      stars.rotation.y += 0.0012 * elapsed * 60 / 1000;
      stars.rotation.x += 0.0004 * elapsed * 60 / 1000;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      cancelAnimationFrame(frame);
      previousFrame = undefined;
      renderer.render(scene, camera);
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    }
    function resizeStarfield() {
      const width = Math.max(1, starfield.clientWidth);
      const height = Math.max(1, starfield.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      syncAnimation();
    }
    window.addEventListener("resize", resizeStarfield);
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);
    resizeStarfield();
  }
}
