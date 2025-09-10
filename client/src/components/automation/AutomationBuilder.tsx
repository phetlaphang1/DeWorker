import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Handle,
  Position,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import { useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

import { FlowDefinition, NodeKind, NodeData } from "./types";
import { TEMPLATES } from "./templates";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Globe, Type, MousePointer, Save, Download, FileJson, Play, Copy, Code, Navigation, Frame, Layers, ArrowDown, List, Repeat, Database, FileText } from "lucide-react";

// Palette với icons và descriptions
const PALETTE: { 
  kind: NodeKind; 
  label: string; 
  icon: React.ReactNode;
  description: string;
  defaultConfig?: any 
}[] = [
  { 
    kind: "GoTo", 
    label: "Go To URL", 
    icon: <Globe className="w-4 h-4" />,
    description: "Navigate to a webpage",
    defaultConfig: { url: "" } 
  },
  { 
    kind: "Navigation", 
    label: "Navigation", 
    icon: <Navigation className="w-4 h-4" />,
    description: "Browser navigation (back/forward/refresh)",
    defaultConfig: { action: "forward" } 
  },
  { 
    kind: "Type", 
    label: "Type Text", 
    icon: <Type className="w-4 h-4" />,
    description: "Enter text into an input field",
    defaultConfig: { xpath: "", text: "" } 
  },
  { 
    kind: "Click", 
    label: "Click Element", 
    icon: <MousePointer className="w-4 h-4" />,
    description: "Click on a page element",
    defaultConfig: { xpath: "", index: 0 } 
  },
  { 
    kind: "Select", 
    label: "Select Dropdown", 
    icon: <List className="w-4 h-4" />,
    description: "Select option from dropdown",
    defaultConfig: { xpath: "", selectBy: "text", selectValue: "" } 
  },
  { 
    kind: "SwitchFrame", 
    label: "Switch Frame", 
    icon: <Frame className="w-4 h-4" />,
    description: "Enter/exit iframe",
    defaultConfig: { frameType: "enter", frameSelector: "" } 
  },
  { 
    kind: "SwitchTab", 
    label: "Switch Tab", 
    icon: <Layers className="w-4 h-4" />,
    description: "Switch between browser tabs",
    defaultConfig: { tabIndex: 0 } 
  },
  { 
    kind: "ScrollTo", 
    label: "Scroll To", 
    icon: <ArrowDown className="w-4 h-4" />,
    description: "Scroll to element or position",
    defaultConfig: { scrollType: "element", xpath: "" } 
  },
  { 
    kind: "Wait", 
    label: "Wait", 
    icon: <Navigation className="w-4 h-4" />,
    description: "Wait for element or time",
    defaultConfig: { waitType: "element", xpath: "", timeout: 5000 } 
  },
  { 
    kind: "If", 
    label: "If Condition", 
    icon: <Navigation className="w-4 h-4" />,
    description: "Conditional logic",
    defaultConfig: { condition: "element_exists", xpath: "" } 
  },
  { 
    kind: "Loop", 
    label: "Loop", 
    icon: <Repeat className="w-4 h-4" />,
    description: "Loop through items",
    defaultConfig: { items: [], iteratorName: "item" } 
  },
  { 
    kind: "Extract", 
    label: "Extract Data", 
    icon: <Database className="w-4 h-4" />,
    description: "Extract text or attributes",
    defaultConfig: { xpath: "", extractType: "text" } 
  },
  { 
    kind: "DataProcess", 
    label: "Process Data", 
    icon: <Database className="w-4 h-4" />,
    description: "Process and assign data",
    defaultConfig: { processType: "getText", xpath: "", targetVariable: "" } 
  },
  { 
    kind: "Log", 
    label: "Log Message", 
    icon: <FileText className="w-4 h-4" />,
    description: "Log message to console",
    defaultConfig: { logLevel: "info", message: "" } 
  },
];

