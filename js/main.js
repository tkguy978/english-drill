// 진입점. URL 을 읽고 섹션 선택 화면과 연습 화면 중 하나를 띄운다.

import { findSection, loadManifest, loadSection } from "./data.js";
import { renderDrill } from "./drill-view.js";
import { renderPicker } from "./picker-view.js";

const status = document.getElementById("status");

async function boot() {
  const params = new URLSearchParams(location.search);
  const bookId = params.get("book");
  const sectionId = params.get("section");

  const manifest = await loadManifest();

  if (!bookId && !sectionId) {
    renderPicker(manifest);
    return;
  }

  const found = findSection(manifest, bookId, sectionId);
  if (!found) {
    renderPicker(manifest, { notice: "요청한 섹션을 찾을 수 없습니다. 아래에서 골라 주세요." });
    return;
  }

  let rows;
  try {
    rows = await loadSection(found.book, found.section);
  } catch (err) {
    console.error(err);
    renderPicker(manifest, { notice: "섹션 문장을 불러오지 못했습니다. 다른 섹션을 골라 주세요." });
    return;
  }
  renderDrill(found, rows, { review: params.get("mode") === "marked" });
}

boot()
  .then(() => { status.hidden = true; })
  .catch(err => {
    console.error(err);
    status.textContent = "데이터를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.";
  });
