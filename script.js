let extracted1 = {},
  extracted2 = {};

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
  document.getElementById('content1').textContent =
    extracted1[selected] || '(Not found)';
  document.getElementById('content2').textContent =
    extracted2[selected] || '(Not found)';
});
