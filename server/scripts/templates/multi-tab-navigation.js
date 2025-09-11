export const template = {
  meta: { name: "Multi-Tab Navigation", version: "1.0" },
  nodes: [
    {
      id: "goto1",
      type: "GoTo",
      position: { x: 80, y: 80 },
      data: { label: "Open First Site", kind: "GoTo", config: { url: "https://example.com" } },
    },
    {
      id: "nav1",
      type: "Navigation",
      position: { x: 280, y: 80 },
      data: { label: "Open New Tab", kind: "Navigation", config: { action: "newTab" } },
    },
    {
      id: "goto2",
      type: "GoTo",
      position: { x: 480, y: 80 },
      data: { label: "Open Second Site", kind: "GoTo", config: { url: "https://another-site.com" } },
    },
    {
      id: "switch1",
      type: "SwitchTab",
      position: { x: 680, y: 80 },
      data: { label: "Switch to First Tab", kind: "SwitchTab", config: { tabIndex: 0 } },
    },
    {
      id: "extract1",
      type: "Extract",
      position: { x: 880, y: 80 },
      data: { label: "Extract from First", kind: "Extract", config: { xpath: "//title", extractType: "text" } },
    },
  ],
  edges: [
    { id: "e1", source: "goto1", target: "nav1" },
    { id: "e2", source: "nav1", target: "goto2" },
    { id: "e3", source: "goto2", target: "switch1" },
    { id: "e4", source: "switch1", target: "extract1" },
  ],
};