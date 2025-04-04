let extracted1 = {},
  extracted2 = {};
let rawDiffText = '';

async function extractOfficeFile(file) {
  const zip = await JSZip.loadAsync(file);
  const contents = {};
  for (const path in zip.files) {
    const fileObj = zip.files[path];
    if (!fileObj.dir) {
      contents[path] = await fileObj.async('string');
    }
  }
  return contents;
}

function updateCommonFileList() {
  const selector = document.getElementById('entrySelector');
  selector.innerHTML = '<option value="">-- Select a file part --</option>';
  const keys1 = Object.keys(extracted1);
  const keys2 = Object.keys(extracted2);
  const common = keys1.filter((k) => keys2.includes(k));
  common.forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    selector.appendChild(opt);
  });
}

function compressXML(xml) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'application/xml');
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  } catch (e) {
    return xml; // fallback to raw
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeDiff(text1, text2) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);

  let leftHTML = '';
  let rightHTML = '';
  rawDiffText = '';

  for (let i = 0; i < diffs.length; i++) {
    const op = diffs[i][0];
    const data = diffs[i][1];
    rawDiffText += data;

    switch (op) {
      case DIFF_EQUAL:
        leftHTML += `<span>${escapeHtml(data)}</span>`;
        rightHTML += `<span>${escapeHtml(data)}</span>`;
        break;
      case DIFF_DELETE:
        leftHTML += `<del>${escapeHtml(data)}</del>`;
        rightHTML += `<span></span>`;
        break;
      case DIFF_INSERT:
        leftHTML += `<span></span>`;
        rightHTML += `<ins>${escapeHtml(data)}</ins>`;
        break;
    }
  }

  document.getElementById('leftDiff').innerHTML = leftHTML;
  document.getElementById('rightDiff').innerHTML = rightHTML;
}

document.getElementById('file1').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    extracted1 = await extractOfficeFile(file);
    if (Object.keys(extracted2).length) updateCommonFileList();
  }
});

document.getElementById('file2').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    extracted2 = await extractOfficeFile(file);
    if (Object.keys(extracted1).length) updateCommonFileList();
  }
});

document.getElementById('entrySelector').addEventListener('change', (e) => {
  const selected = e.target.value;
  const content1 = compressXML(extracted1[selected] || '');
  const content2 = compressXML(extracted2[selected] || '');
  computeDiff(formatXML(content1), formatXML(content2));
});

document.getElementById('downloadDiff').addEventListener('click', () => {
  const blob = new Blob([rawDiffText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'diff_output.txt';
  link.click();
});
