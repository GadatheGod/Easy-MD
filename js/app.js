(function () {
  'use strict';

  var editor = null;
  var isDark = false;
  var isZen = false;
  var exportOpen = false;
  var settingsOpen = false;
  var saveTimer = null;
  var STORAGE = 'easymd-content';
  var SETTINGS = 'easymd-settings';

  var preview = document.getElementById('preview');
  var saveStatus = document.getElementById('save-status');
  var exportMenu = document.getElementById('export-menu');
  var settingsMenu = document.getElementById('settings-menu');
  var dragOverlay = document.getElementById('drag-overlay');
  var fileInput = document.getElementById('file-input');

  var DEFAULT = '# Error-Free Markdown for AI Models\n\nA comprehensive guide to writing clean, reliable markdown that AI models can parse perfectly.\n\n## Why Error-Free Markdown Matters\n\nAI models process markdown as structured text. **Clean syntax** means:\n- Accurate information extraction\n- Reliable code generation\n- Consistent formatting output\n- Better document understanding\n\n## Common Errors & Fixes\n\n### Heading Levels\n\n| Error | Fix |\n|-------|-----|\n| `# H1` then `### H3` (skip level) | Use sequential: `# H1` → `## H2` → `### H3` |\n| Missing blank lines before headings | Always add empty line before heading |\n\n### Code Blocks\n\nAlways use **triple backticks** with language tag:\n\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\`\`\`\n\n### Links & Images\n\n| Type | Syntax | Example |\n|------|--------|--------|\n| Link | \`[text](url)\` | \`[Google](https://google.com)\` |\n| Image | \`![alt](url)\` | \`![Logo](logo.png)\` |\n\n### Lists\n\n- [x] Use consistent indentation (2 spaces)\n- [ ] Never mix ordered and unordered lists\n- [ ] Add blank lines between list items and paragraphs\n\n### Blockquotes\n\n> **Pro tip:** Always wrap blockquote content in proper paragraphs.\n>\n> Nested quotes use multiple \`>\` symbols.\n\n## Checklist for AI-Ready Markdown\n\n- [x] Sequential heading levels (no skips)\n- [x] Blank lines before/after all blocks\n- [x] Code blocks with language tags\n- [x] Properly escaped special characters\n- [x] Valid link and image URLs\n- [x] Consistent list indentation\n\n---\n\n*Last updated: May 2026*\n';

  // --- Settings helpers ---
  function getSetting(key, fallback) {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
      return s[key] !== undefined ? s[key] : fallback;
    } catch (e) { return fallback; }
  }

  function setSetting(key, value) {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
      s[key] = value;
      localStorage.setItem(SETTINGS, JSON.stringify(s));
    } catch (e) {}
  }

  // --- Load content ---
  function loadContent() {
    return localStorage.getItem(STORAGE) || DEFAULT;
  }

  var mdParser = typeof showdown !== 'undefined' ? new showdown.Converter({
    simpleLineBreaks: true,
    smoothLivePreview: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    underline: true,
    ghCodeBlocks: true,
    livePreview: true
  }) : null;

  // --- Update preview ---
  function updatePreview() {
    if (!editor || !mdParser) return;
    var md = editor.getValue();
    preview.innerHTML = mdParser.makeHtml(md);
  }

  // --- Auto save ---
  function scheduleSave() {
    if (!getSetting('autosave', true)) return;
    saveStatus.textContent = 'Saving...';
    saveStatus.className = '';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (!editor) return;
      localStorage.setItem(STORAGE, editor.getValue());
      saveStatus.textContent = 'Saved';
      saveStatus.className = 'saved';
      setTimeout(function () { saveStatus.textContent = ''; saveStatus.className = ''; }, 3000);
    }, 500);
  }

  // --- Scroll sync ---
  var syncing = false;
  function syncScroll(from) {
    if (syncing || !editor) return;
    syncing = true;
    if (from === 'editor') {
      var cursor = editor.getCursorPosition();
      var top = editor.getTopForLineNumber(cursor.lineNumber - 5);
      var height = editor.getLayoutInfo().height;
      var model = editor.getModel();
      var total = model.getLineCount() * editor.getOption(monaco.editor.EditorOption.lineHeight);
      var ratio = top / (total - height || 1);
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    } else {
      var pTop = preview.scrollTop;
      var pTotal = preview.scrollHeight - preview.clientHeight;
      var ratio = pTop / (pTotal || 1);
      var model = editor.getModel();
      var line = Math.max(1, Math.floor(ratio * model.getLineCount()) + 5);
      editor.revealLineInCenter(line);
    }
    requestAnimationFrame(function () { syncing = false; });
  }

  // --- Insert text helpers ---
  function insertText(before, after, placeholder) {
    if (!editor) return;
    var sel = editor.getSelection();
    var selected = editor.getModel().getValueInRange(sel);
    var inner = selected || placeholder || '';
    editor.executeEdits('toolbar', [{
      range: sel,
      text: before + inner + after,
      forceMoveMarkers: true
    }]);
    editor.focus();
  }

  // --- Toolbar actions ---
  var actions = {
    bold: function () { insertText('**', '**', 'bold text'); },
    italic: function () { insertText('*', '*', 'italic text'); },
    strike: function () { insertText('~~', '~~', 'strikethrough'); },
    heading: function () {
      if (!editor) return;
      var line = editor.getSelection().startLineNumber;
      var content = editor.getModel().getLineContent(line);
      var prefix = content.startsWith('#') ? '' : '### ';
      editor.executeEdits('toolbar', [{
        range: new monaco.Range(line, 1, line, content.length + 1),
        text: prefix
      }]);
      editor.focus();
    },
    quote: function () { insertText('', '', '> '); },
    code: function () { insertText('`', '`', 'code'); },
    ul: function () { insertText('', '', '- item'); },
    ol: function () { insertText('', '', '1. item'); },
    link: function () { insertText('[', '](https://)', 'link text'); },
    image: function () { insertText('![', '](https://)', 'alt text'); },
    hr: function () { insertText('\n---\n', '', ''); },
    table: function () {
      insertText('\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| Cell 1 | Cell 2 | Cell 3 |\n', '', '');
    }
  };

  // --- Export ---
  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportMD() {
    if (!editor) return;
    downloadFile(editor.getValue(), 'document.md', 'text/markdown');
    closeMenus();
  }

  function exportHTML() {
    var content = preview.innerHTML;
    var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Easy-MD Export</title>\n<style>\nbody{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;color:#24292e}pre{background:#f6f8fa;padding:16px;border-radius:6px;overflow:auto}code{background:#f6f8fa;padding:.2em .4em;border-radius:4px}pre code{background:none;padding:0}blockquote{border-left:3px solid #dfe2e5;padding-left:1em;color:#6a737d}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dfe2e5;padding:6px 13px}tr:nth-child(2n){background:#f6f8fa}img{max-width:100%}hr{border:none;border-top:1px solid #eaecef;margin:24px 0}\n</style>\n</head>\n<body>\n' + content + '\n</body>\n</html>';
    downloadFile(html, 'document.html', 'text/html');
    closeMenus();
  }

  function exportPDF() {
    if (!preview || typeof html2pdf === 'undefined') return;
    saveStatus.textContent = 'Generating PDF...';
    try {
    html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(preview).save().then(function () {
        saveStatus.textContent = 'Saved';
        setTimeout(function () { saveStatus.textContent = ''; }, 2000);
      }).catch(function (err) {
        console.error('PDF export failed:', err);
        saveStatus.textContent = 'PDF Error';
        setTimeout(function () { saveStatus.textContent = ''; }, 3000);
      });
    } catch (err) {
      console.error('PDF export error:', err);
      saveStatus.textContent = 'PDF Error';
      setTimeout(function () { saveStatus.textContent = ''; }, 3000);
    }
    closeMenus();
  }

  // --- Menus ---
  function closeMenus() {
    exportMenu.classList.add('hidden');
    settingsMenu.classList.add('hidden');
    exportOpen = false;
    settingsOpen = false;
  }

  // --- Dark mode ---
  function toggleDark() {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    if (editor) monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
  }

  // --- Zen mode ---
  function toggleZen() {
    isZen = !isZen;
    document.body.classList.toggle('zen', isZen);
    if (isZen && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    else if (!isZen && document.exitFullscreen) document.exitFullscreen();
  }

  // --- File reader ---
  function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      if (editor) {
        editor.setValue(e.target.result);
        updatePreview();
        scheduleSave();
      }
    };
    reader.readAsText(file);
  }

  // --- Init Monaco ---
  function initEditor() {
    // Show loading state
    document.getElementById('editor').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:14px;">Loading editor...</div>';

    try {
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

      require(['vs/editor/editor.main'], function () {
        try {
          document.getElementById('editor').innerHTML = '';
          editor = monaco.editor.create(document.getElementById('editor'), {
            value: loadContent(),
            language: 'markdown',
            theme: isDark ? 'vs-dark' : 'vs',
            minimap: { enabled: false },
            wordWrap: getSetting('wordwrap', true) ? 'on' : 'off',
            lineNumbers: getSetting('linenumbers', true) ? 'on' : 'off',
            fontSize: 14,
            fontFamily: "'Segoe UI', sans-serif",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 24, bottom: 24 }
          });

          window.editor = editor; // Expose for testing

          editor.onDidChangeModelContent(function () {
            updatePreview();
            scheduleSave();
          });

          editor.onDidScrollChange(function (e) {
            if (e.verticalChanged) syncScroll('editor');
          });

          updatePreview();
          preview.addEventListener('scroll', function () { syncScroll('preview'); });
          setTimeout(function () { editor.focus(); }, 300);
          saveStatus.textContent = 'Ready';
          setTimeout(function () { saveStatus.textContent = ''; }, 2000);
        } catch (err) {
          console.error('Monaco create error:', err);
          document.getElementById('editor').innerHTML = '<div style="padding:20px;color:red;">Error creating editor: ' + err.message + '</div>';
        }
      });

      // Timeout handler
      setTimeout(function () {
        if (!editor) {
          console.error('Monaco timed out loading');
          document.getElementById('editor').innerHTML = '<div style="padding:20px;color:red;"><h3>Editor failed to load</h3><p>Monaco Editor CDN timed out.</p><p>Make sure you are NOT opening this file directly (file:// protocol).</p><p>Run a local server: <code>python -m http.server 8000</code></p><p>Then open: <code>http://localhost:8000</code></p></div>';
        }
      }, 10000);
    } catch (err) {
      console.error('Monaco init error:', err);
      document.getElementById('editor').innerHTML = '<div style="padding:20px;color:red;">Error: ' + err.message + '</div>';
    }
  }

  // --- Init everything ---
  function initApp() {
    console.log('Easy-MD: Initializing...');

    // Toolbar action buttons
    document.querySelectorAll('.tb[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        if (actions[action]) actions[action]();
      });
    });

    // Export menu
    document.getElementById('btn-export').addEventListener('click', function (e) {
      e.stopPropagation();
      exportOpen = !exportOpen;
      exportMenu.classList.toggle('hidden', !exportOpen);
      if (exportOpen) { settingsMenu.classList.add('hidden'); settingsOpen = false; }
    });

    document.querySelectorAll('[data-export]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = this.getAttribute('data-export');
        if (type === 'md') exportMD();
        else if (type === 'html') exportHTML();
        else if (type === 'pdf') exportPDF();
      });
    });

    // Settings menu
    document.getElementById('btn-settings').addEventListener('click', function (e) {
      e.stopPropagation();
      settingsOpen = !settingsOpen;
      settingsMenu.classList.toggle('hidden', !settingsOpen);
      if (settingsOpen) { exportMenu.classList.add('hidden'); exportOpen = false; }
    });

    // Settings checkboxes
    document.getElementById('set-wrap').addEventListener('change', function (e) {
      setSetting('wordwrap', e.target.checked);
      if (editor) editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
    });

    document.getElementById('set-lines').addEventListener('change', function (e) {
      setSetting('linenumbers', e.target.checked);
      if (editor) editor.updateOptions({ lineNumbers: e.target.checked ? 'on' : 'off' });
    });

    document.getElementById('set-autosave').addEventListener('change', function (e) {
      setSetting('autosave', e.target.checked);
    });

    // Keybinding radios
    document.querySelectorAll('input[name="kb"]').forEach(function (radio) {
      radio.addEventListener('change', function (e) {
        setSetting('keybindings', e.target.value);
      });
    });

    // Clear data
    document.getElementById('clear-data').addEventListener('click', function () {
      localStorage.removeItem(STORAGE);
      if (editor) { editor.setValue(DEFAULT); updatePreview(); }
      saveStatus.textContent = 'Cleared';
      setTimeout(function () { saveStatus.textContent = ''; }, 2000);
      closeMenus();
    });

    // Dark mode
    document.getElementById('btn-dark').addEventListener('click', toggleDark);

    // Zen mode
    document.getElementById('btn-zen').addEventListener('click', toggleZen);
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && isZen) { isZen = false; document.body.classList.remove('zen'); }
    });

    // Open file
    document.getElementById('btn-open').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) {
      if (e.target.files[0]) readFile(e.target.files[0]);
      fileInput.value = '';
    });

    // Drag and drop
    var dragCount = 0;
    document.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragCount++;
      dragOverlay.classList.remove('hidden');
    });
    document.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragCount--;
      if (dragCount === 0) dragOverlay.classList.add('hidden');
    });
    document.addEventListener('dragover', function (e) { e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      e.preventDefault();
      dragCount = 0;
      dragOverlay.classList.add('hidden');
      if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
    });

    // Close menus on outside click
    document.addEventListener('click', function (e) {
      if (!exportMenu.contains(e.target) && e.target.id !== 'btn-export') { exportMenu.classList.add('hidden'); exportOpen = false; }
      if (!settingsMenu.contains(e.target) && e.target.id !== 'btn-settings') { settingsMenu.classList.add('hidden'); settingsOpen = false; }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); toggleZen(); }
      if (e.key === 'Escape' && isZen) toggleZen();
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (editor) { localStorage.setItem(STORAGE, editor.getValue()); saveStatus.textContent = 'Saved'; saveStatus.className = 'saved'; setTimeout(function () { saveStatus.textContent = ''; saveStatus.className = ''; }, 2000); }
      }
    });

    // Load saved settings
    document.getElementById('set-wrap').checked = getSetting('wordwrap', true);
    document.getElementById('set-lines').checked = getSetting('linenumbers', true);
    document.getElementById('set-autosave').checked = getSetting('autosave', true);
    var kb = getSetting('keybindings', 'default');
    var radio = document.querySelector('input[name="kb"][value="' + kb + '"]');
    if (radio) radio.checked = true;

    console.log('Easy-MD: Event listeners bound.');
    initEditor();
  }

  // Script is at bottom of body - DOM is ready
  if (document.readyState !== 'loading') {
    initApp();
  } else {
    document.addEventListener('DOMContentLoaded', initApp);
  }
})();
