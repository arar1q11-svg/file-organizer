import { zipSync } from 'fflate';

export const MAX_TOTAL_BYTES = 250 * 1024 * 1024;

const categories = [
  {
    name: '사진',
    extensions: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif', 'bmp', 'tif', 'tiff', 'avif', 'ico']),
  },
  {
    name: '동영상',
    extensions: new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v', 'mpeg', 'mpg', '3gp']),
  },
  {
    name: '음악',
    extensions: new Set(['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'mid', 'midi']),
  },
  {
    name: '문서',
    extensions: new Set(['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'hwp', 'hwpx', 'md', 'xls', 'xlsx', 'csv', 'ods', 'ppt', 'pptx', 'odp']),
  },
  {
    name: '압축 파일',
    extensions: new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz']),
  },
  {
    name: '코드',
    extensions: new Set(['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh', 'sql', 'vue', 'svelte']),
  },
];

export function getCategory(fileName) {
  const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  return categories.find((category) => category.extensions.has(extension))?.name ?? '기타';
}

function safeFileName(fileName) {
  const sanitized = fileName.replace(/[\\/<>:"|?*\u0000-\u001f]/g, '_').trim();
  return sanitized && sanitized !== '.' && sanitized !== '..' ? sanitized : '이름 없는 파일';
}

function uniquePath(category, fileName, usedPaths) {
  const safeName = safeFileName(fileName);
  const dot = safeName.lastIndexOf('.');
  const hasExtension = dot > 0;
  const stem = hasExtension ? safeName.slice(0, dot) : safeName;
  const extension = hasExtension ? safeName.slice(dot) : '';
  let candidate = `${category}/${safeName}`;
  let number = 2;

  while (usedPaths.has(candidate.toLocaleLowerCase())) {
    candidate = `${category}/${stem} (${number})${extension}`;
    number += 1;
  }

  usedPaths.add(candidate.toLocaleLowerCase());
  return candidate;
}

export async function createOrganizedZip(files) {
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new RangeError('한 번에 정리할 수 있는 파일은 최대 250MB입니다.');
  }

  const archiveFiles = {};
  const usedPaths = new Set();
  for (const file of files) {
    const category = getCategory(file.name);
    archiveFiles[uniquePath(category, file.name, usedPaths)] = new Uint8Array(await file.arrayBuffer());
  }

  return zipSync(archiveFiles, { level: 1 });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
