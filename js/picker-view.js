// 섹션 선택 화면. 각 항목은 ?book=&section= 링크라서 이동은 페이지 로드로 처리된다.
// 책 > 그룹(에피소드) > 섹션(장면) 순으로 쌓고, 그룹은 접었다 펼 수 있다.

import { loadProgress } from "./store.js";

function href(bookId, sectionId, marked = false) {
  const params = { book: bookId, section: sectionId };
  if (marked) params.mode = "marked";
  return "?" + new URLSearchParams(params);
}

// 한 번도 연습하지 않은 섹션은 저장된 진도가 없어서 아무것도 보여주지 않는다.
function whereLabel(saved) {
  if (!saved) return "";
  return saved.no === null ? "한 바퀴 완료" : `${saved.at} / ${saved.total}`;
}

function sectionRow(bookId, section) {
  const saved = loadProgress(bookId, section.id);

  const link = document.createElement("a");
  link.className = "section-link";
  link.href = href(bookId, section.id);

  const title = document.createElement("span");
  title.textContent = section.title;
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
    chip.href = href(bookId, section.id, true);
    chip.textContent = `헷갈림 ${saved.marked.length}`;
    chip.title = `${section.title}의 헷갈린 문장만 연습하기`;
    li.append(chip);
  }

  return li;
}

function groupBlock(bookId, group) {
  const savedList = group.sections.map(s => loadProgress(bookId, s.id));
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
  ul.append(...group.sections.map(s => sectionRow(bookId, s)));

  details.append(summary, ul);
  return details;
}

export function renderPicker(manifest, { notice } = {}) {
  const root = document.getElementById("picker");
  const noticeEl = document.getElementById("picker-notice");
  const list = document.getElementById("picker-books");

  noticeEl.textContent = notice || "";
  noticeEl.hidden = !notice;

  list.replaceChildren(...manifest.books.map(book => {
    const block = document.createElement("section");
    block.className = "book";

    const heading = document.createElement("h2");
    heading.textContent = book.title;

    block.append(heading, ...book.groups.map(group => groupBlock(book.id, group)));
    return block;
  }));

  // 아무 섹션도 시작하지 않았으면 첫 그룹만 펼쳐 둔다.
  if (!list.querySelector("details[open]")) {
    const first = list.querySelector("details");
    if (first) first.open = true;
  }

  root.hidden = false;
}
