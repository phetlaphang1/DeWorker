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
import { templateManager } from "../../../../server/scripts/templates/templateManager";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Globe, Type, MousePointer, Save, Download, FileJson, Play, Copy, Code, Navigation, Frame, Layers, ArrowDown, List, Repeat, Database, FileText, Trash2, Plus, Moon, Send } from "lucide-react";

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
    kind: "Sleep", 
    label: "Sleep", 
    icon: <Moon className="w-4 h-4" />,
    description: "Pause execution for specified time",
    defaultConfig: { timeout: 3000 } 
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
    label: "Loop Start", 
    icon: <Repeat className="w-4 h-4" />,
    description: "Start loop - repeat actions N times",
    defaultConfig: { loopCount: 5, currentIndexName: "i" } 
  },
  { 
    kind: "EndLoop", 
    label: "Loop End", 
    icon: <Repeat className="w-4 h-4" />,
    description: "End of loop block",
    defaultConfig: {} 
  },
  {
    kind: "Extract",
    label: "Extract Data",
    icon: <Database className="w-4 h-4" />,
    description: "Extract text or attributes from element",
    defaultConfig: {
      xpath: "",
      extractType: "text",
      variableName: "extractedData"
    }
  },
  {
    kind: "DataProcess",
    label: "Process Data",
    icon: <Database className="w-4 h-4" />,
    description: "Process and assign data to variables",
    defaultConfig: {
      processType: "assignVariable",
      sourceVariable: "extractedData",
      targetVariable: "processedData"
    }
  },
  {
    kind: "Log",
    label: "Log Message",
    icon: <FileText className="w-4 h-4" />,
    description: "Log message to console",
    defaultConfig: { logLevel: "info", message: "" }
  },
  {
    kind: "HttpRequest",
    label: "HTTP Request",
    icon: <Send className="w-4 h-4" />,
    description: "Make HTTP API calls",
    defaultConfig: {
      method: "POST",
      endpoint: "https://llmapi.roxane.one/v1/chat/completions",
      authType: "bearer",
      authToken: "linh-1752464641053-phonefarm",
      bodyType: "json",
      body: {
        model: "text-model",
        messages: [
          { role: "system", content: "You are a helpful assistant that creates insightful comments for social media posts." },
          { role: "user", content: "Please create a thoughtful comment for this post: ${data}" }
        ]
      },
      responseVariable: "apiResponse",
      timeout: 30000
    }
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
          ${data.kind === 'Sleep' ? 'bg-purple-100' : ''}
          ${data.kind === 'If' ? 'bg-red-100' : ''}
          ${data.kind === 'Loop' ? 'bg-cyan-100' : ''}
          ${data.kind === 'EndLoop' ? 'bg-cyan-100' : ''}
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
          {data.kind === "Sleep" && <Moon className="w-5 h-5 text-purple-600" />}
          {data.kind === "If" && <Navigation className="w-5 h-5 text-red-600" />}
          {data.kind === "Loop" && <Repeat className="w-5 h-5 text-cyan-600" />}
          {data.kind === "EndLoop" && <Repeat className="w-5 h-5 text-cyan-600" />}
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
  const [templates, setTemplates] = useState<Record<string, FlowDefinition>>({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [currentTemplateName, setCurrentTemplateName] = useState<string | null>(null);
  const [originalTemplateName, setOriginalTemplateName] = useState<string | null>(null);

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

  // Load a template from the templates list and set it as current editing template
  const loadTemplate = (name: string) => {
    const t = templates[name];
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
    
    // Set current template name to track which template is being edited
    setCurrentTemplateName(name);
    setOriginalTemplateName(name); // Store original name for rename operation
  };

  // Export current flow as executable JavaScript automation code
  const exportJS = async () => {
    // Generate code first
    const order = topoSort();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const lines: string[] = [];
    let openLoops = 0;

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
        const text  = d.config?.text ?? "";
        lines.push(`await act.type(page, ${JSON.stringify(xpath)}, ${JSON.stringify(text)});`);
      }
      if (d.kind === "Click") {
        const xpath = d.config?.xpath?.trim() || "";
        const index = d.config?.index;
        const stmt = Number.isFinite(index)
          ? `await act.click(page, ${JSON.stringify(xpath)}, ${Number(index)});`
          : `await act.click(page, ${JSON.stringify(xpath)});`;
        lines.push(stmt);
      }
      if (d.kind === "Select") {
        const xpath = d.config?.xpath?.trim() || "";
        const selectBy = d.config?.selectBy || "text";
        const selectValue = d.config?.selectValue || "";
        const selectIndex = d.config?.selectIndex ?? 0;
        
        if (selectBy === "index") {
          lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { index: ${selectIndex} });`);
        } else if (selectBy === "value") {
          lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { value: ${JSON.stringify(selectValue)} });`);
        } else {
          lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { text: ${JSON.stringify(selectValue)} });`);
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
          lines.push(`await act.scrollToElement(page, ${JSON.stringify(xpath)});`);
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
          lines.push(`await act.waitForElement(page, ${JSON.stringify(xpath)}, ${timeout});`);
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
          lines.push(`if (await act.elementExists(page, ${JSON.stringify(xpath)})) {`);
        } else if (condition === "element_not_exists") {
          lines.push(`if (!(await act.elementExists(page, ${JSON.stringify(xpath)}))) {`);
        } else if (condition === "text_contains") {
          lines.push(`if ((await page.content()).includes(${JSON.stringify(value)})) {`);
        } else if (condition === "page_title_is") {
          lines.push(`if ((await page.title()) === ${JSON.stringify(value)}) {`);
        }
      }
      if (d.kind === "Loop") {
        const loopCount = d.config?.loopCount ?? 5;
        const currentIndexName = d.config?.currentIndexName || "i";
        lines.push(`for (let ${currentIndexName} = 0; ${currentIndexName} < ${loopCount}; ${currentIndexName}++) {`);
        lines.push(`  console.log("Loop iteration:", ${currentIndexName} + 1);`);
        openLoops++;
      }
      if (d.kind === "EndLoop") {
        if (openLoops > 0) {
          lines.push(`}`); 
          openLoops--;
        }
      }
      if (d.kind === "Extract") {
        const xpath = d.config?.xpath?.trim() || "";
        const extractType = d.config?.extractType || "text";
        const attribute = d.config?.attribute || "";
        
        if (extractType === "text") {
          lines.push(`const extractedText = await act.getText(page, ${JSON.stringify(xpath)});`);
          lines.push(`console.log("Extracted:", extractedText);`);
        } else {
          lines.push(`const extractedAttr = await act.getAttribute(page, ${JSON.stringify(xpath)}, ${JSON.stringify(attribute)});`);
          lines.push(`console.log("Extracted:", extractedAttr);`);
        }
      }
      if (d.kind === "DataProcess") {
        const processType = d.config?.processType || "getText";
        const xpath = d.config?.xpath?.trim() || "";
        const targetVariable = d.config?.targetVariable || "result";
        
        if (processType === "getText") {
          lines.push(`const ${targetVariable} = await act.getText(page, ${JSON.stringify(xpath)});`);
        } else if (processType === "getValue") {
          lines.push(`const ${targetVariable} = await act.getValue(page, ${JSON.stringify(xpath)});`);
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

    // Auto-close any open loops
    while (openLoops > 0) {
      lines.push(`}`);
      openLoops--;
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

    const jsCode = header + "  " + lines.join("\n  ") + footer;
    
    const blob = new Blob([jsCode], {
      type: "application/javascript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, "-").toLowerCase()}.js`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: "JavaScript file exported successfully." });
  };

  // Save current flow - either update existing template or save as regular flow
  const saveLocal = () => {
    // If we're currently editing a template from "My Templates", update it
    if (currentTemplateName && !currentTemplateName.startsWith("Basic:") && !currentTemplateName.startsWith("X (Twitter)")) {
      const templateDef: FlowDefinition = {
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
      
      // If template was renamed, delete old one and save with new name
      if (originalTemplateName && originalTemplateName !== currentTemplateName) {
        templateManager.deleteCustomTemplate(originalTemplateName);
        templateManager.addCustomTemplate(currentTemplateName, templateDef);
        setOriginalTemplateName(currentTemplateName); // Update original name after successful rename
        
        toast({ 
          title: "Template Renamed & Updated", 
          description: `Template renamed from "${originalTemplateName}" to "${currentTemplateName}" with ${nodes.length} nodes.` 
        });
      } else {
        // Just update the existing template
        templateManager.addCustomTemplate(currentTemplateName, templateDef);
        
        toast({ 
          title: "Template Updated", 
          description: `Template "${currentTemplateName}" has been updated with ${nodes.length} nodes.` 
        });
      }
      
      // Refresh templates list
      templateManager.getAllTemplates().then((allTemplates: Record<string, FlowDefinition>) => {
        setTemplates(allTemplates);
      });
    } else {
      // Save as regular flow in localStorage
      localStorage.setItem(
        "automation:current",
        JSON.stringify({ flowName, nodes, edges })
      );
      toast({ title: "Saved", description: "Flow saved to localStorage." });
    }
  };

  const loadLocal = () => {
    const raw = localStorage.getItem("automation:current");
    if (!raw) return;
    const obj = JSON.parse(raw);
    setFlowName(obj.flowName);
    setNodes(obj.nodes);
    setEdges(obj.edges);
    setSelectedId(obj.nodes?.[0]?.id ?? null);
    setCurrentTemplateName(null); // Reset current template since loading a regular flow
    setOriginalTemplateName(null);
  };

  // Save current flow as a new template in localStorage
  const saveAsTemplate = async () => {
    if (!templateNameInput.trim()) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }
    
    const templateDef: FlowDefinition = {
      meta: { name: templateNameInput, version: "1.0" },
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
    
    try {
      // Save to localStorage for persistence
      templateManager.addCustomTemplate(templateNameInput, templateDef);
      const allTemplates = await templateManager.getAllTemplates();
      setTemplates(allTemplates);
      setShowTemplateDialog(false);
      setTemplateNameInput("");
      toast({ title: "Success", description: "Template saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteTemplate = async (name: string) => {
    const defaultTemplates = await templateManager.getDefaultTemplates();
    if (defaultTemplates[name]) {
      toast({ title: "Error", description: "Cannot delete default templates", variant: "destructive" });
      return;
    }
    
    try {
      // Delete from localStorage
      templateManager.deleteCustomTemplate(name);
      const allTemplates = await templateManager.getAllTemplates();
      setTemplates(allTemplates);
      toast({ title: "Success", description: "Template deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Import template from JSON or JS file and save to localStorage
  const importTemplateFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        // Check if it's a JS file or JSON file
        if (file.name.endsWith('.js')) {
          // Import JS file and save as template
          await importFromJS(content, file.name);
        } else {
          // Parse JSON template and save to localStorage
          const template = JSON.parse(content) as FlowDefinition;
          const simpleName = file.name.replace(/\.(json)$/, '');
          templateManager.addCustomTemplate(simpleName, template);
          const allTemplates = await templateManager.getAllTemplates();
          setTemplates(allTemplates);
          
          // Also load it to canvas
          loadTemplate(simpleName);
          
          toast({ title: "Success", description: `Template "${simpleName}" saved and loaded successfully` });
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Invalid file format", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  // Parse JS automation code and convert to template format
  const importFromJS = async (jsContent: string, fileName: string) => {
    try {
      // Basic parsing to convert JS automation back to nodes
      const nodes: any[] = [];
      const edges: any[] = [];
      let nodeId = 0;
      let yPos = 100;
      let openLoops: string[] = []; // Track open loops
      
      const lines = jsContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      lines.forEach((line) => {
        let nodeData: any = null;
        const id = `imported-${nodeId++}`;
        
        // Parse different types of automation commands - Updated to match export format
        if (line.includes('await page.goto(')) {
          const urlMatch = line.match(/await\s+page\.goto\(["']([^"']+)["']\)/);
          nodeData = {
            label: 'Go To URL',
            kind: 'GoTo',
            config: { url: urlMatch?.[1] || 'https://example.com' }
          };
        }
        else if (line.includes('await page.goForward()')) {
          nodeData = {
            label: 'Navigation',
            kind: 'Navigation',
            config: { action: 'forward' }
          };
        }
        else if (line.includes('await page.goBack()')) {
          nodeData = {
            label: 'Navigation',
            kind: 'Navigation',
            config: { action: 'back' }
          };
        }
        else if (line.includes('await page.reload()')) {
          nodeData = {
            label: 'Navigation',
            kind: 'Navigation',
            config: { action: 'refresh' }
          };
        }
        else if (line.includes('await act.type(')) {
          const typeMatch = line.match(/await\s+act\.type\(page,\s*["']([^"']+)["'],\s*["']([^"']*)["']\)/);
          nodeData = {
            label: 'Type Text',
            kind: 'Type',
            config: { 
              xpath: typeMatch?.[1] || '',
              text: typeMatch?.[2] || ''
            }
          };
        }
        else if (line.includes('await act.click(')) {
          const clickMatch = line.match(/await\s+act\.click\(page,\s*["']([^"']+)["'](?:,\s*(\d+))?\)/);
          nodeData = {
            label: 'Click Element',
            kind: 'Click',
            config: { 
              xpath: clickMatch?.[1] || '',
              index: clickMatch?.[2] ? parseInt(clickMatch[2]) : undefined
            }
          };
        }
        else if (line.includes('await act.select(')) {
          const selectMatch = line.match(/await\s+act\.select\(page,\s*["']([^"']+)["'],\s*\{([^}]+)\}\)/);
          if (selectMatch) {
            const xpath = selectMatch[1];
            const optionsStr = selectMatch[2];
            let config: any = { xpath };
            
            if (optionsStr.includes('index:')) {
              const indexMatch = optionsStr.match(/index:\s*(\d+)/);
              config.selectBy = 'index';
              config.selectIndex = parseInt(indexMatch?.[1] || '0');
            } else if (optionsStr.includes('value:')) {
              const valueMatch = optionsStr.match(/value:\s*["']([^"']+)["']/);
              config.selectBy = 'value';
              config.selectValue = valueMatch?.[1] || '';
            } else if (optionsStr.includes('text:')) {
              const textMatch = optionsStr.match(/text:\s*["']([^"']+)["']/);
              config.selectBy = 'text';
              config.selectValue = textMatch?.[1] || '';
            }
            
            nodeData = {
              label: 'Select Dropdown',
              kind: 'Select',
              config
            };
          }
        }
        else if (line.includes('await act.scrollToElement(')) {
          const scrollMatch = line.match(/await\s+act\.scrollToElement\(page,\s*["']([^"']+)["']\)/);
          nodeData = {
            label: 'Scroll To',
            kind: 'ScrollTo',
            config: { 
              scrollType: 'element',
              xpath: scrollMatch?.[1] || ''
            }
          };
        }
        else if (line.includes('await act.waitForElement(')) {
          const waitMatch = line.match(/await\s+act\.waitForElement\(page,\s*["']([^"']+)["'],\s*(\d+)\)/);
          nodeData = {
            label: 'Wait',
            kind: 'Wait',
            config: { 
              waitType: 'element',
              xpath: waitMatch?.[1] || '',
              timeout: parseInt(waitMatch?.[2] || '5000')
            }
          };
        }
        else if (line.includes('for (let') && line.includes('< ')) {
          const loopMatch = line.match(/for\s*\(let\s+(\w+)\s*=\s*\d+;\s*\1\s*<\s*(\d+);\s*\1\+\+\)/);
          if (loopMatch) {
            openLoops.push(loopMatch[1]);
            nodeData = {
              label: 'Loop Start',
              kind: 'Loop',
              config: { 
                loopCount: parseInt(loopMatch[2]),
                currentIndexName: loopMatch[1]
              }
            };
          }
        }
        else if (line === '}' && openLoops.length > 0) {
          // Check if this is a loop end
          openLoops.pop();
          nodeData = {
            label: 'Loop End',
            kind: 'EndLoop',
            config: {}
          };
        }
        else if (line.includes('await new Promise(resolve => setTimeout(')) {
          const timeMatch = line.match(/setTimeout\(resolve,\s*(\d+)\)/);
          nodeData = {
            label: 'Sleep',
            kind: 'Sleep',
            config: { timeout: parseInt(timeMatch?.[1] || '1000') }
          };
        }
        else if (line.includes('await act.getText(')) {
          const extractMatch = line.match(/await\s+act\.getText\(page,\s*["']([^"']+)["']\)/);
          nodeData = {
            label: 'Extract Data',
            kind: 'Extract',
            config: {
              xpath: extractMatch?.[1] || '',
              extractType: 'text'
            }
          };
        }
        else if (line.includes('console.log(') && !line.includes('Loop iteration') && !line.includes('Page title:') && !line.includes('Extracted:')) {
          const logMatch = line.match(/console\.(log|warn|error|debug)\(["']([^"']+)["']\)/);
          if (logMatch) {
            nodeData = {
              label: 'Log Message',
              kind: 'Log',
              config: { 
                logLevel: logMatch[1] === 'log' ? 'info' : logMatch[1],
                message: logMatch[2]
              }
            };
          }
        }
        
        if (nodeData) {
          nodes.push({
            id,
            type: 'custom',
            position: { x: 250, y: yPos },
            data: nodeData
          });
          
          // Create edge to connect to previous node
          if (nodes.length > 1) {
            edges.push({
              id: `edge-${nodes.length-2}-${nodes.length-1}`,
              source: nodes[nodes.length-2].id,
              target: id,
              animated: true,
              style: { stroke: '#60a5fa', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowClosed',
                color: '#60a5fa',
              },
            });
          }
          
          yPos += 100;
        }
      });
      
      if (nodes.length === 0) {
        toast({ title: "Warning", description: "No automation commands found in JS file", variant: "destructive" });
        return;
      }
      
      // Create template and save to localStorage
      const template: FlowDefinition = {
        meta: { name: fileName.replace('.js', ''), version: "1.0" },
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.data.kind,
          position: n.position,
          data: n.data
        })),
        edges
      };
      
      const templateName = fileName.replace('.js', '');
      
      // Save to localStorage
      templateManager.addCustomTemplate(templateName, template);
      
      // Update templates list
      const allTemplates = await templateManager.getAllTemplates();
      setTemplates(allTemplates);
      
      // Load the template to canvas
      setNodes(nodes);
      setEdges(edges);
      setFlowName(templateName);
      
      toast({ 
        title: "Success", 
        description: `Imported ${nodes.length} nodes from JavaScript file and saved as template "${templateName}"` 
      });
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ title: "Error", description: error.message || "Failed to parse JavaScript file", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadLocal();
    // Load templates asynchronously
    templateManager.getAllTemplates().then((allTemplates: Record<string, FlowDefinition>) => {
      setTemplates(allTemplates);
    });
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
      // Fallback for older browsers - using clipboard API polyfill
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        // Using the deprecated API as fallback only
        document.execCommand("copy");
      } catch (e) {
        console.error("Failed to copy:", e);
      }
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
  let openLoops = 0; // Track open loops

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
      const text  = d.config?.text ?? "";
      lines.push(`await act.type(page, ${JSON.stringify(xpath)}, ${JSON.stringify(text)});`);
    }
    if (d.kind === "Click") {
      const xpath = d.config?.xpath?.trim() || "";
      const index = d.config?.index;
      const stmt = Number.isFinite(index)
        ? `await act.click(page, ${JSON.stringify(xpath)}, ${Number(index)});`
        : `await act.click(page, ${JSON.stringify(xpath)});`;
      lines.push(stmt);
    }
    if (d.kind === "Select") {
      const xpath = d.config?.xpath?.trim() || "";
      const selectBy = d.config?.selectBy || "text";
      const selectValue = d.config?.selectValue || "";
      const selectIndex = d.config?.selectIndex ?? 0;
      
      if (selectBy === "index") {
        lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { index: ${selectIndex} });`);
      } else if (selectBy === "value") {
        lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { value: ${JSON.stringify(selectValue)} });`);
      } else {
        lines.push(`await act.select(page, ${JSON.stringify(xpath)}, { text: ${JSON.stringify(selectValue)} });`);
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
        lines.push(`await act.scrollToElement(page, ${JSON.stringify(xpath)});`);
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

      if (waitType === "element" && xpath) {
        lines.push(`// Wait for element to appear`);
        lines.push(`await page.waitForSelector("::-p-xpath(${JSON.stringify(xpath)})", { timeout: ${timeout} });`);
        lines.push(`console.log("Element found: ${xpath}");`);
      } else {
        lines.push(`// Wait for ${timeout}ms`);
        lines.push(`await act.pause(${timeout});`);
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
        lines.push(`if (await act.elementExists(page, ${JSON.stringify(xpath)})) {`);
      } else if (condition === "element_not_exists") {
        lines.push(`if (!(await act.elementExists(page, ${JSON.stringify(xpath)}))) {`);
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
      const loopCount = d.config?.loopCount ?? 5;
      const currentIndexName = d.config?.currentIndexName || "i";
      lines.push(`for (let ${currentIndexName} = 0; ${currentIndexName} < ${loopCount}; ${currentIndexName}++) {`);
      lines.push(`  console.log("Loop iteration:", ${currentIndexName} + 1);`);
      openLoops++;
    }
    if (d.kind === "EndLoop") {
      if (openLoops > 0) {
        lines.push(`}`); // Close the loop
        openLoops--;
      }
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
        lines.push(`while (await act.elementExists(page, ${JSON.stringify(xpath)})) {`);
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
      const extractType = d.config?.extractType || "text";
      const variableName = d.config?.variableName || "extractedData";
      const attribute = d.config?.attribute || "";

      if (extractType === "text") {
        lines.push(`// Extract text content from element`);
        lines.push(`const ${variableName} = await act.getText(page, ${JSON.stringify(xpath)});`);
        lines.push(`console.log("Extracted text into '${variableName}':", ${variableName});`);
      } else {
        lines.push(`// Extract attribute '${attribute}' from element`);
        lines.push(`const ${variableName} = await act.getAttribute(page, ${JSON.stringify(xpath)}, ${JSON.stringify(attribute)});`);
        lines.push(`console.log("Extracted attribute into '${variableName}':", ${variableName});`);
      }
    }
    if (d.kind === "DataProcess") {
      const processType = d.config?.processType || "assignVariable";
      const targetVariable = d.config?.targetVariable || "processedData";
      const sourceVariable = d.config?.sourceVariable || "extractedData";

      if (processType === "assignVariable") {
        lines.push(`// Assign variable from ${sourceVariable} to ${targetVariable}`);
        lines.push(`const ${targetVariable} = ${sourceVariable};`);
        lines.push(`console.log("Assigned '${targetVariable}':", ${targetVariable});`);
      } else if (processType === "processText") {
        const operation = d.config?.operation || "trim";
        lines.push(`// Process text with ${operation}`);
        if (operation === "trim") {
          lines.push(`const ${targetVariable} = ${sourceVariable}.trim();`);
        } else if (operation === "uppercase") {
          lines.push(`const ${targetVariable} = ${sourceVariable}.toUpperCase();`);
        } else if (operation === "lowercase") {
          lines.push(`const ${targetVariable} = ${sourceVariable}.toLowerCase();`);
        }
        lines.push(`console.log("Processed '${targetVariable}':", ${targetVariable});`);
      } else if (processType === "concat") {
        const additionalText = d.config?.additionalText || "";
        lines.push(`// Concatenate variables/text`);
        lines.push(`const ${targetVariable} = ${sourceVariable} + " ${additionalText}";`);
        lines.push(`console.log("Concatenated '${targetVariable}':", ${targetVariable});`);
      }
    }
    if (d.kind === "Log") {
      const logLevel = d.config?.logLevel || "info";
      const messageType = d.config?.messageType || "text";
      const message = d.config?.message || "";
      const variableName = d.config?.variableName || "";

      let logContent;
      if (messageType === "variable") {
        // Log a variable directly
        logContent = variableName;
      } else if (messageType === "template") {
        // Template with variable interpolation
        logContent = `\`${message.replace(/\${/g, '${')}\``;
      } else {
        // Static text
        logContent = JSON.stringify(message);
      }

      if (logLevel === "error") {
        lines.push(`console.error(${messageType === "variable" ? `"${variableName}:", ${logContent}` : logContent});`);
      } else if (logLevel === "warn") {
        lines.push(`console.warn(${messageType === "variable" ? `"${variableName}:", ${logContent}` : logContent});`);
      } else if (logLevel === "debug") {
        lines.push(`console.debug(${messageType === "variable" ? `"${variableName}:", ${logContent}` : logContent});`);
      } else {
        lines.push(`console.log(${messageType === "variable" ? `"${variableName}:", ${logContent}` : logContent});`);
      }
    }
    if (d.kind === "HttpRequest") {
      const method = d.config?.method || "POST";
      const endpoint = d.config?.endpoint || "";
      const headers = d.config?.headers || {};
      const body = d.config?.body || {};
      const authType = d.config?.authType || "none";
      const authToken = d.config?.authToken || "";
      const apiKeyHeader = d.config?.apiKeyHeader || "";
      const apiKeyValue = d.config?.apiKeyValue || "";
      const responseVariable = d.config?.responseVariable || "httpResponse";
      const timeout = d.config?.timeout || 30000;

      lines.push(`// HTTP Request to ${endpoint}`);
      lines.push(`const ${responseVariable} = await (async () => {`);
      lines.push(`  const axios = (await import('axios')).default;`);
      lines.push(`  const requestConfig = {`);
      lines.push(`    method: ${JSON.stringify(method)},`);
      lines.push(`    url: ${JSON.stringify(endpoint)},`);
      lines.push(`    timeout: ${timeout},`);
      lines.push(`    headers: {`);
      lines.push(`      'Content-Type': 'application/json',`);

      // Add authentication headers
      if (authType === "bearer" && authToken) {
        // Check if authToken already includes "Bearer" prefix
        const bearerToken = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
        lines.push(`      'Authorization': '${bearerToken}',`);
      } else if (authType === "apiKey" && apiKeyHeader && apiKeyValue) {
        lines.push(`      '${apiKeyHeader}': '${apiKeyValue}',`);
      }

      // Add custom headers
      Object.entries(headers).forEach(([key, value]) => {
        lines.push(`      '${key}': '${value}',`);
      });

      lines.push(`    },`);

      // Add body for POST, PUT, PATCH requests
      if (["POST", "PUT", "PATCH"].includes(method)) {
        // Check if body contains variable references like ${variableName}
        const bodyStr = JSON.stringify(body, null, 2);
        if (bodyStr.includes('${')) {
          // Parse body to inject variables - safer approach
          lines.push(`    data: (() => {`);
          lines.push(`      // Create template`);
          lines.push(`      let bodyTemplate = ${bodyStr};`);
          lines.push(`      `);
          lines.push(`      // Recursively process the body to replace variables`);
          lines.push(`      const processValue = (obj) => {`);
          lines.push(`        if (typeof obj === 'string') {`);
          lines.push(`          // Replace \${variableName} with actual values`);
          lines.push(`          return obj.replace(/\\$\\{(\\w+)\\}/g, (match, varName) => {`);
          lines.push(`            try {`);
          lines.push(`              const value = eval(varName);`);
          lines.push(`              if (typeof value === 'string') {`);
          lines.push(`                // Clean text: remove newlines, tabs, quotes`);
          lines.push(`                return value`);
          lines.push(`                  .replace(/\\n/g, ' ')`);
          lines.push(`                  .replace(/\\r/g, '')`);
          lines.push(`                  .replace(/\\t/g, ' ')`);
          lines.push(`                  .replace(/\\s+/g, ' ')`);
          lines.push(`                  .trim();`);
          lines.push(`              }`);
          lines.push(`              return value;`);
          lines.push(`            } catch (e) {`);
          lines.push(`              console.warn(\`Variable \${varName} not found\`);`);
          lines.push(`              return '';`);
          lines.push(`            }`);
          lines.push(`          });`);
          lines.push(`        } else if (Array.isArray(obj)) {`);
          lines.push(`          return obj.map(processValue);`);
          lines.push(`        } else if (obj && typeof obj === 'object') {`);
          lines.push(`          const result = {};`);
          lines.push(`          for (const key in obj) {`);
          lines.push(`            result[key] = processValue(obj[key]);`);
          lines.push(`          }`);
          lines.push(`          return result;`);
          lines.push(`        }`);
          lines.push(`        return obj;`);
          lines.push(`      };`);
          lines.push(`      `);
          lines.push(`      return processValue(bodyTemplate);`);
          lines.push(`    })()`);
        } else {
          lines.push(`    data: ${bodyStr}`);
        }
      }

      lines.push(`  };`);
      lines.push(`  `);
      lines.push(`  try {`);
      lines.push(`    console.log('Making HTTP ${method} request to:', '${endpoint}');`);
      lines.push(`    const response = await axios(requestConfig);`);
      lines.push(`    console.log('Response status:', response.status);`);
      lines.push(`    console.log('Response data:', JSON.stringify(response.data, null, 2));`);
      lines.push(`    return response.data;`);
      lines.push(`  } catch (error) {`);
      lines.push(`    console.error('HTTP Request failed:', error.message);`);
      lines.push(`    if (error.response) {`);
      lines.push(`      console.error('Response status:', error.response.status);`);
      lines.push(`      console.error('Response data:', error.response.data);`);
      lines.push(`    }`);
      lines.push(`    throw error;`);
      lines.push(`  }`);
      lines.push(`})();`);
      lines.push(`console.log('Response stored in variable: ${responseVariable}');`);
    }
  }

  // Auto-close any open loops
  while (openLoops > 0) {
    lines.push(`}`);
    openLoops--;
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Templates
            </h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTemplateDialog(true)}
                className="h-7 w-7 p-0"
                title="Save current flow as template"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Template save dialog */}
          {showTemplateDialog && (
            <div className="mb-3 p-3 border rounded-lg bg-gray-50">
              <input
                className="w-full mb-2 border-2 border-gray-200 rounded px-2 py-1 text-sm"
                placeholder="Template name..."
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveAsTemplate} className="flex-1">
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowTemplateDialog(false);
                    setTemplateNameInput("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {/* Custom Templates (saved in localStorage) */}
            {Object.keys(templates).filter(t => !t.startsWith("Basic:") && !t.startsWith("X (Twitter)")).length > 0 && (
              <>
                <div className="text-xs text-gray-500 font-medium mb-1">My Templates</div>
                {Object.keys(templates).filter(t => !t.startsWith("Basic:") && !t.startsWith("X (Twitter)")).map((t) => (
                  <div key={t} className="flex items-center gap-1 group hover:bg-gray-50 rounded px-1">
                    <Button
                      className="flex-1 justify-start text-xs"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(t)}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      {t}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete template "${t}"?`)) {
                          deleteTemplate(t);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      title="Delete template"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </>
            )}
            
            {/* Default Templates */}
            <div className="text-xs text-gray-500 font-medium mt-2 mb-1">Default Templates</div>
            {Object.keys(templates).filter(t => t.startsWith("Basic:") || t.startsWith("X (Twitter)")).map((t) => (
              <div key={t} className="flex items-center gap-1">
                <Button
                  className="flex-1 justify-start text-xs"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate(t)}
                >
                  <Play className="w-3 h-3 mr-2" />
                  {t.replace("Basic: ", "").replace("X (Twitter) ", "")}
                </Button>
              </div>
            ))}
            
            {Object.keys(templates).filter(t => !t.startsWith("Basic:") && !t.startsWith("X (Twitter)")).length === 0 && (
              <div className="text-xs text-gray-400 italic mt-2 p-2 bg-gray-50 rounded">
                No custom templates yet. Click + to save current flow as template.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          {/* Template editing UI - Shows when editing a custom template */}
          {currentTemplateName && !currentTemplateName.startsWith("Basic:") && !currentTemplateName.startsWith("X (Twitter)") && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="text-xs text-blue-700 font-medium mb-2">Editing Template</div>
              {/* Input for renaming template - User can change template name here */}
              <input
                className="w-full border-2 border-blue-200 rounded px-2 py-1 text-sm font-medium
                         focus:border-blue-400 focus:outline-none transition-colors bg-white"
                value={currentTemplateName}
                onChange={(e) => setCurrentTemplateName(e.target.value)}
                placeholder="Template name..."
              />
              <div className="text-xs text-blue-600">
                Rename template by editing above, then click Save to apply changes
              </div>
            </div>
          )}
          
          {/* REMOVED: Flow Name input and New Flow button as requested by user */}
          {/* Users should manage flows through the template system */}
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={saveLocal} className="w-full" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button 
              onClick={() => {
                // Create file input dynamically
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.js';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const event = e as React.ChangeEvent<HTMLInputElement>;
                    importTemplateFile(event);
                  } else {
                    // If no file selected, try loading from localStorage
                    loadLocal();
                  }
                };
                input.click();
              }}
              variant="outline" 
              className="w-full" 
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Load
            </Button>
          </div>
          
          <Button onClick={exportJS} variant="secondary" className="w-full" size="sm">
            <Code className="w-4 h-4 mr-2" />
            Export JS
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
                    {(selectedNode.data as NodeData).kind === "Sleep" && <Moon className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "If" && <Navigation className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Loop" && <Repeat className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "EndLoop" && <Repeat className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Extract" && <Database className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "DataProcess" && <Database className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "Log" && <FileText className="w-4 h-4" />}
                    {(selectedNode.data as NodeData).kind === "HttpRequest" && <Send className="w-4 h-4" />}
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
                          Number of Iterations
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="5"
                          min="1"
                          max="1000"
                          value={(selectedNode.data as NodeData).config?.loopCount ?? 5}
                          onChange={(e) =>
                            patchSelectedConfig({ loopCount: Number(e.target.value) })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The actions connected after this node will be repeated this many times
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Index Variable Name
                          <span className="text-xs text-gray-400 ml-2">(Optional)</span>
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="i"
                          value={(selectedNode.data as NodeData).config?.currentIndexName || "i"}
                          onChange={(e) =>
                            patchSelectedConfig({ currentIndexName: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variable name to access the current iteration index (starts from 0)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sleep */}
                  {(selectedNode.data as NodeData).kind === "Sleep" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Sleep Duration (ms)
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="3000"
                          min="100"
                          max="60000"
                          value={(selectedNode.data as NodeData).config?.timeout ?? 3000}
                          onChange={(e) =>
                            patchSelectedConfig({ timeout: Number(e.target.value) })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Pause execution for this many milliseconds (1000ms = 1 second)
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 mb-1">💡 Perfect for Testing</p>
                        <p className="text-xs text-purple-700">
                          Use Sleep to pause and manually inspect browser results. Great for debugging automation flows!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* EndLoop */}
                  {(selectedNode.data as NodeData).kind === "EndLoop" && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium mb-1">Loop End Node</p>
                        <p className="text-xs">This node marks the end of a loop block. Connect it after all the actions you want to repeat.</p>
                        <p className="text-xs mt-2">Usage: Loop Start → Actions → Loop End</p>
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
                        <p className="text-xs text-gray-500 mt-1">
                          XPath to extract data from
                        </p>
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
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Variable Name
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="extractedData"
                          value={(selectedNode.data as NodeData).config?.variableName || "extractedData"}
                          onChange={(e) =>
                            patchSelectedConfig({ variableName: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Store extracted value in this variable
                        </p>
                      </div>
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
                          value={(selectedNode.data as NodeData).config?.processType || "assignVariable"}
                          onChange={(e) =>
                            patchSelectedConfig({ processType: e.target.value })
                          }
                        >
                          <option value="assignVariable">Assign Variable</option>
                          <option value="processText">Process Text</option>
                          <option value="concat">Concatenate</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Source Variable
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="extractedData"
                          value={(selectedNode.data as NodeData).config?.sourceVariable || "extractedData"}
                          onChange={(e) =>
                            patchSelectedConfig({ sourceVariable: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variable to process (from Extract or other nodes)
                        </p>
                      </div>

                      {(selectedNode.data as NodeData).config?.processType === "processText" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Text Operation
                          </label>
                          <select
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            value={(selectedNode.data as NodeData).config?.operation || "trim"}
                            onChange={(e) =>
                              patchSelectedConfig({ operation: e.target.value })
                            }
                          >
                            <option value="trim">Trim Whitespace</option>
                            <option value="uppercase">To Uppercase</option>
                            <option value="lowercase">To Lowercase</option>
                          </select>
                        </div>
                      )}

                      {(selectedNode.data as NodeData).config?.processType === "concat" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Additional Text
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Text to append"
                            value={(selectedNode.data as NodeData).config?.additionalText || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ additionalText: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Text to concatenate with source variable
                          </p>
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
                          Message Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.messageType || "text"}
                          onChange={(e) =>
                            patchSelectedConfig({ messageType: e.target.value })
                          }
                        >
                          <option value="text">Static Text</option>
                          <option value="variable">Variable</option>
                          <option value="template">Template</option>
                        </select>
                      </div>

                      {(selectedNode.data as NodeData).config?.messageType === "variable" ? (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Variable Name
                          </label>
                          <input
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="extractedData, processedData, or httpResponse"
                            value={(selectedNode.data as NodeData).config?.variableName || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ variableName: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Name of variable to log (from Extract, Process, or HTTP nodes)
                          </p>
                        </div>
                      ) : (selectedNode.data as NodeData).config?.messageType === "template" ? (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Template Message
                          </label>
                          <textarea
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors resize-none font-mono text-sm"
                            rows={3}
                            placeholder="Extracted: ${extractedData}, Response: ${httpResponse}"
                            value={(selectedNode.data as NodeData).config?.message || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ message: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use ${`{variableName}`} to insert variables in your message
                          </p>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  )}

                  {/* HTTP Request */}
                  {(selectedNode.data as NodeData).kind === "HttpRequest" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Method
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.method || "POST"}
                          onChange={(e) =>
                            patchSelectedConfig({ method: e.target.value })
                          }
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Endpoint URL
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors text-sm"
                          placeholder="https://api.example.com/endpoint"
                          value={(selectedNode.data as NodeData).config?.endpoint || ""}
                          onChange={(e) =>
                            patchSelectedConfig({ endpoint: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Full URL including https://
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Authentication Type
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          value={(selectedNode.data as NodeData).config?.authType || "none"}
                          onChange={(e) =>
                            patchSelectedConfig({ authType: e.target.value })
                          }
                        >
                          <option value="none">None</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="apiKey">API Key</option>
                        </select>
                      </div>

                      {(selectedNode.data as NodeData).config?.authType === "bearer" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Bearer Token
                          </label>
                          <input
                            type="password"
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                     focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="your-bearer-token"
                            value={(selectedNode.data as NodeData).config?.authToken || ""}
                            onChange={(e) =>
                              patchSelectedConfig({ authToken: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter token only (without "Bearer" prefix)
                          </p>
                        </div>
                      )}

                      {(selectedNode.data as NodeData).config?.authType === "apiKey" && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              API Key Header Name
                            </label>
                            <input
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                       focus:border-blue-400 focus:outline-none transition-colors"
                              placeholder="X-API-Key"
                              value={(selectedNode.data as NodeData).config?.apiKeyHeader || ""}
                              onChange={(e) =>
                                patchSelectedConfig({ apiKeyHeader: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              API Key Value
                            </label>
                            <input
                              type="password"
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                       focus:border-blue-400 focus:outline-none transition-colors font-mono text-sm"
                              placeholder="your-api-key"
                              value={(selectedNode.data as NodeData).config?.apiKeyValue || ""}
                              onChange={(e) =>
                                patchSelectedConfig({ apiKeyValue: e.target.value })
                              }
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Request Body (JSON)
                        </label>
                        <textarea
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors resize-none font-mono text-xs"
                          rows={8}
                          placeholder='{"key": "value", "text": "${extractedData}"}'
                          value={typeof (selectedNode.data as NodeData).config?.body === 'object'
                            ? JSON.stringify((selectedNode.data as NodeData).config?.body, null, 2)
                            : (selectedNode.data as NodeData).config?.body || ""}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              patchSelectedConfig({ body: parsed });
                            } catch {
                              patchSelectedConfig({ body: e.target.value });
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use ${`{variableName}`} to inject variables from Extract/Process nodes
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Response Variable Name
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="apiResponse"
                          value={(selectedNode.data as NodeData).config?.responseVariable || "apiResponse"}
                          onChange={(e) =>
                            patchSelectedConfig({ responseVariable: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variable to store the response for use in other nodes
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Timeout (ms)
                        </label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="30000"
                          min="1000"
                          value={(selectedNode.data as NodeData).config?.timeout || 30000}
                          onChange={(e) =>
                            patchSelectedConfig({ timeout: Number(e.target.value) })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Request timeout in milliseconds
                        </p>
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
