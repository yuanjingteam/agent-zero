/**
 * Lumen Edge SVG Diagram Renderer
 * Converts structured data into hand-drawn style SVG diagrams.
 */
(function () {
  "use strict";

  const COLORS = {
    bg: "#0A0A0C",
    card: "#111114",
    cardAlt: "#18181C",
    border: "rgba(255,255,255,0.10)",
    borderAccent: "rgba(184,196,208,0.25)",
    text: "#F0F0F2",
    textDim: "#A0A0A8",
    textMuted: "#6B6B74",
    accent: "#B8C4D0",
    success: "rgba(74,222,128,0.6)",
    warning: "rgba(251,191,36,0.6)",
    error: "rgba(248,113,113,0.6)",
    info: "rgba(96,165,250,0.6)",
    arrow: "rgba(255,255,255,0.15)",
    arrowAccent: "rgba(184,196,208,0.35)",
    glow: "rgba(255,255,255,0.03)",
  };

  const FONT = {
    family: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  };

  // --- Utility ---

  function svgEl(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function textEl(text, x, y, opts = {}) {
    const el = svgEl("text", {
      x, y,
      fill: opts.color || COLORS.text,
      "font-size": opts.size || "13",
      "font-family": opts.mono ? FONT.mono : FONT.family,
      "font-weight": opts.weight || "400",
      "text-anchor": opts.anchor || "middle",
      "dominant-baseline": opts.baseline || "central",
      "letter-spacing": opts.letterSpacing || "0",
    });
    el.textContent = text;
    return el;
  }

  function wrapText(text, maxWidth, fontSize) {
    return text.length;
  }

  // --- Rounded rect with optional glow ---

  function roundedRect(x, y, w, h, r, fill, stroke, glow) {
    const g = svgEl("g");
    if (glow) {
      const glowRect = svgEl("rect", {
        x: x - 1, y: y - 1, width: w + 2, height: h + 2,
        rx: r + 1, ry: r + 1,
        fill: "none",
        stroke: glow,
        "stroke-width": "1",
        opacity: "0.5",
      });
      g.appendChild(glowRect);
    }
    const rect = svgEl("rect", {
      x, y, width: w, height: h,
      rx: r, ry: r,
      fill: fill || COLORS.card,
      stroke: stroke || COLORS.border,
      "stroke-width": "1",
    });
    g.appendChild(rect);
    return g;
  }

  // --- Arrow path ---

  function arrowPath(x1, y1, x2, y2, opts = {}) {
    const color = opts.color || COLORS.arrow;
    const width = opts.width || "1.2";
    const dashed = opts.dashed;

    const midX = (x1 + x2) / 2;
    const d = `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;

    const path = svgEl("path", {
      d, fill: "none", stroke: color, "stroke-width": width,
      "stroke-linecap": "round",
    });
    if (dashed) path.setAttribute("stroke-dasharray", "5,4");

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 7;
    const ax = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const ay = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const bx = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const by = y2 - headLen * Math.sin(angle + Math.PI / 6);
    const head = svgEl("path", {
      d: `M${x2},${y2} L${ax},${ay} M${x2},${y2} L${bx},${by}`,
      fill: "none", stroke: color, "stroke-width": width,
      "stroke-linecap": "round", "stroke-linejoin": "round",
    });

    const g = svgEl("g");
    g.appendChild(path);
    g.appendChild(head);
    return g;
  }

  // --- Straight arrow ---

  function straightArrow(x1, y1, x2, y2, opts = {}) {
    const color = opts.color || COLORS.arrow;
    const width = opts.width || "1.2";

    const line = svgEl("line", {
      x1, y1, x2, y2,
      stroke: color, "stroke-width": width, "stroke-linecap": "round",
    });

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 7;
    const ax = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const ay = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const bx = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const by = y2 - headLen * Math.sin(angle + Math.PI / 6);
    const head = svgEl("path", {
      d: `M${x2},${y2} L${ax},${ay} M${x2},${y2} L${bx},${by}`,
      fill: "none", stroke: color, "stroke-width": width,
      "stroke-linecap": "round", "stroke-linejoin": "round",
    });

    const g = svgEl("g");
    g.appendChild(line);
    g.appendChild(head);
    return g;
  }

  // --- Down arrow ---

  function downArrow(cx, y1, y2, opts = {}) {
    return straightArrow(cx, y1, cx, y2, opts);
  }

  // --- Build diagram from spec ---

  /**
   * Diagram spec format:
   * {
   *   width: number,
   *   height: number,
   *   nodes: [{ id, x, y, w, h, label, sublabel, style }],
   *   arrows: [{ from, to, label, style }],
   *   labels: [{ x, y, text, style }],
   * }
   */
  let diagramCounter = 0;

  function renderDiagram(container, spec) {
    const uid = `dg-${++diagramCounter}-${Math.random().toString(36).slice(2, 6)}`;

    const svg = svgEl("svg", {
      width: spec.width || "100%",
      height: spec.height || "200",
      viewBox: `0 0 ${spec.width || 600} ${spec.height || 200}`,
      class: "diagram-svg",
      role: "img",
      "aria-label": spec.title || "Diagram",
    });

    // Background
    const bg = svgEl("rect", {
      width: "100%", height: "100%",
      fill: COLORS.bg, rx: "10", ry: "10",
    });
    svg.appendChild(bg);

    // Defs for glow filter
    const defs = svgEl("defs");
    const filter = svgEl("filter", { id: `${uid}-glow`, x: "-20%", y: "-20%", width: "140%", height: "140%" });
    const blur = svgEl("feGaussianBlur", { stdDeviation: "3", result: "blur" });
    const merge = svgEl("feMerge");
    const mn1 = svgEl("feMergeNode", { in: "blur" });
    const mn2 = svgEl("feMergeNode", { in: "SourceGraphic" });
    merge.appendChild(mn1);
    merge.appendChild(mn2);
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const nodeMap = {};

    // Render nodes
    (spec.nodes || []).forEach((n) => {
      const g = svgEl("g");
      const style = n.style || {};
      const fill = style.fill || COLORS.card;
      const stroke = style.stroke || COLORS.border;
      const r = style.radius || 8;

      // Box
      const rect = svgEl("rect", {
        x: n.x, y: n.y, width: n.w, height: n.h,
        rx: r, ry: r,
        fill, stroke, "stroke-width": style.strokeWidth || "1",
      });
      g.appendChild(rect);

      // Radial glow at bottom
      const glowGrad = svgEl("radialGradient", {
        id: `${uid}-glow-${n.id}`, cx: "50%", cy: "100%", r: "60%",
      });
      const stop1 = svgEl("stop", { offset: "0%", "stop-color": "rgba(255,255,255,0.04)" });
      const stop2 = svgEl("stop", { offset: "100%", "stop-color": "transparent" });
      glowGrad.appendChild(stop1);
      glowGrad.appendChild(stop2);
      defs.appendChild(glowGrad);

      const glowRect = svgEl("rect", {
        x: n.x, y: n.y, width: n.w, height: n.h,
        rx: r, ry: r,
        fill: `url(#${uid}-glow-${n.id})`,
        "pointer-events": "none",
      });
      g.appendChild(glowRect);

      // Label
      const lines = (n.label || "").split("\n");
      const lineHeight = 18;
      const startY = n.y + n.h / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        const t = textEl(line, n.x + n.w / 2, startY + i * lineHeight, {
          size: style.fontSize || "12",
          color: style.textColor || COLORS.text,
          weight: style.fontWeight || "500",
          mono: style.mono,
        });
        g.appendChild(t);
      });

      // Sublabel
      if (n.sublabel) {
        const t = textEl(n.sublabel, n.x + n.w / 2, n.y + n.h - 14, {
          size: "10", color: COLORS.textMuted, mono: true,
        });
        g.appendChild(t);
      }

      svg.appendChild(g);
      nodeMap[n.id] = n;
    });

    // Render arrows
    (spec.arrows || []).forEach((a) => {
      const from = nodeMap[a.from];
      const to = nodeMap[a.to];
      if (!from || !to) return;

      const style = a.style || {};
      let arrow;

      if (a.direction === "down") {
        arrow = downArrow(
          from.x + from.w / 2,
          from.y + from.h,
          to.y,
          { color: style.color, width: style.width, dashed: style.dashed }
        );
      } else if (a.direction === "right" || !a.direction) {
        arrow = straightArrow(
          from.x + from.w,
          from.y + from.h / 2,
          to.x,
          to.y + to.h / 2,
          { color: style.color, width: style.width, dashed: style.dashed }
        );
      } else if (a.direction === "left") {
        arrow = straightArrow(
          from.x,
          from.y + from.h / 2,
          to.x + to.w,
          to.y + to.h / 2,
          { color: style.color, width: style.width, dashed: style.dashed }
        );
      } else if (a.direction === "up") {
        arrow = downArrow(
          from.x + from.w / 2,
          to.y + to.h,
          from.y,
          { color: style.color, width: style.width, dashed: style.dashed }
        );
      } else if (a.direction === "down-right") {
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y + to.h / 2;
        arrow = arrowPath(x1, y1, x2, y2, { color: style.color, width: style.width, dashed: style.dashed });
      } else if (a.direction === "right-down") {
        const x1 = from.x + from.w / 2;
        const y1 = from.y + from.h;
        const x2 = to.x + to.w / 2;
        const y2 = to.y;
        arrow = arrowPath(x1, y1, x2, y2, { color: style.color, width: style.width, dashed: style.dashed });
      }

      if (arrow) svg.appendChild(arrow);

      // Arrow label
      if (a.label && from && to) {
        const lx = (from.x + from.w + to.x) / 2;
        const ly = (from.y + from.h / 2 + to.y + to.h / 2) / 2 - 8;
        const labelBg = svgEl("rect", {
          x: lx - a.label.length * 3.5 - 4, y: ly - 8,
          width: a.label.length * 7 + 8, height: 16,
          rx: 3, fill: COLORS.bg, stroke: "none",
        });
        svg.appendChild(labelBg);
        const labelText = textEl(a.label, lx, ly, {
          size: "10", color: COLORS.textMuted,
        });
        svg.appendChild(labelText);
      }
    });

    // Render standalone labels
    (spec.labels || []).forEach((l) => {
      const t = textEl(l.text, l.x, l.y, {
        size: l.size || "11",
        color: l.color || COLORS.textMuted,
        weight: l.weight || "400",
        anchor: l.anchor || "middle",
        mono: l.mono,
        letterSpacing: l.letterSpacing,
      });
      svg.appendChild(t);
    });

    container.innerHTML = "";
    container.appendChild(svg);
    container.classList.add("diagram-rendered");
  }

  // --- Auto-init: convert <div class="diagram" data-diagram="..."> ---

  function initDiagrams() {
    document.querySelectorAll(".diagram[data-diagram]").forEach((el) => {
      try {
        const spec = JSON.parse(el.getAttribute("data-diagram"));
        renderDiagram(el, spec);
      } catch (e) {
        console.error("Diagram render error:", e);
      }
    });
  }

  // Expose globally
  window.LumenDiagram = {
    render: renderDiagram,
    init: initDiagrams,
    COLORS,
    FONT,
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDiagrams);
  } else {
    initDiagrams();
  }
})();
