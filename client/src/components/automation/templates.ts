import { FlowDefinition } from "./types";

export const TEMPLATES: Record<string, FlowDefinition> = {
  "Basic: Google Search (GoTo → Type → Click)": {
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
  },
  "Form Fill with Select & Scroll": {
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
  },
  "Data Extraction with Loop": {
    meta: { name: "Data Extraction with Loop", version: "1.0" },
    nodes: [
      {
        id: "goto1",
        type: "GoTo",
        position: { x: 80, y: 80 },
        data: { label: "Go To Page", kind: "GoTo", config: { url: "https://example.com/products" } },
      },
      {
        id: "wait1",
        type: "Wait",
        position: { x: 280, y: 80 },
        data: { label: "Wait for Products", kind: "Wait", config: { waitType: "element", xpath: "//div[@class='product']", timeout: 5000 } },
      },
      {
        id: "loop1",
        type: "Loop",
        position: { x: 480, y: 80 },
        data: { label: "Loop Products", kind: "Loop", config: { items: ["product1", "product2", "product3"], iteratorName: "product" } },
      },
      {
        id: "extract1",
        type: "Extract",
        position: { x: 680, y: 80 },
        data: { label: "Extract Title", kind: "Extract", config: { xpath: "//h2[@class='title']", extractType: "text" } },
      },
      {
        id: "log1",
        type: "Log",
        position: { x: 880, y: 80 },
        data: { label: "Log Product", kind: "Log", config: { logLevel: "info", message: "Product extracted successfully" } },
      },
    ],
    edges: [
      { id: "e1", source: "goto1", target: "wait1" },
      { id: "e2", source: "wait1", target: "loop1" },
      { id: "e3", source: "loop1", target: "extract1" },
      { id: "e4", source: "extract1", target: "log1" },
    ],
  },
  "Multi-Tab Navigation": {
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
  },
  "Conditional Flow with If/Else": {
    meta: { name: "Conditional Flow with If/Else", version: "1.0" },
    nodes: [
      {
        id: "goto1",
        type: "GoTo",
        position: { x: 80, y: 80 },
        data: { label: "Go To Page", kind: "GoTo", config: { url: "https://example.com" } },
      },
      {
        id: "if1",
        type: "If",
        position: { x: 280, y: 80 },
        data: { label: "Check Login Button", kind: "If", config: { condition: "element_exists", xpath: "//button[@id='login']" } },
      },
      {
        id: "click1",
        type: "Click",
        position: { x: 480, y: 40 },
        data: { label: "Click Login", kind: "Click", config: { xpath: "//button[@id='login']" } },
      },
      {
        id: "else1",
        type: "Else",
        position: { x: 480, y: 120 },
        data: { label: "Else", kind: "Else" },
      },
      {
        id: "log1",
        type: "Log",
        position: { x: 680, y: 120 },
        data: { label: "Log No Login", kind: "Log", config: { logLevel: "warn", message: "Login button not found" } },
      },
    ],
    edges: [
      { id: "e1", source: "goto1", target: "if1" },
      { id: "e2", source: "if1", target: "click1", label: "true" },
      { id: "e3", source: "if1", target: "else1", label: "false" },
      { id: "e4", source: "else1", target: "log1" },
    ],
  },
  "Frame Handling": {
    meta: { name: "Frame Handling", version: "1.0" },
    nodes: [
      {
        id: "goto1",
        type: "GoTo",
        position: { x: 80, y: 80 },
        data: { label: "Go To Page", kind: "GoTo", config: { url: "https://example.com/iframe-page" } },
      },
      {
        id: "switch1",
        type: "SwitchFrame",
        position: { x: 280, y: 80 },
        data: { label: "Enter iFrame", kind: "SwitchFrame", config: { frameType: "enter", frameSelector: "iframe#content" } },
      },
      {
        id: "type1",
        type: "Type",
        position: { x: 480, y: 80 },
        data: { label: "Type in Frame", kind: "Type", config: { xpath: "//input[@name='search']", text: "test" } },
      },
      {
        id: "switch2",
        type: "SwitchFrame",
        position: { x: 680, y: 80 },
        data: { label: "Exit to Main", kind: "SwitchFrame", config: { frameType: "exit" } },
      },
      {
        id: "click1",
        type: "Click",
        position: { x: 880, y: 80 },
        data: { label: "Click Outside", kind: "Click", config: { xpath: "//button[@id='submit']" } },
      },
    ],
    edges: [
      { id: "e1", source: "goto1", target: "switch1" },
      { id: "e2", source: "switch1", target: "type1" },
      { id: "e3", source: "type1", target: "switch2" },
      { id: "e4", source: "switch2", target: "click1" },
    ],
  },
};
