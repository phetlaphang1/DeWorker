import { FlowDefinition } from "../../../client/src/components/automation/types";

// Import all template files
const templateModules: Record<string, () => Promise<{template: FlowDefinition}>> = {
  "Basic: Google Search (GoTo → Type → Click)": () => import("./google-search.js") as any,
  "Form Fill with Select & Scroll": () => import("./form-fill.js") as any,
  "Data Extraction with Loop": () => import("./data-extraction-loop.js") as any,
  "Multi-Tab Navigation": () => import("./multi-tab-navigation.js") as any,
  "Conditional Flow with If/Else": () => import("./conditional-flow.js") as any,
  "Frame Handling": () => import("./frame-handling.js") as any,
  "X (Twitter) Login": () => import("./twitter-login.js") as any,
  "X (Twitter) Seeding - Like & Retweet": () => import("./twitter-seeding.js") as any,
  "X (Twitter) Follow Users": () => import("./twitter-follow.js") as any,
  "X (Twitter) Post Tweet": () => import("./twitter-post.js") as any,
  "X (Twitter) Search & Interact": () => import("./twitter-search.js") as any,
};

// Default templates loaded from files
export const TEMPLATES: Record<string, FlowDefinition> = {};

// Load templates dynamically
export async function loadDefaultTemplates(): Promise<Record<string, FlowDefinition>> {
  const loadedTemplates: Record<string, FlowDefinition> = {};
  
  for (const [name, loader] of Object.entries(templateModules)) {
    try {
      const module = await loader();
      if (module.template) {
        loadedTemplates[name] = module.template;
      }
    } catch (error) {
      console.error(`Failed to load template ${name}:`, error);
    }
  }
  
  // Update TEMPLATES object
  Object.assign(TEMPLATES, loadedTemplates);
  return loadedTemplates;
}

// For backward compatibility - load templates synchronously if needed
// This will be empty initially and populated when loadDefaultTemplates is called
export function getTemplatesSync(): Record<string, FlowDefinition> {
  return TEMPLATES;
}