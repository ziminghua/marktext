// diagram-zoom.js - High-performance SVG Diagram Lightbox (Passive & Non-Intrusive)
(function () {
  console.log('[DiagramZoom] Initializing...');

  // Inject CSS styles - strictly isolated to the zoom button and modal dialog only!
  const style = document.createElement('style');
  style.id = 'diagram-zoom-styles';
  style.textContent = `
    .ag-container-preview {
      position: relative !important;
    }
    
    .ag-diagram-zoom-btn {
      position: absolute;
      bottom: 8px;
      right: 10px;
      z-index: 50;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #93c5fd;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      user-select: none;
    }

    .ag-container-preview:hover .ag-diagram-zoom-btn,
    .ag-container-block:hover .ag-diagram-zoom-btn,
    .ag-diagram-zoom-btn:hover {
      opacity: 0.85;
      pointer-events: auto;
    }

    .ag-diagram-zoom-btn:hover {
      opacity: 1;
      background: #2563eb;
      color: #ffffff;
      border-color: #3b82f6;
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }

    /* Modal Backdrop - 90% centered dialog layout */
    .ag-zoom-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .ag-zoom-dialog {
      display: flex;
      flex-direction: column;
      width: 90vw;
      height: 90vh;
      border-radius: 12px;
      box-shadow: 0 25px 65px rgba(0, 0, 0, 0.55);
      overflow: hidden;
      position: relative;
    }

    .ag-zoom-floating-toolbar {
      position: absolute;
      top: 14px;
      right: 18px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .ag-zoom-dialog-btn {
      padding: 4px 8px;
      font-size: 13px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: background-color 0.15s ease, transform 0.1s ease;
    }

    .ag-zoom-dialog-btn:hover {
      transform: scale(1.05);
    }

    .ag-zoom-dialog-btn.close {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.35);
      color: #ef4444;
      font-weight: 700;
      margin-left: 4px;
    }

    .ag-zoom-dialog-btn.close:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .ag-zoom-scale-badge {
      font-size: 12px;
      font-weight: 600;
      min-width: 44px;
      text-align: center;
      font-family: monospace;
      opacity: 0.85;
    }

    /* Pan & Zoom Viewport */
    .ag-zoom-viewport {
      flex: 1;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }

    .ag-zoom-viewport:active {
      cursor: grabbing;
    }

    .ag-zoom-canvas {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
      will-change: transform;
      user-select: none;
    }

    .ag-zoom-canvas svg,
    .ag-zoom-canvas img {
      display: block;
      pointer-events: none;
    }

    /* Antigravity Modern Slate Dark Theme for Mermaid Diagrams */
    html.ag-dark-mode .ag-container-preview svg .messageLine0,
    html.ag-dark-mode .ag-container-preview svg .messageLine1,
    html.ag-dark-mode .ag-container-preview svg path.flowchart-link,
    html.ag-dark-mode .ag-container-preview svg .edgePath path,
    html.ag-dark-mode .ag-container-preview svg .edgePath .path,
    html.ag-dark-mode .ag-container-preview svg .edge-thickness-normal,
    html.ag-dark-mode .ag-container-preview svg g.edgePaths path,
    html.ag-dark-mode .ag-container-preview svg .transition,
    html.ag-dark-mode .ag-container-preview svg .relation,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .messageLine0,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .messageLine1,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg path.flowchart-link,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgePath path,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgePath .path,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edge-thickness-normal,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg g.edgePaths path,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .transition,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .relation {
      stroke: #cbd5e1 !important;
    }

    html.ag-dark-mode .ag-container-preview svg .actor-line,
    html.ag-dark-mode .ag-container-preview svg .loopLine,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .actor-line,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .loopLine {
      stroke: #64748b !important;
    }

    html.ag-dark-mode .ag-container-preview svg marker path,
    html.ag-dark-mode .ag-container-preview svg marker polygon,
    html.ag-dark-mode .ag-container-preview svg .marker,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg marker path,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg marker polygon,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .marker {
      fill: #cbd5e1 !important;
      stroke: #cbd5e1 !important;
    }

    html.ag-dark-mode .ag-container-preview svg text.messageText,
    html.ag-dark-mode .ag-container-preview svg .messageText,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel text,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel span,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.messageText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .messageText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel span {
      fill: #f1f5f9 !important;
      color: #f1f5f9 !important;
    }

    html.ag-dark-mode .ag-container-preview svg rect.actor,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg rect.actor {
      fill: #262936 !important;
      stroke: #64748b !important;
    }
    html.ag-dark-mode .ag-container-preview svg text.actor,
    html.ag-dark-mode .ag-container-preview svg text.actor > tspan,
    html.ag-dark-mode .ag-container-preview svg .actor text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.actor,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.actor > tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .actor text {
      fill: #f1f5f9 !important;
      color: #f1f5f9 !important;
    }

    html.ag-dark-mode .ag-container-preview svg rect.note,
    html.ag-dark-mode .ag-container-preview svg .note rect,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg rect.note,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .note rect {
      fill: #2e2619 !important;
      stroke: #856404 !important;
    }
    html.ag-dark-mode .ag-container-preview svg text.noteText,
    html.ag-dark-mode .ag-container-preview svg .note text,
    html.ag-dark-mode .ag-container-preview svg .noteText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.noteText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .note text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .noteText {
      fill: #fef08a !important;
      color: #fef08a !important;
    }

    /* Sequence Diagram Alt / Loop / Par / Critical Condition Boxes */
    html.ag-dark-mode .ag-container-preview svg .labelBox,
    html.ag-dark-mode .ag-container-preview svg polygon.labelBox,
    html.ag-dark-mode .ag-container-preview svg rect.labelBox,
    html.ag-dark-mode .ag-container-preview svg .loopBox,
    html.ag-dark-mode .ag-container-preview svg rect.loopBox,
    html.ag-dark-mode .ag-container-preview svg polygon.loopBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .labelBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg polygon.labelBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg rect.labelBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .loopBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg rect.loopBox,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg polygon.loopBox {
      fill: #262936 !important;
      stroke: #64748b !important;
    }
    html.ag-dark-mode .ag-container-preview svg text.labelText,
    html.ag-dark-mode .ag-container-preview svg text.labelText tspan,
    html.ag-dark-mode .ag-container-preview svg .labelText,
    html.ag-dark-mode .ag-container-preview svg text.loopText,
    html.ag-dark-mode .ag-container-preview svg text.loopText tspan,
    html.ag-dark-mode .ag-container-preview svg .loopText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.labelText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.labelText tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .labelText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.loopText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.loopText tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .loopText {
      fill: #f1f5f9 !important;
      color: #f1f5f9 !important;
    }

    /* Flowchart Nodes & Clusters in Dark Mode */
    html.ag-dark-mode .ag-container-preview svg .node rect,
    html.ag-dark-mode .ag-container-preview svg .node circle,
    html.ag-dark-mode .ag-container-preview svg .node ellipse,
    html.ag-dark-mode .ag-container-preview svg .node polygon,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node rect,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node circle,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node ellipse,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node polygon {
      fill: #262936 !important;
      stroke: #64748b !important;
    }

    html.ag-dark-mode .ag-container-preview svg .node .label,
    html.ag-dark-mode .ag-container-preview svg .node .label text,
    html.ag-dark-mode .ag-container-preview svg .node text,
    html.ag-dark-mode .ag-container-preview svg .nodeLabel,
    html.ag-dark-mode .ag-container-preview svg span.nodeLabel,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node .label,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node .label text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .node text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .nodeLabel,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg span.nodeLabel {
      fill: #f1f5f9 !important;
      color: #f1f5f9 !important;
    }

    html.ag-dark-mode .ag-container-preview svg .cluster rect,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .cluster rect {
      fill: rgba(255, 255, 255, 0.04) !important;
      stroke: #475569 !important;
    }

    html.ag-dark-mode .ag-container-preview svg .cluster text,
    html.ag-dark-mode .ag-container-preview svg .cluster .nodeLabel,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .cluster text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .cluster .nodeLabel {
      fill: #cbd5e1 !important;
      color: #cbd5e1 !important;
    }

    /* Global SVG Text Brightness in Dark Mode */
    html.ag-dark-mode .ag-container-preview svg text,
    html.ag-dark-mode .ag-container-preview svg tspan,
    html.ag-dark-mode .ag-container-preview svg span,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg span {
      fill: #f1f5f9 !important;
      color: #f1f5f9 !important;
    }

    /* Note Box Text - Warm Amber (Never Black!) */
    html.ag-dark-mode .ag-container-preview svg .note text,
    html.ag-dark-mode .ag-container-preview svg .note tspan,
    html.ag-dark-mode .ag-container-preview svg text.noteText,
    html.ag-dark-mode .ag-container-preview svg .noteText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .note text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .note tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg text.noteText,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .noteText {
      fill: #fef08a !important;
      color: #fef08a !important;
    }

    /* Edge Labels on Lines - Clean Dark Rounded Badge with White Text */
    html.ag-dark-mode .ag-container-preview svg .edgeLabel,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel {
      background: transparent !important;
      background-color: transparent !important;
    }

    html.ag-dark-mode .ag-container-preview svg .edgeLabel rect,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel rect {
      fill: #262936 !important;
      stroke: #64748b !important;
      stroke-width: 1px !important;
      rx: 4px !important;
      ry: 4px !important;
      opacity: 0.95 !important;
      display: inline !important;
    }

    html.ag-dark-mode .ag-container-preview svg .edgeLabel text,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel tspan,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel span,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel p,
    html.ag-dark-mode .ag-container-preview svg .edgeLabel div,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel text,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel tspan,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel span,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel p,
    .ag-zoom-modal-backdrop.is-dark-theme .ag-zoom-canvas svg .edgeLabel div {
      fill: #ffffff !important;
      color: #ffffff !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      background: transparent !important;
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);

  const ZOOM_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;

  function isDarkLuminance(colorStr) {
    if (!colorStr) return false;
    colorStr = colorStr.trim();
    if (colorStr.startsWith('#')) {
      let hex = colorStr.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    }
    const match = colorStr.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = Number(match[0]);
      const g = Number(match[1]);
      const b = Number(match[2]);
      return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    }
    return false;
  }

  function getThemeInfo() {
    const rootStyle = window.getComputedStyle(document.documentElement);
    let bg = rootStyle.getPropertyValue('--editorBgColor').trim()
          || rootStyle.getPropertyValue('--editor-bg-color').trim();

    if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)')) {
      const appEl = document.querySelector('#app') || document.body;
      const appStyle = window.getComputedStyle(appEl);
      bg = appStyle.backgroundColor;
    }

    if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)')) {
      const editorEl = document.querySelector('.editor-component') || document.querySelector('.ag-editor-id');
      if (editorEl) {
        bg = window.getComputedStyle(editorEl).backgroundColor;
      }
    }

    const isDark = isDarkLuminance(bg) || document.body.classList.contains('dark') || /dark|dracula|night|black|mocha/i.test(document.body.className);
    if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)')) {
      bg = isDark ? '#282a36' : '#ffffff';
    }

    const text = isDark ? '#f8f8f2' : '#334155';
    const border = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)';
    const toolbarBg = isDark ? 'rgba(40, 42, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    const btnBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    return { bg, text, border, toolbarBg, btnBg, isDark };
  }

  function adaptSvgTheme(svg, isDark) {
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return;
    if (isDark) {
      svg.querySelectorAll('.messageLine0, .messageLine1, path.flowchart-link, .edgePath path, .edgePath .path, .edge-thickness-normal, g.edgePaths path, .transition, .relation').forEach(p => {
        p.style.stroke = '#cbd5e1';
      });
      svg.querySelectorAll('.actor-line, .loopLine').forEach(p => {
        p.style.stroke = '#64748b';
      });
      svg.querySelectorAll('marker path, marker polygon, .marker').forEach(m => {
        m.style.fill = '#cbd5e1';
        m.style.stroke = '#cbd5e1';
      });
      svg.querySelectorAll('text.messageText, .messageText, .edgeLabel text, .edgeLabel span').forEach(t => {
        t.style.fill = '#f1f5f9';
        t.style.color = '#f1f5f9';
      });
      // 1. All text and tspan: default to crisp white (never black!)
      svg.querySelectorAll('text, tspan, span').forEach(t => {
        t.style.fill = '#f1f5f9';
        t.style.color = '#f1f5f9';
        t.setAttribute('fill', '#f1f5f9');
      });

      // 2. Note text: warm amber (never black!)
      svg.querySelectorAll('.note text, .note tspan, text.noteText, .noteText').forEach(t => {
        t.style.fill = '#fef08a';
        t.style.color = '#fef08a';
        t.setAttribute('fill', '#fef08a');
      });

      // 3. Boxes: Actor, Note, Loop, Flowchart Nodes & Clusters
      svg.querySelectorAll('rect.actor').forEach(r => {
        r.style.fill = '#262936';
        r.style.stroke = '#64748b';
        r.setAttribute('fill', '#262936');
        r.setAttribute('stroke', '#64748b');
      });
      svg.querySelectorAll('rect.note, .note rect').forEach(r => {
        r.style.fill = '#2e2619';
        r.style.stroke = '#856404';
        r.setAttribute('fill', '#2e2619');
        r.setAttribute('stroke', '#856404');
      });
      svg.querySelectorAll('.labelBox, polygon.labelBox, rect.labelBox, .loopBox, rect.loopBox, polygon.loopBox').forEach(r => {
        r.style.fill = '#262936';
        r.style.stroke = '#64748b';
        r.setAttribute('fill', '#262936');
        r.setAttribute('stroke', '#64748b');
      });
      svg.querySelectorAll('text.labelText, text.labelText tspan, .labelText, text.loopText, text.loopText tspan, .loopText').forEach(t => {
        t.style.fill = '#f1f5f9';
        t.style.color = '#f1f5f9';
        t.setAttribute('fill', '#f1f5f9');
      });
      svg.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon, .node path').forEach(n => {
        n.style.fill = '#262936';
        n.style.stroke = '#64748b';
        n.setAttribute('fill', '#262936');
        n.setAttribute('stroke', '#64748b');
      });
      svg.querySelectorAll('.cluster rect, g.cluster rect').forEach(c => {
        c.style.fill = 'rgba(255, 255, 255, 0.04)';
        c.style.stroke = '#475569';
        c.setAttribute('fill', 'rgba(255, 255, 255, 0.04)');
        c.setAttribute('stroke', '#475569');
      });

      // 4. Edge labels: neat rounded dark badge with white text
      svg.querySelectorAll('.edgeLabel, .edgeLabel span, .edgeLabel p, .edgeLabel div').forEach(el => {
        el.style.backgroundColor = 'transparent';
        el.style.background = 'transparent';
      });
      svg.querySelectorAll('.edgeLabel rect').forEach(r => {
        r.style.display = 'inline';
        r.style.fill = '#262936';
        r.style.stroke = '#64748b';
        r.style.strokeWidth = '1px';
        r.setAttribute('fill', '#262936');
        r.setAttribute('stroke', '#64748b');
        r.setAttribute('rx', '4');
        r.setAttribute('ry', '4');
      });
      svg.querySelectorAll('.edgeLabel text, .edgeLabel tspan, .edgeLabel span, .edgeLabel p, .edgeLabel div').forEach(t => {
        t.style.fill = '#ffffff';
        t.style.color = '#ffffff';
        t.setAttribute('fill', '#ffffff');
      });
    } else {
      svg.querySelectorAll('.messageLine0, .messageLine1, path.flowchart-link, .edgePath path, .edgePath .path, .edge-thickness-normal, g.edgePaths path, .transition, .relation, .actor-line, .loopLine').forEach(p => {
        p.style.stroke = '';
      });
      svg.querySelectorAll('marker path, marker polygon, .marker').forEach(m => {
        m.style.fill = '';
        m.style.stroke = '';
      });
      svg.querySelectorAll('.edgeLabel, .edgeLabel span, .edgeLabel p, .edgeLabel div').forEach(el => {
        el.style.backgroundColor = '';
        el.style.background = '';
        el.style.border = '';
        el.style.borderRadius = '';
        el.style.padding = '';
      });
      svg.querySelectorAll('text.messageText, .messageText, .edgeLabel text, .edgeLabel tspan, .edgeLabel span, rect.actor, text.actor, text.actor > tspan, .actor text, rect.note, .note rect, text.noteText, .note text, .noteText, .labelBox, polygon.labelBox, rect.labelBox, rect.loopBox, polygon.loopBox, text.labelText, text.loopText, .labelText, .loopText, .node rect, .node circle, .node ellipse, .node polygon, .node path, .node .label, .node .label text, .node text, .nodeLabel, span.nodeLabel, .cluster rect, .cluster text, .cluster .nodeLabel, .edgeLabel rect').forEach(el => {
        el.style.fill = '';
        el.style.stroke = '';
        el.style.color = '';
        el.style.display = '';
      });
    }
  }

  function openZoomModal(sourceSvgOrImg) {
    if (document.querySelector('.ag-zoom-modal-backdrop')) return;

    const isImg = sourceSvgOrImg.tagName.toLowerCase() === 'img';
    const cloned = sourceSvgOrImg.cloneNode(true);

    let naturalW = 800;
    let naturalH = 600;

    if (!isImg) {
      const viewBox = cloned.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          naturalW = Math.round(parts[2]);
          naturalH = Math.round(parts[3]);
        }
      } else {
        const w = parseFloat(cloned.getAttribute('width'));
        const h = parseFloat(cloned.getAttribute('height'));
        if (w && h) {
          naturalW = Math.round(w);
          naturalH = Math.round(h);
          cloned.setAttribute('viewBox', `0 0 ${naturalW} ${naturalH}`);
        }
      }

      cloned.removeAttribute('style');
      cloned.style.width = naturalW + 'px';
      cloned.style.height = naturalH + 'px';
    } else {
      naturalW = sourceSvgOrImg.naturalWidth || 800;
      naturalH = sourceSvgOrImg.naturalHeight || 600;
      cloned.style.width = naturalW + 'px';
      cloned.style.height = naturalH + 'px';
    }

    const theme = getThemeInfo();

    // Modal structure: 90% card on dimmed frosted backdrop
    const backdrop = document.createElement('div');
    backdrop.className = `ag-zoom-modal-backdrop ${theme.isDark ? 'is-dark-theme' : 'is-light-theme'}`;

    const dialog = document.createElement('div');
    dialog.className = 'ag-zoom-dialog';
    dialog.style.backgroundColor = theme.bg;
    dialog.style.color = theme.text;
    dialog.style.border = `1px solid ${theme.border}`;

    // Adapt SVG theme inside the cloned modal
    if (!isImg) {
      adaptSvgTheme(cloned, theme.isDark);
    }

    // Floating toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ag-zoom-floating-toolbar';
    toolbar.style.backgroundColor = theme.toolbarBg;
    toolbar.style.border = `1px solid ${theme.border}`;
    toolbar.style.color = theme.text;

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'ag-zoom-dialog-btn';
    zoomOutBtn.textContent = '➖';
    zoomOutBtn.title = 'Zoom Out';
    zoomOutBtn.style.backgroundColor = theme.btnBg;
    zoomOutBtn.style.border = `1px solid ${theme.border}`;
    zoomOutBtn.style.color = theme.text;

    const scaleBadge = document.createElement('span');
    scaleBadge.className = 'ag-zoom-scale-badge';
    scaleBadge.textContent = '100%';
    scaleBadge.style.color = theme.text;

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'ag-zoom-dialog-btn';
    zoomInBtn.textContent = '➕';
    zoomInBtn.title = 'Zoom In';
    zoomInBtn.style.backgroundColor = theme.btnBg;
    zoomInBtn.style.border = `1px solid ${theme.border}`;
    zoomInBtn.style.color = theme.text;

    const fitBtn = document.createElement('button');
    fitBtn.className = 'ag-zoom-dialog-btn';
    fitBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
    fitBtn.title = 'Fit to Window';
    fitBtn.style.backgroundColor = theme.btnBg;
    fitBtn.style.border = `1px solid ${theme.border}`;
    fitBtn.style.color = theme.text;

    const reset11Btn = document.createElement('button');
    reset11Btn.className = 'ag-zoom-dialog-btn';
    reset11Btn.textContent = '1:1';
    reset11Btn.title = '100%';
    reset11Btn.style.backgroundColor = theme.btnBg;
    reset11Btn.style.border = `1px solid ${theme.border}`;
    reset11Btn.style.color = theme.text;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ag-zoom-dialog-btn close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close (ESC)';

    toolbar.append(zoomOutBtn, scaleBadge, zoomInBtn, fitBtn, reset11Btn, closeBtn);

    const viewport = document.createElement('div');
    viewport.className = 'ag-zoom-viewport';
    viewport.style.backgroundColor = theme.bg;

    const canvas = document.createElement('div');
    canvas.className = 'ag-zoom-canvas';
    canvas.appendChild(cloned);

    viewport.append(canvas);
    dialog.append(toolbar, viewport);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Initial scale calculation to fit the 90% card nicely
    const dialogW = window.innerWidth * 0.90;
    const dialogH = window.innerHeight * 0.90;
    const fitScale = Math.min((dialogW - 60) / naturalW, (dialogH - 60) / naturalH, 2.5);
    
    let scale = Math.max(fitScale, 0.15);
    let translateX = 0;
    let translateY = 0;

    function applyTransform() {
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      scaleBadge.textContent = `${Math.round(scale * 100)}%`;
    }

    applyTransform();

    // Wheel zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const oldScale = scale;
      scale = Math.min(Math.max(scale * zoomFactor, 0.05), 15.0);

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      translateX -= (mouseX - translateX) * (scale / oldScale - 1);
      translateY -= (mouseY - translateY) * (scale / oldScale - 1);

      applyTransform();
    }, { passive: false });

    // Drag to pan
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startTx = 0;
    let startTy = 0;

    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startTx = translateX;
      startTy = translateY;
    });

    const onMouseMove = (e) => {
      if (!isDragging) return;
      translateX = startTx + (e.clientX - startX);
      translateY = startTy + (e.clientY - startY);
      applyTransform();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Buttons
    zoomInBtn.onclick = (e) => {
      e.stopPropagation();
      scale = Math.min(scale * 1.25, 15.0);
      applyTransform();
    };

    zoomOutBtn.onclick = (e) => {
      e.stopPropagation();
      scale = Math.max(scale / 1.25, 0.05);
      applyTransform();
    };

    fitBtn.onclick = (e) => {
      e.stopPropagation();
      scale = Math.max(fitScale, 0.15);
      translateX = 0;
      translateY = 0;
      applyTransform();
    };

    reset11Btn.onclick = (e) => {
      e.stopPropagation();
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      applyTransform();
    };

    // Double click viewport toggles fit / 1:1
    viewport.addEventListener('dblclick', (e) => {
      if (Math.abs(scale - 1.0) < 0.05) {
        scale = Math.max(fitScale, 0.15);
      } else {
        scale = 1.0;
      }
      translateX = 0;
      translateY = 0;
      applyTransform();
    });

    function closeModal() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    }

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeModal();
    };

    window.addEventListener('keydown', onKeyDown);

    // Click on dimmed backdrop (outside the 90% card) to close!
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });
  }

  // Scan and attach zoom button and adapt SVG theme for active theme
  function scanAndAttach() {
    const theme = getThemeInfo();
    if (theme.isDark) {
      document.documentElement.classList.add('ag-dark-mode');
      document.documentElement.classList.remove('ag-light-mode');
    } else {
      document.documentElement.classList.add('ag-light-mode');
      document.documentElement.classList.remove('ag-dark-mode');
    }

    const editor = document.querySelector('.ag-editor-id, #ag-editor-id, #app');
    if (!editor) return;

    const previews = editor.querySelectorAll('.ag-container-preview');
    previews.forEach((container) => {
      if (container.closest('.ag-zoom-modal-backdrop')) return;
      if (container.querySelector('.katex') || container.classList.contains('ag-math-error') || container.classList.contains('ag-math')) return;

      const svg = container.querySelector('svg');
      const img = container.querySelector('img');
      const target = svg || img;
      if (!target) return;

      if (svg) {
        adaptSvgTheme(svg, theme.isDark);
      }

      if (container.querySelector('.ag-diagram-zoom-btn')) return;

      const btn = document.createElement('div');
      btn.className = 'ag-diagram-zoom-btn';
      btn.innerHTML = ZOOM_ICON;
      btn.title = 'Zoom';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openZoomModal(target);
      });

      container.appendChild(btn);
    });
  }

  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      scanAndAttach();
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  scanAndAttach();
  console.log('[DiagramZoom] Initialized passively.');
})();
