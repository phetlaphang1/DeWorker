export const template = {
  meta: { name: "X (Twitter) Post Tweet", version: "1.0" },
  nodes: [
    {
      id: "goto1",
      type: "GoTo",
      position: { x: 80, y: 80 },
      data: { label: "Go to X Home", kind: "GoTo", config: { url: "https://x.com/home" } },
    },
    {
      id: "wait1",
      type: "Wait",
      position: { x: 280, y: 80 },
      data: { label: "Wait for Compose", kind: "Wait", config: { waitType: "element", xpath: "//a[@aria-label='Post']", timeout: 5000 } },
    },
    {
      id: "click1",
      type: "Click",
      position: { x: 480, y: 80 },
      data: { label: "Click Post Button", kind: "Click", config: { xpath: "//a[@aria-label='Post']" } },
    },
    {
      id: "wait2",
      type: "Wait",
      position: { x: 680, y: 80 },
      data: { label: "Wait for Editor", kind: "Wait", config: { waitType: "element", xpath: "//div[@data-testid='tweetTextarea_0']", timeout: 3000 } },
    },
    {
      id: "type1",
      type: "Type",
      position: { x: 880, y: 80 },
      data: { label: "Type Tweet", kind: "Type", config: { xpath: "//div[@data-testid='tweetTextarea_0']//div[@contenteditable='true']", text: "Hello X! This is my automated tweet." } },
    },
    {
      id: "wait3",
      type: "Wait",
      position: { x: 1080, y: 80 },
      data: { label: "Wait 1 second", kind: "Wait", config: { waitType: "time", timeout: 1000 } },
    },
    {
      id: "click2",
      type: "Click",
      position: { x: 1280, y: 80 },
      data: { label: "Send Tweet", kind: "Click", config: { xpath: "//span[text()='Post']//ancestor::div[@role='button'][@data-testid='tweetButtonInline']" } },
    },
    {
      id: "wait4",
      type: "Wait",
      position: { x: 1480, y: 80 },
      data: { label: "Wait for Success", kind: "Wait", config: { waitType: "time", timeout: 3000 } },
    },
    {
      id: "log1",
      type: "Log",
      position: { x: 1680, y: 80 },
      data: { label: "Tweet Posted", kind: "Log", config: { logLevel: "info", message: "Tweet posted successfully" } },
    },
  ],
  edges: [
    { id: "e1", source: "goto1", target: "wait1" },
    { id: "e2", source: "wait1", target: "click1" },
    { id: "e3", source: "click1", target: "wait2" },
    { id: "e4", source: "wait2", target: "type1" },
    { id: "e5", source: "type1", target: "wait3" },
    { id: "e6", source: "wait3", target: "click2" },
    { id: "e7", source: "click2", target: "wait4" },
    { id: "e8", source: "wait4", target: "log1" },
  ],
};