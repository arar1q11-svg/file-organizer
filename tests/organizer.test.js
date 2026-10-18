import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unzipSync } from 'fflate';
import { createOrganizedZip, formatFileSize, getCategory, MAX_TOTAL_BYTES } from '../src/organizer.js';

test('classifies common file types and unknown extensions', () => {
  assert.equal(getCategory('photo.JPEG'), '사진');
  assert.equal(getCategory('recording.mp4'), '동영상');
  assert.equal(getCategory('notes.hwpx'), '문서');
  assert.equal(getCategory('project.ts'), '코드');
  assert.equal(getCategory('archive.unknown'), '기타');
  assert.equal(getCategory('README'), '기타');
});

test('creates a ZIP with categorized paths and unique duplicate names', async () => {
  const files = [
    new File(['first'], 'report.txt'),
    new File(['second'], 'report.txt'),
    new File(['image'], 'photo.png'),
  ];
  const archive = unzipSync(await createOrganizedZip(files));

  assert.deepEqual(Object.keys(archive).sort(), [
    '사진/photo.png',
    '문서/report (2).txt',
    '문서/report.txt',
  ].sort());
  assert.equal(new TextDecoder().decode(archive['문서/report.txt']), 'first');
  assert.equal(new TextDecoder().decode(archive['문서/report (2).txt']), 'second');
});

test('rejects an archive that exceeds the size limit', async () => {
  const oversizedFile = { name: 'large.bin', size: MAX_TOTAL_BYTES + 1 };
  await assert.rejects(createOrganizedZip([oversizedFile]), {
    name: 'RangeError',
    message: '한 번에 정리할 수 있는 파일은 최대 250MB입니다.',
  });
});

test('formats byte sizes for the file summary', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(1048576), '1.0 MB');
});
