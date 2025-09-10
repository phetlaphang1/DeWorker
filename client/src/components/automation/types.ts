// Node types
export type NodeKind = "GoTo" | "Type" | "Click" | "MultiType" | "If" | "Else" | "Wait" | "Sleep" | "For" | "While" | "Variable" | "Extract" | "Navigation" | "SwitchFrame" | "SwitchTab" | "ScrollTo" | "Select" | "Loop" | "DataProcess" | "Log";

// Cấu hình của từng node
export type NodeData = {
  label: string;
  kind: NodeKind;
  config?: {
    // GoTo
    url?: string;
    // Type
    xpath?: string;
    text?: string;
    // Click
    index?: number;
    // MultiType
    inputs?: Array<{
      xpath: string;
      text: string;
      label: string;
    }>;
    // If/Else
    condition?: "element_exists" | "element_not_exists" | "text_contains" | "page_title_is";
    value?: string;
    // Wait/Sleep
    timeout?: number;
    waitType?: "element" | "time";
    // Loop
    loopType?: "for" | "while";
    start?: number;
    end?: number;
    step?: number;
    // Variable
    variableName?: string;
    variableValue?: string;
    operation?: "set" | "get";
    // Extract
    extractType?: "text" | "attribute";
    attribute?: string;
    // Navigation
    action?: "forward" | "back" | "refresh" | "newTab";
    // SwitchFrame
    frameType?: "enter" | "exit" | "parent";
    frameSelector?: string;
    // SwitchTab
    tabIndex?: number;
    tabUrl?: string;
    // ScrollTo
    scrollType?: "element" | "position" | "bottom" | "top";
    scrollX?: number;
    scrollY?: number;
    // Select
    selectBy?: "value" | "text" | "index";
    selectValue?: string;
    selectIndex?: number;
    // Loop
    items?: string[];
    iteratorName?: string;
    // DataProcess
    processType?: "getText" | "getValue" | "setAttribute" | "assignVariable";
    targetVariable?: string;
    sourceVariable?: string;
    // Log
    logLevel?: "info" | "warn" | "error" | "debug";
    message?: string;
  };
};

export type FlowDefinition = {
  nodes: Array<{
    id: string;
    type: NodeKind;
    position: { x: number; y: number };
    data: NodeData;
  }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
  meta?: { name?: string; version?: string };
};
