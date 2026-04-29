import type { AxiosInstance } from "axios";

export const api: AxiosInstance;
export function getToken(): string;
export function getWorkspaceId(): string;
export function setWorkspaceId(workspaceId: string): void;
export function setToken(token: string): void;

// Keep responses loosely typed; the UI can narrow as needed.
export const API: {
  baseUrl: string;
  auth: {
    register(payload: any): Promise<any>;
    login(payload: any): Promise<any>;
    me(): Promise<any>;
    rotateApiKey(): Promise<any>;
    metaConnectUrl(): Promise<any>;
    metaSave(payload: any): Promise<any>;
  };
  workspaces: {
    list(): Promise<any>;
    create(payload: any): Promise<any>;
  };
  credentials: {
    getWhatsApp(): Promise<any>;
    upsertWhatsApp(payload: any): Promise<any>;
    deleteWhatsApp(): Promise<any>;
  };
  templates: {
    list(params?: any): Promise<any>;
    create(payload: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, payload: any): Promise<any>;
    remove(id: string): Promise<any>;
    submit(id: string): Promise<any>;
    status(id: string): Promise<any>;
    syncMeta(payload?: any): Promise<any>;
  };
  messages: {
    send(payload: any): Promise<any>;
    bulk(payload: any): Promise<any>;
    logs(params?: any): Promise<any>;
    byPhone(phone: string, params?: any): Promise<any>;
  };
  analytics: {
    overview(): Promise<any>;
    template(id: string): Promise<any>;
  };
  meta: {
    status(): Promise<any>;
    save(payload: any): Promise<any>;
  };
  links: {
    create(payload: any): Promise<any>;
  };
  wallet: {
    get(): Promise<any>;
    createRechargeOrder(payload: any): Promise<any>;
  };
  campaigns: {
    list(params?: any): Promise<any>;
    create(payload: any): Promise<any>;
  };
  conversations: {
    list(params?: any): Promise<any>;
    get(phone: string): Promise<any>;
    read(phone: string): Promise<any>;
  };
  contacts: {
    list(params?: any): Promise<any>;
    get(id: string): Promise<any>;
    lookupByPhone(phone: string): Promise<any>;
    create(payload: any): Promise<any>;
    update(id: string, payload: any): Promise<any>;
    remove(id: string): Promise<any>;
  };
  automation: {
    triggerEvent(payload: any): Promise<any>;
  };
};
