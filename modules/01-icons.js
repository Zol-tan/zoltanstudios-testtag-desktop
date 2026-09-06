// ======================================================================
// 01-icons.js
// Inline SVG icon components
// ======================================================================

// ---------------------------------------------------------------------------
// Minimal inline icon set (no external icon library needed for a standalone
// file). Same visual language as lucide: 24x24, stroke-based, currentColor.
// ---------------------------------------------------------------------------

function IconBase({
  children,
  size = 16,
  className = "",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    style: style
  }, children);
}
function Plus(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  }));
}
function Trash2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 11v6M14 11v6"
  }));
}
function Printer(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "14",
    width: "12",
    height: "8"
  }));
}
function ArrowLeft(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }));
}
function CheckCircle2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 12 2 2 4-4"
  }));
}
function XCircle(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  }));
}
function AlertTriangle(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  }));
}
function ClipboardList(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "2",
    width: "8",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 12h6M9 16h6M9 8h1"
  }));
}
function Save(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-8H7v8M7 3v5h8"
  }));
}
function Loader2(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  }));
}
function FileText(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6M8 13h8M8 17h8M8 9h2"
  }));
}
function CloudUpload(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("path", {
    d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 12v9M8 17l4-4 4 4"
  }));
}
function Settings(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  }));
}
function Search(props) {
  return /*#__PURE__*/React.createElement(IconBase, props, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  }));
}
