const BASE_URL = "https://api.so999.site";

const form = document.getElementById("linkForm");
const statusEl = document.getElementById("status");
const whyInput = document.getElementById("why");
const urlInput = document.getElementById("url");
const memoInput = document.getElementById("memo");
const referenceSelect = document.getElementById("referenceId");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function loadCurrentTabUrl() {
  if (!chrome?.tabs?.query) return;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs?.[0]?.url;
    if (currentUrl && !urlInput.value) {
      urlInput.value = currentUrl;
    }
  } catch {
    // Ignore: URL 자동 채우기 실패는 치명적이지 않음
  }
}

async function loadReferences() {
  setStatus("레퍼런스 폴더를 불러오는 중...");

  try {
    const response = await fetch(`${BASE_URL}/api/v1/references?type=all`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`폴더 조회 실패 (${response.status})`);
    }

    const payload = await response.json();
    const references = payload?.data?.contents ?? [];

    references.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item.id);
      option.textContent = item.title;
      referenceSelect.appendChild(option);
    });

    setStatus(references.length ? "" : "표시할 레퍼런스 폴더가 없습니다.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    setStatus(`레퍼런스 폴더를 불러오지 못했습니다: ${message}`, true);
  }
}

function resetForm() {
  form.reset();
  setStatus("");
}

async function submitLink(event) {
  event.preventDefault();

  const why = whyInput.value.trim();
  const url = urlInput.value.trim();
  const referenceId = referenceSelect.value;
  const memo = memoInput.value.trim();

  if (!why || !url || !referenceId) {
    setStatus("이유, 링크, 레퍼런스 폴더는 필수 입력값입니다.", true);
    return;
  }

  try {
    new URL(url);
  } catch {
    setStatus("올바른 링크(URL) 형식을 입력해 주세요.", true);
    return;
  }

  saveBtn.disabled = true;
  setStatus("저장 중...");

  try {
    const response = await fetch(`${BASE_URL}/api/v1/user-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        why,
        url,
        referenceId: Number(referenceId),
        memo
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload?.message || `저장 실패 (${response.status})`;
      throw new Error(message);
    }

    setStatus("링크가 저장되었습니다.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    setStatus(`저장 중 오류가 발생했습니다: ${message}`, true);
  } finally {
    saveBtn.disabled = false;
  }
}

cancelBtn.addEventListener("click", resetForm);
form.addEventListener("submit", submitLink);

void loadCurrentTabUrl();
void loadReferences();