// Custom Node Component với handles lớn hơn và rõ ràng hơn
const CustomNodeComponent = ({ data, selected }: { data: NodeData; selected: boolean }) => {
  return (
    <div className={`
      px-4 py-3 rounded-lg bg-white border-2 min-w-[180px]
      transition-all duration-200 hover:shadow-lg
      ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
    `}>
      {/* Input Handle - Bên trái */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
        style={{ left: '-8px' }}
      />
      
      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg
          ${data.kind === 'GoTo' ? 'bg-blue-100' : ''}
          ${data.kind === 'Navigation' ? 'bg-blue-100' : ''}
          ${data.kind === 'Type' ? 'bg-green-100' : ''}
          ${data.kind === 'Click' ? 'bg-purple-100' : ''}
          ${data.kind === 'Select' ? 'bg-indigo-100' : ''}
          ${data.kind === 'SwitchFrame' ? 'bg-orange-100' : ''}
          ${data.kind === 'SwitchTab' ? 'bg-pink-100' : ''}
          ${data.kind === 'ScrollTo' ? 'bg-teal-100' : ''}
          ${data.kind === 'Wait' ? 'bg-yellow-100' : ''}
          ${data.kind === 'If' ? 'bg-red-100' : ''}
          ${data.kind === 'Loop' ? 'bg-cyan-100' : ''}
          ${data.kind === 'Extract' ? 'bg-gray-100' : ''}
          ${data.kind === 'DataProcess' ? 'bg-lime-100' : ''}
          ${data.kind === 'Log' ? 'bg-amber-100' : ''}
        `}>
          {data.kind === "GoTo" && <Globe className="w-5 h-5 text-blue-600" />}
          {data.kind === "Navigation" && <Navigation className="w-5 h-5 text-blue-600" />}
          {data.kind === "Type" && <Type className="w-5 h-5 text-green-600" />}
          {data.kind === "Click" && <MousePointer className="w-5 h-5 text-purple-600" />}
          {data.kind === "Select" && <List className="w-5 h-5 text-indigo-600" />}
          {data.kind === "SwitchFrame" && <Frame className="w-5 h-5 text-orange-600" />}
          {data.kind === "SwitchTab" && <Layers className="w-5 h-5 text-pink-600" />}
          {data.kind === "ScrollTo" && <ArrowDown className="w-5 h-5 text-teal-600" />}
          {data.kind === "Wait" && <Navigation className="w-5 h-5 text-yellow-600" />}
          {data.kind === "If" && <Navigation className="w-5 h-5 text-red-600" />}
          {data.kind === "Loop" && <Repeat className="w-5 h-5 text-cyan-600" />}
          {data.kind === "Extract" && <Database className="w-5 h-5 text-gray-600" />}
          {data.kind === "DataProcess" && <Database className="w-5 h-5 text-lime-600" />}
          {data.kind === "Log" && <FileText className="w-5 h-5 text-amber-600" />}
        </div>
        <div>
          <div className="text-sm font-bold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">{data.kind}</div>
        </div>
      </div>
      
      {/* Output Handle - Bên phải */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-green-400 !border-2 !border-white hover:!bg-green-500 transition-colors"
        style={{ right: '-8px' }}
      />
    </div>
  );
};

// Đăng ký node types
const nodeTypes = {
  custom: CustomNodeComponent,
};

function AutomationBuilderInner() {
  const rf = useReactFlow();
  const { toast } = useToast();

  const [flowName, setFlowName] = useState("Untitled Flow");
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Inspector
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) as Node<NodeData> | undefined,
    [nodes, selectedId]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ 
        ...connection, 
        animated: true,
        style: { stroke: '#60a5fa', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60a5fa',
        },
      }, eds));
    },
    [setEdges]
  );

  const onDragOver = (ev: React.DragEvent) => ev.preventDefault();

  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    const kind = ev.dataTransfer.getData("application/node-kind") as NodeKind;
    if (!kind) return;

    const bounds = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const position = rf.project({
      x: ev.clientX - bounds.left,
      y: ev.clientY - bounds.top,
    });

    const id = `${kind}-${Date.now()}`;
    const def = PALETTE.find((p) => p.kind === kind)!;

    setNodes((nds) =>
      nds.concat({
        id,
        type: "custom",
        position,
        data: {
          label: def.label,
          kind: def.kind,
          config: def.defaultConfig,
        } as NodeData,
      })
    );
    setSelectedId(id);
  };

  const loadTemplate = (name: string) => {
    const t = TEMPLATES[name];
    if (!t) return;

    setNodes(
      t.nodes.map((n) => ({
        id: n.id,
        type: "custom",
        position: n.position,
        data: { ...n.data, kind: n.type as NodeKind },
      }))
    );
    setEdges(
      t.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: '#60a5fa', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60a5fa',
        },
      }))
    );
    setFlowName(t.meta?.name ?? name);
    setSelectedId(t.nodes[0]?.id ?? null);
  };

  const exportJSON = () => {
    const def: FlowDefinition = {
      meta: { name: flowName, version: "1.0" },
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as NodeData).kind,
        position: n.position,
        data: n.data as NodeData,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(def, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveLocal = () => {
    localStorage.setItem(
      "automation:current",
      JSON.stringify({ flowName, nodes, edges })
    );
    toast({ title: "Saved", description: "Flow saved to localStorage." });
  };

  const loadLocal = () => {
    const raw = localStorage.getItem("automation:current");
    if (!raw) return;
    const obj = JSON.parse(raw);
    setFlowName(obj.flowName);
    setNodes(obj.nodes);
    setEdges(obj.edges);
    setSelectedId(obj.nodes?.[0]?.id ?? null);
  };

  useEffect(() => {
    loadLocal();
  }, []);

  // ==== Update helpers for Inspector ====
  const patchSelectedNode = (patch: Partial<NodeData>) => {
    if (!selectedId) return;
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              data: {
                ...n.data,
                ...patch,
                config: {
                  ...n.data.config,
                  ...patch.config,
                },
              },
            }
          : n
      )
    );
  };
  const patchSelectedConfig = (cfgPatch: Record<string, any>) => {
    if (!selectedId) return;
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              data: {
                ...n.data,
                config: { ...n.data.config, ...cfgPatch },
              },
            }
          : n
      )
    );
  };

  // ====== Code generator (Puppeteer + helpers) ======
  const [isDefault, setIsDefault] = useState(true);
  const [preview, setPreview] = useState("");

  // topo sort để xác định thứ tự thực thi
  const topoSort = () => {
    const indeg: Record<string, number> = {};
    const g: Record<string, string[]> = {};
    nodes.forEach((n) => {
      indeg[n.id] = 0;
      g[n.id] = [];
    });
    edges.forEach((e) => {
      indeg[e.target] = (indeg[e.target] ?? 0) + 1;
      g[e.source].push(e.target);
    });
    const q = Object.keys(indeg).filter((id) => indeg[id] === 0);
    const order: string[] = [];
    while (q.length) {
      const u = q.shift()!;
      order.push(u);
      for (const v of g[u]) if (--indeg[v] === 0) q.push(v);
    }
    return order.length ? order : nodes.map((n) => n.id);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Đã copy code vào clipboard." });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast({ title: "Copied", description: "Đã copy code vào clipboard." });
    }
  };

  // cắt đoạn giữa newPage() và browser.close() (loại cả 2 dòng mốc)
  const sliceToDefaultSnippet = (fullCode: string) => {
    const lines = fullCode.split("\n");
    const startIdxRaw = lines.findIndex((l) =>
      /await\s+browser\.newPage\(\);/.test(l)
    );
    const endIdxRaw = lines.findIndex((l) =>
      /await\s+browser\.close\(\);/.test(l)
    );
    const start = startIdxRaw >= 0 ? startIdxRaw + 1 : 0;
    const end = endIdxRaw >= 0 ? endIdxRaw : lines.length;
    return lines.slice(start, end).join("\n").trim();
  };


  const generateCode = async () => {
  // build phần thân từ các node
  const order = topoSort();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const lines: string[] = [];

  for (const id of order) {
    const n = nodeMap.get(id);
    if (!n) continue;
    const d = n.data as NodeData;

    if (d.kind === "GoTo") {
      const url = d.config?.url?.trim() || "https://example.com";
      lines.push(`await page.goto(${JSON.stringify(url)});`);
      lines.push(`console.log("Page title:", await page.title());`);
    }
    if (d.kind === "Navigation") {
      const action = d.config?.action || "forward";
      if (action === "forward") lines.push(`await page.goForward();`);
      else if (action === "back") lines.push(`await page.goBack();`);
      else if (action === "refresh") lines.push(`await page.reload();`);
      else if (action === "newTab") lines.push(`const newPage = await browser.newPage();`);
    }
    if (d.kind === "Type") {
      const xpath = d.config?.xpath?.trim() || "";
      // Remove leading // from XPath if present
      const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
      const text  = d.config?.text ?? "";
      lines.push(`await act.type(page, ${JSON.stringify(normalizedXPath)}, ${JSON.stringify(text)});`);
    }
    if (d.kind === "Click") {
      const xpath = d.config?.xpath?.trim() || "";
      // Remove leading // from XPath if present
      const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
      const index = d.config?.index;
      const stmt = Number.isFinite(index)
        ? `await act.click(page, ${JSON.stringify(normalizedXPath)}, ${Number(index)});`
        : `await act.click(page, ${JSON.stringify(normalizedXPath)});`;
      lines.push(stmt);
    }
    if (d.kind === "Select") {
      const xpath = d.config?.xpath?.trim() || "";
      const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
      const selectBy = d.config?.selectBy || "text";
      const selectValue = d.config?.selectValue || "";
      const selectIndex = d.config?.selectIndex ?? 0;
      
      if (selectBy === "index") {
        lines.push(`await act.select(page, ${JSON.stringify(normalizedXPath)}, { index: ${selectIndex} });`);
      } else if (selectBy === "value") {
        lines.push(`await act.select(page, ${JSON.stringify(normalizedXPath)}, { value: ${JSON.stringify(selectValue)} });`);
      } else {
        lines.push(`await act.select(page, ${JSON.stringify(normalizedXPath)}, { text: ${JSON.stringify(selectValue)} });`);
      }
    }
    if (d.kind === "SwitchFrame") {
      const frameType = d.config?.frameType || "enter";
      const frameSelector = d.config?.frameSelector || "";
      
      if (frameType === "enter") {
        lines.push(`const frame = await page.waitForSelector(${JSON.stringify(frameSelector)});`);
        lines.push(`await page.evaluate(el => el.contentDocument, frame);`);
      } else if (frameType === "exit") {
        lines.push(`await page.mainFrame();`);
      } else if (frameType === "parent") {
        lines.push(`await page.parentFrame();`);
      }
    }
    if (d.kind === "SwitchTab") {
      const tabIndex = d.config?.tabIndex ?? 0;
      const tabUrl = d.config?.tabUrl || "";
      
      if (tabUrl) {
        lines.push(`const pages = await browser.pages();`);
        lines.push(`const targetPage = pages.find(p => p.url().includes(${JSON.stringify(tabUrl)}));`);
        lines.push(`if (targetPage) await targetPage.bringToFront();`);
      } else {
        lines.push(`const pages = await browser.pages();`);
        lines.push(`if (pages[${tabIndex}]) await pages[${tabIndex}].bringToFront();`);
      }
    }
    if (d.kind === "ScrollTo") {
      const scrollType = d.config?.scrollType || "element";
      const xpath = d.config?.xpath?.trim() || "";
      const scrollX = d.config?.scrollX ?? 0;
      const scrollY = d.config?.scrollY ?? 0;
      
      if (scrollType === "element") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`await act.scrollToElement(page, ${JSON.stringify(normalizedXPath)});`);
      } else if (scrollType === "position") {
        lines.push(`await page.evaluate(() => window.scrollTo(${scrollX}, ${scrollY}));`);
      } else if (scrollType === "bottom") {
        lines.push(`await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`);
      } else if (scrollType === "top") {
        lines.push(`await page.evaluate(() => window.scrollTo(0, 0));`);
      }
    }
    if (d.kind === "Wait") {
      const waitType = d.config?.waitType || "element";
      const xpath = d.config?.xpath?.trim() || "";
      const timeout = d.config?.timeout ?? 5000;
      
      if (waitType === "element") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`await act.waitForElement(page, ${JSON.stringify(normalizedXPath)}, ${timeout});`);
      } else {
        lines.push(`await new Promise(resolve => setTimeout(resolve, ${timeout}));`);
      }
    }
    if (d.kind === "Sleep") {
      const timeout = d.config?.timeout ?? 1000;
      lines.push(`await new Promise(resolve => setTimeout(resolve, ${timeout}));`);
    }
    if (d.kind === "If") {
      const condition = d.config?.condition || "element_exists";
      const xpath = d.config?.xpath?.trim() || "";
      const value = d.config?.value || "";
      
      if (condition === "element_exists") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`if (await act.elementExists(page, ${JSON.stringify(normalizedXPath)})) {`);
      } else if (condition === "element_not_exists") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`if (!(await act.elementExists(page, ${JSON.stringify(normalizedXPath)}))) {`);
      } else if (condition === "text_contains") {
        lines.push(`if ((await page.content()).includes(${JSON.stringify(value)})) {`);
      } else if (condition === "page_title_is") {
        lines.push(`if ((await page.title()) === ${JSON.stringify(value)}) {`);
      }
    }
    if (d.kind === "Else") {
      lines.push(`} else {`);
    }
    if (d.kind === "Loop") {
      const items = d.config?.items || [];
      const iteratorName = d.config?.iteratorName || "item";
      lines.push(`for (const ${iteratorName} of ${JSON.stringify(items)}) {`);
    }
    if (d.kind === "For") {
      const start = d.config?.start ?? 0;
      const end = d.config?.end ?? 10;
      const step = d.config?.step ?? 1;
      lines.push(`for (let i = ${start}; i < ${end}; i += ${step}) {`);
    }
    if (d.kind === "While") {
      const condition = d.config?.condition || "element_exists";
      const xpath = d.config?.xpath?.trim() || "";
      
      if (condition === "element_exists") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`while (await act.elementExists(page, ${JSON.stringify(normalizedXPath)})) {`);
      }
    }
    if (d.kind === "Variable") {
      const variableName = d.config?.variableName || "myVar";
      const variableValue = d.config?.variableValue || "";
      const operation = d.config?.operation || "set";
      
      if (operation === "set") {
        lines.push(`const ${variableName} = ${JSON.stringify(variableValue)};`);
      } else {
        lines.push(`console.log(${variableName});`);
      }
    }
    if (d.kind === "Extract") {
      const xpath = d.config?.xpath?.trim() || "";
      const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
      const extractType = d.config?.extractType || "text";
      const attribute = d.config?.attribute || "";
      
      if (extractType === "text") {
        lines.push(`const extractedText = await act.getText(page, ${JSON.stringify(normalizedXPath)});`);
        lines.push(`console.log("Extracted:", extractedText);`);
      } else {
        lines.push(`const extractedAttr = await act.getAttribute(page, ${JSON.stringify(normalizedXPath)}, ${JSON.stringify(attribute)});`);
        lines.push(`console.log("Extracted:", extractedAttr);`);
      }
    }
    if (d.kind === "DataProcess") {
      const processType = d.config?.processType || "getText";
      const xpath = d.config?.xpath?.trim() || "";
      const targetVariable = d.config?.targetVariable || "result";
      
      if (processType === "getText") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`const ${targetVariable} = await act.getText(page, ${JSON.stringify(normalizedXPath)});`);
      } else if (processType === "getValue") {
        const normalizedXPath = xpath.startsWith('//') ? xpath.substring(2) : xpath;
        lines.push(`const ${targetVariable} = await act.getValue(page, ${JSON.stringify(normalizedXPath)});`);
      } else if (processType === "assignVariable") {
        const sourceVariable = d.config?.sourceVariable || "";
        lines.push(`const ${targetVariable} = ${sourceVariable};`);
      }
    }
    if (d.kind === "Log") {
      const logLevel = d.config?.logLevel || "info";
      const message = d.config?.message || "";
      
      if (logLevel === "error") {
        lines.push(`console.error(${JSON.stringify(message)});`);
      } else if (logLevel === "warn") {
        lines.push(`console.warn(${JSON.stringify(message)});`);
      } else if (logLevel === "debug") {
        lines.push(`console.debug(${JSON.stringify(message)});`);
      } else {
        lines.push(`console.log(${JSON.stringify(message)});`);
      }
    }
  }

  const header =
`import puppeteer from "puppeteer";
import * as act from "#act";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
`;

  const footer = `
  await browser.close();
})();
`;

  let full = header + "  " + lines.join("\n  ") + footer;

  // Nếu tick "Default" → chỉ copy phần giữa newPage() và close,
  // NHƯNG vẫn chèn import helpers nếu có Type/Click
  if (isDefault) {
    const body = sliceToDefaultSnippet(full); // giữa newPage() và close()
    const needsHelpers = nodes.some((n) => {
      const k = (n.data as NodeData).kind;
      return k === "Type" || k === "Click";
    });
    const helperImport = needsHelpers
      ? `import puppeteer from "puppeteer";\nimport * as act from "#act";\n`
      : "";
    full = helperImport + body + (body.endsWith("\n") ? "" : "\n");
  } else {
    if (!full.endsWith("\n")) full += "\n";
  }

  setPreview(full);
  await copyToClipboard(full);
};


  return (
    <div className="flex h-full min-h-[520px]">
      {/* Enhanced Palette */}
      <aside className="w-80 border-r bg-gradient-to-b from-white to-gray-50 shadow-sm overflow-y-auto max-h-full">
        <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Automation Nodes</h2>
        </div>
        
        <div className="space-y-3">
          {PALETTE.map((p) => (
            <button
              key={p.kind}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/node-kind", p.kind)
              }
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left 
                         hover:border-blue-400 hover:shadow-md hover:scale-[1.02] 
                         transition-all duration-200 cursor-move group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  {p.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{p.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            Templates
          </h3>
          {Object.keys(TEMPLATES).map((t) => (
            <Button
              key={t}
              className="w-full mt-2 justify-start"
              variant="outline"
              onClick={() => loadTemplate(t)}
            >
              <Play className="w-4 h-4 mr-2" />
              {t.replace("Basic: ", "")}
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Flow Name</label>
            <input
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 
                         focus:border-blue-400 focus:outline-none transition-colors"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Enter flow name..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={saveLocal} className="w-full" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button onClick={loadLocal} variant="outline" className="w-full" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Load
            </Button>
          </div>
          
          <Button onClick={exportJSON} variant="secondary" className="w-full" size="sm">
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON
          </Button>

          {/* Code Generation Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Code Generation</h3>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Generate snippet only (no boilerplate)</span>
            </label>
            
            <Button 
              onClick={generateCode} 
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Generate & Copy Code
            </Button>
          </div>

          {/* Enhanced Code Preview */}
          {preview && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Generated Code</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(preview)}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  className="w-full h-48 border-2 border-gray-200 rounded-lg p-3 
                           text-xs font-mono bg-gray-900 text-green-400
                           resize-none focus:outline-none"
                  value={preview}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-500">JavaScript</div>
              </div>
            </div>
          )}
        </div>
        </div>
      </aside>

      {/* Canvas + Inspector */}
      <div className="flex-1 min-h-0 relative">
        <div
          className="absolute inset-0"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            connectionLineStyle={{ stroke: '#60a5fa', strokeWidth: 2 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>

        {/* Enhanced Inspector */}
        <aside className="absolute top-0 right-0 h-full w-[380px] border-l bg-gradient-to-b from-white to-gray-50 shadow-lg overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 z-10">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-blue-600" />
              Node Properties
            </h2>
          </div>

          <div className="p-4">
            {!selectedNode ? (
              <div className="text-center py-12">
                <MousePointer className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Select a node to configure</p>
                <p className="text-xs text-gray-400 mt-2">Click on any node in the canvas</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Node Label
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 
                             focus:border-blue-400 focus:outline-none transition-colors"
                    value={(selectedNode.data as NodeData).label || ""}
                    onChange={(e) => patchSelectedNode({ label: e.target.value })}
                    placeholder="Enter a descriptive label..."
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    {(selectedNode.data as NodeData).kind === "GoTo" && <Globe className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Navigation" && <Navigation className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Type" && <Type className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Click" && <MousePointer className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Select" && <List className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "SwitchFrame" && <Frame className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "SwitchTab" && <Layers className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "ScrollTo" && <ArrowDown className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Wait" && <Navigation className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "If" && <Navigation className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Loop" && <Repeat className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Extract" && <Database className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "DataProcess" && <Database className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Log" && <FileText className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind} Configuration
                  </h3>

                  {/* GoTo URL */}
                  {(selectedNode.data as NodeData).kind === "GoTo" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Target URL
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="https://example.com"
                          value={(selectedNode.data as NodeData).config?.url || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ url: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the full URL including https://
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Type */}
                  {(selectedNode.data as NodeData).kind === "Type" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Element XPath
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                          placeholder="//input[@name='q']"
                          value={(selectedNode.data as NodeData).config?.xpath || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ xpath: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          XPath selector for the input element
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Text to Type
                        </label>
                        <textarea
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors resize-none"
                          rows={3}
                          placeholder="Enter the text to type..."
                          value={(selectedNode.data as NodeData).config?.text || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ text: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The text that will be typed into the element
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Click */}
                  {(selectedNode.data as NodeData).kind === "Click" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Element XPath
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                          placeholder="//button[@id='submit']"
                          value={(selectedNode.data as NodeData).config?.xpath || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ xpath: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          XPath selector for the element to click
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Element Index
                          <span className="text-xs text-gray-400 ml-2">(Optional)</span>
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="0"
                          min="0"
                          value={
                            (selectedNode.data as NodeData).config?.index ?? ""
                          }
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value);
                            patchSelectedConfig({ index: v });
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          If multiple elements match, specify which one (0 = first)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  {(selectedNode.data as NodeData).kind === "Navigation" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Navigation Action
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.action || "forward"}
                          onChange={(e) =>
                            patchSelectedConfig({ action: e.target.value })
                          }
                        >
                          <option value="forward">Forward</option>
                          <option value="back">Back</option>
                          <option value="refresh">Refresh</option>
                          <option value="newTab">New Tab</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Select */}
                  {(selectedNode.data as NodeData).kind === "Select" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Dropdown XPath
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                          placeholder="//select[@name='country']"
                          value={(selectedNode.data as NodeData).config?.xpath || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ xpath: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Select By
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.selectBy || "text"}
                          onChange={(e) =>
                            patchSelectedConfig({ selectBy: e.target.value })
                          }
                        >
                          <option value="text">Text</option>
                          <option value="value">Value</option>
                          <option value="index">Index</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          {(selectedNode.data as NodeData).config?.selectBy === "index" ? "Index" : "Value"}
                        </label>
                        {(selectedNode.data as NodeData).config?.selectBy === "index" ? (
                          <input
                            type="number"
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="0"
                            min="0"
                            value={(selectedNode.data as NodeData).config?.selectIndex ?? ""}
                            onChange={(e) =>
                              patchSelectedConfig({ selectIndex: Number(e.target.value) })
                            }
                          />
                        ) : (
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Option text or value"
                            value={(selectedNode.data as NodeData).config?.selectValue || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ selectValue: e.target.value })
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* SwitchFrame */}
                  {(selectedNode.data as NodeData).kind === "SwitchFrame" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Frame Action
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.frameType || "enter"}
                          onChange={(e) =>
                            patchSelectedConfig({ frameType: e.target.value })
                          }
                        >
                          <option value="enter">Enter Frame</option>
                          <option value="exit">Exit to Main</option>
                          <option value="parent">Exit to Parent</option>
                        </select>
                      </div>
                      {(selectedNode.data as NodeData).config?.frameType === "enter" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Frame Selector
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="iframe[name='content'] or 0"
                            value={(selectedNode.data as NodeData).config?.frameSelector || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ frameSelector: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            CSS selector or frame index
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SwitchTab */}
                  {(selectedNode.data as NodeData).kind === "SwitchTab" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Tab Index
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="0"
                          min="0"
                          value={(selectedNode.data as NodeData).config?.tabIndex ?? 0}
                          onChange={(e) =>
                            patchSelectedConfig({ tabIndex: Number(e.target.value) })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          0 = first tab, 1 = second tab, etc.
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Tab URL
                          <span className="text-xs text-gray-400 ml-2">(Optional)</span>
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="https://example.com"
                          value={(selectedNode.data as NodeData).config?.tabUrl || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ tabUrl: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Switch to tab with this URL
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ScrollTo */}
                  {(selectedNode.data as NodeData).kind === "ScrollTo" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Scroll Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.scrollType || "element"}
                          onChange={(e) =>
                            patchSelectedConfig({ scrollType: e.target.value })
                          }
                        >
                          <option value="element">To Element</option>
                          <option value="position">To Position</option>
                          <option value="bottom">To Bottom</option>
                          <option value="top">To Top</option>
                        </select>
                      </div>
                      {(selectedNode.data as NodeData).config?.scrollType === "element" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Element XPath
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="//div[@id='footer']"
                            value={(selectedNode.data as NodeData).config?.xpath || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ xpath: e.target.value })
                            }
                          />
                        </div>
                      )}
                      {(selectedNode.data as NodeData).config?.scrollType === "position" && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              X Position
                            </label>
                            <input
                              type="number"
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                       focus:border-blue-400 focus:outline-none transition-colors"
                              placeholder="0"
                              value={(selectedNode.data as NodeData).config?.scrollX ?? 0}
                              onChange={(e) =>
                                patchSelectedConfig({ scrollX: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              Y Position
                            </label>
                            <input
                              type="number"
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                       focus:border-blue-400 focus:outline-none transition-colors"
                              placeholder="500"
                              value={(selectedNode.data as NodeData).config?.scrollY ?? 0}
                              onChange={(e) =>
                                patchSelectedConfig({ scrollY: Number(e.target.value) })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Wait */}
                  {(selectedNode.data as NodeData).kind === "Wait" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Wait Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.waitType || "element"}
                          onChange={(e) =>
                            patchSelectedConfig({ waitType: e.target.value })
                          }
                        >
                          <option value="element">For Element</option>
                          <option value="time">For Time</option>
                        </select>
                      </div>
                      {(selectedNode.data as NodeData).config?.waitType === "element" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Element XPath
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="//div[@class='loaded']"
                            value={(selectedNode.data as NodeData).config?.xpath || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ xpath: e.target.value })
                            }
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Timeout (ms)
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="5000"
                          min="0"
                          value={(selectedNode.data as NodeData).config?.timeout ?? 5000}
                          onChange={(e) =>
                            patchSelectedConfig({ timeout: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* If */}
                  {(selectedNode.data as NodeData).kind === "If" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Condition Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.condition || "element_exists"}
                          onChange={(e) =>
                            patchSelectedConfig({ condition: e.target.value })
                          }
                        >
                          <option value="element_exists">Element Exists</option>
                          <option value="element_not_exists">Element Not Exists</option>
                          <option value="text_contains">Text Contains</option>
                          <option value="page_title_is">Page Title Is</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          {(selectedNode.data as NodeData).config?.condition?.includes("element") ? "Element XPath" : "Value"}
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                          placeholder={(selectedNode.data as NodeData).config?.condition?.includes("element") ? "//div[@id='result']" : "Expected value"}
                          value={(selectedNode.data as NodeData).config?.xpath || (selectedNode.data as NodeData).config?.value || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ 
                              [(selectedNode.data as NodeData).config?.condition?.includes("element") ? "xpath" : "value"]: e.target.value 
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Loop */}
                  {(selectedNode.data as NodeData).kind === "Loop" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Iterator Name
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="item"
                          value={(selectedNode.data as NodeData).config?.iteratorName || "item"}
                          onChange={(e) =>
                            patchSelectedConfig({ iteratorName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Items (JSON Array)
                        </label>
                        <textarea
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm resize-none"
                          rows={3}
                          placeholder='["item1", "item2", "item3"]'
                          value={JSON.stringify((selectedNode.data as NodeData).config?.items || [])}
                          onChange={(e) => {
                            try {
                              const items = JSON.parse(e.target.value);
                              patchSelectedConfig({ items });
                            } catch {}
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Extract */}
                  {(selectedNode.data as NodeData).kind === "Extract" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Element XPath
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                          placeholder="//h1[@class='title']"
                          value={(selectedNode.data as NodeData).config?.xpath || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ xpath: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Extract Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.extractType || "text"}
                          onChange={(e) =>
                            patchSelectedConfig({ extractType: e.target.value })
                          }
                        >
                          <option value="text">Text Content</option>
                          <option value="attribute">Attribute</option>
                        </select>
                      </div>
                      {(selectedNode.data as NodeData).config?.extractType === "attribute" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Attribute Name
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="href"
                            value={(selectedNode.data as NodeData).config?.attribute || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ attribute: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* DataProcess */}
                  {(selectedNode.data as NodeData).kind === "DataProcess" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Process Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.processType || "getText"}
                          onChange={(e) =>
                            patchSelectedConfig({ processType: e.target.value })
                          }
                        >
                          <option value="getText">Get Text</option>
                          <option value="getValue">Get Value</option>
                          <option value="setAttribute">Set Attribute</option>
                          <option value="assignVariable">Assign Variable</option>
                        </select>
                      </div>
                      {((selectedNode.data as NodeData).config?.processType === "getText" || 
                        (selectedNode.data as NodeData).config?.processType === "getValue") && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Element XPath
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="//input[@id='result']"
                            value={(selectedNode.data as NodeData).config?.xpath || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ xpath: e.target.value })
                            }
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Target Variable Name
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="myVariable"
                          value={(selectedNode.data as NodeData).config?.targetVariable || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ targetVariable: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Log */}
                  {(selectedNode.data as NodeData).kind === "Log" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Log Level
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.logLevel || "info"}
                          onChange={(e) =>
                            patchSelectedConfig({ logLevel: e.target.value })
                          }
                        >
                          <option value="info">Info</option>
                          <option value="warn">Warning</option>
                          <option value="error">Error</option>
                          <option value="debug">Debug</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Message
                        </label>
                        <textarea
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors resize-none"
                          rows={3}
                          placeholder="Log message..."
                          value={(selectedNode.data as NodeData).config?.message || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ message: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AutomationBuilder() {
  return (
    <ReactFlowProvider>
      <AutomationBuilderInner />
    </ReactFlowProvider>
  );
}
