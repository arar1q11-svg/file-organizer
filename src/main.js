import { createOrganizedZip, formatFileSize, getCategory, MAX_TOTAL_BYTES } from './organizer.js';
import './style.css';

const dropZone = document.querySelector('#drop-zone');
const fileInput = document.querySelector('#file-input');
const filePanel = document.querySelector('#file-panel');
const fileList = document.querySelector('#file-list');
const fileCount = document.querySelector('#file-count');
const fileSummary = document.querySelector('#file-summary');
const statusMessage = document.querySelector('#status-message');
const organizeButton = document.querySelector('#organize-files');
const files = [];

function renderFiles() {
  const hasFiles = files.length > 0;
  dropZone.hidden = hasFiles;
  filePanel.hidden = !hasFiles;
  if (!hasFiles) return;

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  fileCount.textContent = String(files.length);
  fileSummary.textContent = `${formatFileSize(totalBytes)} · ${[...new Set(files.map((file) => getCategory(file.name)))].length}개 종류`;
  organizeButton.disabled = totalBytes > MAX_TOTAL_BYTES;
  statusMessage.textContent = totalBytes > MAX_TOTAL_BYTES
    ? '파일 크기의 합이 250MB를 넘었어요. 파일을 줄인 뒤 다시 시도해 주세요.'
    : '';

  fileList.replaceChildren();
  files.forEach((file) => {
    const item = document.createElement('li');
    item.className = 'file-item';
    const details = document.createElement('div');
    details.className = 'file-details';
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;
    const meta = document.createElement('span');
    meta.className = 'file-meta';
    meta.textContent = `${getCategory(file.name)} · ${formatFileSize(file.size)}`;
    details.append(name, meta);
    item.append(details);
    fileList.append(item);
  });
}

function addFiles(fileListToAdd) {
  files.push(...Array.from(fileListToAdd));
  statusMessage.textContent = '';
  renderFiles();
}

document.querySelector('#choose-files').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => {
  addFiles(event.currentTarget.files);
  fileInput.value = '';
});

dropZone.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  fileInput.click();
});
for (const eventName of ['dragenter', 'dragover']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragging');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragging');
  });
}
dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

document.querySelector('#clear-files').addEventListener('click', () => {
  files.length = 0;
  fileList.replaceChildren();
  renderFiles();
});

organizeButton.addEventListener('click', async () => {
  organizeButton.disabled = true;
  organizeButton.textContent = '파일을 정리하고 있어요...';
  statusMessage.textContent = '';

  try {
    const archive = await createOrganizedZip(files);
    const url = URL.createObjectURL(new Blob([archive], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `정리된_파일_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusMessage.textContent = '정리된 ZIP 파일을 저장했어요. 원본 파일은 그대로예요.';
  } catch (error) {
    statusMessage.textContent = error instanceof Error
      ? `파일을 정리하지 못했어요. ${error.message}`
      : '파일을 정리하지 못했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    organizeButton.disabled = false;
    organizeButton.innerHTML = '<span aria-hidden="true">✦</span> 파일 정리하고 ZIP 받기';
  }
});
