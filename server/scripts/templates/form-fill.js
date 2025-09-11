export const template = {
  meta: { name: "Form Fill with Select & Scroll", version: "1.0" },
  nodes: [
    {
      id: "goto1",
      type: "GoTo",
      position: { x: 80, y: 80 },
      data: { label: "Go To Form", kind: "GoTo", config: { url: "https://example.com/form" } },
    },
    {
      id: "type1",
      type: "Type",
      position: { x: 280, y: 80 },
      data: { label: "Enter Name", kind: "Type", config: { xpath: "//input[@name='fullname']", text: "John Doe" } },
    },
    {
      id: "select1",
      type: "Select",
      position: { x: 480, y: 80 },
      data: { label: "Select Country", kind: "Select", config: { xpath: "//select[@name='country']", selectBy: "text", selectValue: "United States" } },
    },
    {
      id: "scroll1",
      type: "ScrollTo",
      position: { x: 680, y: 80 },
      data: { label: "Scroll to Submit", kind: "ScrollTo", config: { scrollType: "element", xpath: "//button[@type='submit']" } },
    },
    {
      id: "click1",
      type: "Click",
      position: { x: 880, y: 80 },
      data: { label: "Submit Form", kind: "Click", config: { xpath: "//button[@type='submit']" } },
    },
  ],
  edges: [
    { id: "e1", source: "goto1", target: "type1" },
    { id: "e2", source: "type1", target: "select1" },
    { id: "e3", source: "select1", target: "scroll1" },
    { id: "e4", source: "scroll1", target: "click1" },
  ],
};