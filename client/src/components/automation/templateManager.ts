import { FlowDefinition } from "./types";
import { TEMPLATES as DEFAULT_TEMPLATES } from "./templates";

const CUSTOM_TEMPLATES_KEY = "automation:custom_templates";

export class TemplateManager {
  private static instance: TemplateManager;
  private customTemplates: Record<string, FlowDefinition> = {};
  
  private constructor() {
    this.loadCustomTemplates();
  }
  
  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }
  
  private loadCustomTemplates(): void {
    try {
      const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      if (stored) {
        this.customTemplates = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load custom templates:", error);
      this.customTemplates = {};
    }
  }
  
  private saveCustomTemplates(): void {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(this.customTemplates));
    } catch (error) {
      console.error("Failed to save custom templates:", error);
    }
  }
  
  public getAllTemplates(): Record<string, FlowDefinition> {
    return {
      ...DEFAULT_TEMPLATES,
      ...this.customTemplates
    };
  }
  
  public getDefaultTemplates(): Record<string, FlowDefinition> {
    return DEFAULT_TEMPLATES;
  }
  
  public getCustomTemplates(): Record<string, FlowDefinition> {
    return this.customTemplates;
  }
  
  public addCustomTemplate(name: string, template: FlowDefinition): void {
    if (DEFAULT_TEMPLATES[name]) {
      throw new Error(`Cannot overwrite default template: ${name}`);
    }
    this.customTemplates[name] = template;
    this.saveCustomTemplates();
  }
  
  public deleteCustomTemplate(name: string): boolean {
    if (DEFAULT_TEMPLATES[name]) {
      throw new Error(`Cannot delete default template: ${name}`);
    }
    if (this.customTemplates[name]) {
      delete this.customTemplates[name];
      this.saveCustomTemplates();
      return true;
    }
    return false;
  }
  
  public renameCustomTemplate(oldName: string, newName: string): void {
    if (DEFAULT_TEMPLATES[oldName]) {
      throw new Error(`Cannot rename default template: ${oldName}`);
    }
    if (DEFAULT_TEMPLATES[newName] || this.customTemplates[newName]) {
      throw new Error(`Template name already exists: ${newName}`);
    }
    if (this.customTemplates[oldName]) {
      this.customTemplates[newName] = this.customTemplates[oldName];
      delete this.customTemplates[oldName];
      this.saveCustomTemplates();
    }
  }
  
  public isDefaultTemplate(name: string): boolean {
    return !!DEFAULT_TEMPLATES[name];
  }
  
  public exportTemplate(name: string): string | null {
    const template = this.getAllTemplates()[name];
    if (template) {
      return JSON.stringify(template, null, 2);
    }
    return null;
  }
  
  public importTemplate(name: string, jsonString: string): void {
    try {
      const template = JSON.parse(jsonString) as FlowDefinition;
      this.addCustomTemplate(name, template);
    } catch (error) {
      throw new Error(`Invalid template JSON: ${error}`);
    }
  }
}

export const templateManager = TemplateManager.getInstance();