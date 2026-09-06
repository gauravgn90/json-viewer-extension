// content.js
// Runs on every page load. Bails out immediately unless the page IS a raw
// JSON document (i.e. the browser navigated directly to a JSON API URL).
(function () {
  'use strict';

  // ---- Chapter 4: Detect a raw JSON response ----
  if (document.contentType !== 'application/json') return;

  const rawText = document.body.innerText;
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return; // malformed JSON — leave the page as-is
  }

  renderViewer(data, rawText);

  // ---- Chapter 5: Build the viewer shell (toolbar + tree) ----
  function renderViewer(data, rawText) {
    const byteSize = new Blob([rawText]).size;
    const recordCount = countRecords(data);

    document.body.innerHTML = '';
    document.body.classList.add('jvp-body');

    const container = document.createElement('div');
    container.className = 'jvp-container';

    const toolbar = document.createElement('div');
    toolbar.className = 'jvp-toolbar';
    toolbar.innerHTML = `
      <input type="text" id="jvp-search" placeholder="Search keys or values…" autocomplete="off" />
      <div class="jvp-stats">
        <span>Records: <b id="jvp-record-count">${recordCount}</b></span>
        <span>Size: <b>${formatBytes(byteSize)}</b></span>
      </div>
      <div class="jvp-actions">
        <button id="jvp-expand-all">Expand All</button>
        <button id="jvp-collapse-all">Collapse All</button>
      </div>
    `;
    container.appendChild(toolbar);

    const treeRoot = document.createElement('div');
    treeRoot.className = 'jvp-tree';
    treeRoot.appendChild(buildNode('root', data, true));
    container.appendChild(treeRoot);

    document.body.appendChild(container);

    // ---- Chapter 7: wire up toolbar interactions ----
    document.getElementById('jvp-search').addEventListener('input', (e) => {
      handleSearch(e.target.value.trim().toLowerCase(), treeRoot);
    });
    document.getElementById('jvp-expand-all').addEventListener('click', () => toggleAll(treeRoot, true));
    document.getElementById('jvp-collapse-all').addEventListener('click', () => toggleAll(treeRoot, false));
  }

  // ---- Chapter 8: stats helpers ----
  function countRecords(value) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === 'object') return Object.keys(value).length;
    return 1;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ---- Chapter 5 (cont.): recursive node renderer ----
  function buildNode(key, value, isRoot) {
    const isObject = value !== null && typeof value === 'object';
    const wrapper = document.createElement('div');
    wrapper.className = 'jvp-node';
    wrapper.dataset.key = String(key).toLowerCase();

    if (isObject) {
      const isArray = Array.isArray(value);
      const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);

      const line = document.createElement('div');
      line.className = 'jvp-line';

      const toggle = document.createElement('span');
      toggle.className = 'jvp-toggle';
      toggle.textContent = '▾';
      line.appendChild(toggle);

      const keySpan = document.createElement('span');
      keySpan.className = 'jvp-key';
      keySpan.textContent = isRoot ? '' : `${key}: `;
      line.appendChild(keySpan);

      const bracketOpen = isArray ? '[' : '{';
      const bracketClose = isArray ? ']' : '}';
      const preview = document.createElement('span');
      preview.className = 'jvp-preview';
      preview.textContent = `${bracketOpen} ${entries.length} ${isArray ? 'items' : 'keys'} ${bracketClose}`;
      line.appendChild(preview);

      wrapper.appendChild(line);

      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'jvp-children';
      entries.forEach(([k, v]) => {
        childrenContainer.appendChild(buildNode(k, v, false));
      });
      wrapper.appendChild(childrenContainer);

      toggle.addEventListener('click', () => {
        const collapsed = wrapper.classList.toggle('jvp-collapsed');
        toggle.textContent = collapsed ? '▸' : '▾';
      });
    } else {
      wrapper.dataset.value = String(value).toLowerCase();
      const line = document.createElement('div');
      line.className = 'jvp-line jvp-leaf';
      const valueClass = `jvp-${typeof value}`;
      line.innerHTML =
        `<span class="jvp-toggle jvp-toggle-empty"></span>` +
        `<span class="jvp-key">${escapeHtml(String(key))}: </span>` +
        `<span class="jvp-value ${valueClass}">${escapeHtml(JSON.stringify(value))}</span>`;
      wrapper.appendChild(line);
    }

    return wrapper;
  }

  function toggleAll(root, expand) {
    root.querySelectorAll('.jvp-node').forEach((node) => {
      node.classList.toggle('jvp-collapsed', !expand);
    });
    root.querySelectorAll('.jvp-toggle:not(.jvp-toggle-empty)').forEach((t) => {
      t.textContent = expand ? '▾' : '▸';
    });
  }

  // ---- Chapter 6: search by key or value ----
  function handleSearch(query, root) {
    const allNodes = root.querySelectorAll('.jvp-node');
    if (!query) {
      allNodes.forEach((n) => n.classList.remove('jvp-hidden', 'jvp-match'));
      return;
    }
    allNodes.forEach((n) => n.classList.add('jvp-hidden'));
    allNodes.forEach((n) => {
      const keyMatch = n.dataset.key.includes(query);
      const valueMatch = n.dataset.value !== undefined && n.dataset.value.includes(query);
      if (keyMatch || valueMatch) {
        n.classList.remove('jvp-hidden');
        n.classList.add('jvp-match');
        let parent = n.parentElement;
        while (parent) {
          if (parent.classList && parent.classList.contains('jvp-node')) {
            parent.classList.remove('jvp-hidden', 'jvp-collapsed');
          }
          parent = parent.parentElement;
        }
      } else {
        n.classList.remove('jvp-match');
      }
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
