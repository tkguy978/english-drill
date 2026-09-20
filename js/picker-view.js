// 섹션 선택 화면. 각 항목은 ?source=&section= 링크라서 이동은 페이지 로드로 처리된다.
// 자료 > 그룹(에피소드) > 섹션(장면) 순으로 쌓고, 그룹은 접었다 펼 수 있다.

import { findSection } from "./data.js";
import { listProgress, loadProgress } from "./store.js";

// 최근 연습한 섹션을 맨 위에 몇 개까지 올릴지, 목록이 얼마나 길 때부터 올릴지.
const RECENT_LIMIT = 3;
const RECENT_MIN_SECTIONS = 4;

function href(sourceId, sectionId, marked = false) {
  const params = { source: sourceId, section: sectionId };
  if (marked) params.mode = "marked";
  return "?" + new URLSearchParams(params);
}

// 한 번도 연습하지 않은 섹션은 저장된 진도가 없어서 아무것도 보여주지 않는다.
function whereLabel(saved) {
  if (!saved) return "";
  return saved.no === null ? "한 바퀴 완료" : `${saved.at} / ${saved.total}`;
}

function sectionRow(sourceId, section, saved, titleText) {
  const link = document.createElement("a");
  link.className = "section-link";
  link.href = href(sourceId, section.id);

  const title = document.createElement("span");
  title.textContent = titleText || section.title;
  const where = document.createElement("span");
  where.className = "progress";
  where.textContent = whereLabel(saved);
  link.append(title, where);

  const li = document.createElement("li");
  li.append(link);

  // 표시한 문장이 있을 때만 칩이 생긴다. 없으면 누를 것 자체가 없다.
  if (saved && saved.marked.length) {
    const chip = document.createElement("a");
    chip.className = "chip chip-link";
    chip.href = href(sourceId, section.id, true);
    chip.textContent = `헷갈림 ${saved.marked.length}`;
    chip.title = `${titleText || section.title}의 헷갈린 문장만 연습하기`;
    li.append(chip);
  }

  return li;
}

function groupBlock(sourceId, group) {
  const savedList = group.sections.map(s => loadProgress(sourceId, s.id));
  const started = savedList.filter(Boolean).length;
  const markedTotal = savedList.reduce((sum, s) => sum + (s ? s.marked.length : 0), 0);

  const details = document.createElement("details");
  details.className = "group";
  details.open = started > 0;

  const summary = document.createElement("summary");
  const name = document.createElement("span");
  name.textContent = group.title;
  const meta = document.createElement("span");
  meta.className = "progress";
  meta.textContent = markedTotal
    ? `장면 ${group.sections.length}개 · 헷갈림 ${markedTotal}`
    : `장면 ${group.sections.length}개`;
  summary.append(name, meta);

  const ul = document.createElement("ul");
  ul.className = "sections";
  ul.append(...group.sections.map((s, i) => sectionRow(sourceId, s, savedList[i])));

  details.append(summary, ul);
  return details;
}

// 목록이 짧으면 바로 아래에 다 보이므로 만들지 않는다.
function recentBlock(manifest) {
  const sectionCount = manifest.sources
    .reduce((sum, b) => sum + b.groups.reduce((n, g) => n + g.sections.length, 0), 0);
  if (sectionCount < RECENT_MIN_SECTIONS) return null;

  const manySources = manifest.sources.length > 1;
  const rows = [];
  for (const { sourceId, sectionId, saved } of listProgress()) {
    if (rows.length >= RECENT_LIMIT) break;
    // manifest 에서 빠진 섹션의 옛 기록은 건너뛴다.
    const found = findSection(manifest, sourceId, sectionId);
    if (!found) continue;
    const label = [manySources ? found.source.title : null, found.group.title, found.section.title]
      .filter(Boolean).join(" · ");
    rows.push(sectionRow(sourceId, found.section, saved, label));
  }
  if (!rows.length) return null;

  const block = document.createElement("section");
  block.className = "source";

  const heading = document.createElement("h2");
  heading.textContent = "이어서 하기";

  const card = document.createElement("div");
  card.className = "recent";
  const ul = document.createElement("ul");
  ul.className = "sections";
  ul.append(...rows);
  card.append(ul);

  block.append(heading, card);
  return block;
}

export function renderPicker(manifest, { notice } = {}) {
  const root = document.getElementById("picker");
  const noticeEl = document.getElementById("picker-notice");
  const list = document.getElementById("picker-list");

  noticeEl.textContent = notice || "";
  noticeEl.hidden = !notice;

  const sources = manifest.sources.map(source => {
    const block = document.createElement("section");
    block.className = "source";

    const heading = document.createElement("h2");
    heading.textContent = source.title;

    block.append(heading, ...source.groups.map(group => groupBlock(source.id, group)));
    return block;
  });

  const recent = recentBlock(manifest);
  list.replaceChildren(...(recent ? [recent] : []), ...sources);

  // 아무 섹션도 시작하지 않았으면 첫 그룹만 펼쳐 둔다.
  if (!list.querySelector("details[open]")) {
    const first = list.querySelector("details");
    if (first) first.open = true;
  }

  root.hidden = false;
}
