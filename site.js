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

function projectGrid() {
  const grid = element("div", "", "project-grid");
  for (const project of lab.projects) {
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

function achievements() {
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
    const visible = category === "all" ? entries : entries.filter(entry => entry.category === category);
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

function newsArchive() {
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

  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    const entries = lab.news.filter(entry =>
      [entry.title, entry.meta, entry.eventDate, entry.description, ...(entry.body || [])].join(" ").toLocaleLowerCase().includes(query)
    );
    count.textContent = entries.length + " 条动态";
    results.replaceChildren(list(entries, "没有找到匹配的动态。", true));
  }
  input.addEventListener("input", filter);
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
const cupPhoto = "https://soft.jit.edu.cn/__local/8/37/C8/E76CD0B7F09B1BDEB65A2A8A256_1F6B85D3_42683.jpg";

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
    if (id === "qzone-40") urls.unshift(cupPhoto);
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

function render() {
  for (const timer of carouselTimers.splice(0)) clearInterval(timer);
  const route = location.hash.slice(1) || "home";
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
      if (post.excerptOnly && !post.body) {
        article.append(element("p", "仅收录 QQ 空间备份中的原帖摘要。", "entry-meta"));
      }
      if (post.sourceUrl) {
        const source = link("查看学校官网报道与原文 →", post.sourceUrl);
        article.append(source);
      }
      if (post.images?.length) {
        const gallery = element("div", "", "news-gallery");
        for (const [index, url] of post.images.entries()) {
          const figure = element("figure");
          const image = element("img");
          image.alt = "动态原帖配图 " + (index + 1);
          image.loading = "lazy";
          image.referrerPolicy = "no-referrer";
          const unavailable = element("figcaption", "原帖配图 " + (index + 1) + " 暂无法加载");
          unavailable.hidden = true;
          image.addEventListener("error", () => {
            image.hidden = true;
            unavailable.hidden = false;
          });
          figure.append(image, unavailable);
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
    for (const [title, entries] of Object.values(collections)) {
      const related = entries.filter(entry => entry.projects?.includes(project.id));
      if (related.length) indexSection(title, list(related, "", entries === lab.news));
    }
  } else if (route === "research") {
    heading("研发项目", "浏览实验室的项目方向、研发计划与相关组会。");
    main.append(projectGrid());
  } else if (Object.hasOwn(collections, route)) {
    const [title, entries] = collections[route];
    heading(title, route === "news" ? "整理自实验室官方 QQ 空间及金陵科技学院官网。部分动态为原帖摘要。" : undefined);
    document.title = title + " · " + lab.name;
    if (route === "news") newsArchive();
    else if (route === "publications") achievements();
    else main.append(list(entries, "暂无条目。"));
  } else if (route === "about") {
    heading("关于实验室", lab.intro);
    indexSection("发展与实践", list(lab.about));
    if (lab.contact) indexSection("联系", element("p", lab.contact));
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
      ["研发项目", lab.projects.map(item => item.title).join("、") + "。", "浏览研发项目", "#research", "software"],
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
window.addEventListener("hashchange", () => {
  if (location.hash === "#main") return;
  render();
  window.scrollTo(0, 0);
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
  root.style.setProperty("--theme-radius", radius + "px");
  try {
    if (document.startViewTransition) {
      const transition = document.startViewTransition(applyTheme);
      await transition.finished;
    } else {
      const overlay = element("div", "", "theme-ripple-overlay");
      overlay.setAttribute("aria-hidden", "true");
      root.style.setProperty("--ripple-color", saved === "dark" ? "#122033" : "#f7fafc");
      document.body.append(overlay);
      try {
        await overlay.animate([
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${radius}px at ${x}px ${y}px)` }
        ], { duration: 560, easing: "cubic-bezier(.22,.65,.28,1)", fill: "forwards" }).finished;
        applyTheme();
        await overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }).finished;
      } finally {
        overlay.remove();
      }
    }
  } catch {
    applyTheme();
  } finally {
    theme.disabled = false;
  }
});
applyTheme();
theme.hidden = false;
