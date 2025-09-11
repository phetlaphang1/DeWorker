export const template = {
  meta: { name: "Basic: Google Search", version: "1.0" },
  nodes: [
    {
      id: "goto1",
      type: "GoTo",
      position: { x: 80, y: 80 },
      data: { label: "Go To URL", kind: "GoTo", config: { url: "https://www.google.com" } },
    },
    {
      id: "type1",
      type: "Type",
      position: { x: 360, y: 80 },
      data: { label: "Type", kind: "Type", config: { xpath: "//input[@name='q']", text: "hello world" } },
    },
    {
      id: "click1",
      type: "Click",
      position: { x: 640, y: 80 },
      data: { label: "Click", kind: "Click", config: { xpath: "//input[@name='btnK']", index: 0 } },
    },
  ],
  edges: [
    { id: "e1", source: "goto1", target: "type1", label: "then" },
    { id: "e2", source: "type1", target: "click1", label: "then" },
  ],
};