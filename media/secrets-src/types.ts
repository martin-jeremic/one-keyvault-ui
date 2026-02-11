export type SortField = "name" | "status" | "created" | "updated";
export type SortDirection = "asc" | "desc";
export type StatusFilter = "all" | "enabled" | "disabled";

export interface Secret {
  name: string;
  value: string;
  enabled: boolean;
  id?: string;
  created?: string | Date | null;
  updated?: string | Date | null;
  notBefore?: string | Date | null;
  expiresOn?: string | Date | null;
  tags?: Record<string, string>;
}

export interface Draft {
  notBefore: string | null;
  expiresOn: string | null;
  tags: Record<string, string>;
}

export interface State {
  currentPage: number;
  pageSize: number;
  totalSecrets: number;
  allSecrets: Secret[];
  sortField: SortField;
  sortDirection: SortDirection;
  statusFilter: StatusFilter;
  expandedSecretName: string | null;
  editsBySecretName: Record<string, Draft>;
  vaultUrl: string;
}

export interface DomRefs {
  loadingContainer: HTMLElement;
  emptyContainer: HTMLElement;
  tableContainer: HTMLElement;
  secretsTable: HTMLElement;
  searchInput: HTMLInputElement;
  statusFilter: HTMLSelectElement;
  createBtn: HTMLButtonElement;
  refreshBtn: HTMLButtonElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  pageInfo: HTMLElement;
  totalInfo: HTMLElement;
  messageContainer: HTMLElement;
}

export interface WebviewState {
  vaultUrl?: string;
}

export interface TemplateUris {
  secretRow: string;
  detailsRow: string;
  tagRow: string;
}

export interface SecretPropertiesUpdate {
  notBefore?: string | null;
  expiresOn?: string | null;
  tags?: Record<string, string>;
}

export interface DetailsState {
  notBefore: string | null;
  expiresOn: string | null;
  tags: Record<string, string>;
}

export interface TemplateRowData {
  encodedName: string;
  escapedName: string;
  enabledClass: string;
  enabledText: string;
  enabledValue: string;
  createdDate: string;
  updatedDate: string;
}

export interface TemplateDetailsData {
  encodedName: string;
  escapedId: string;
  notBeforeValue: string;
  expiresOnValue: string;
  notBeforeChecked: boolean;
  expiresOnChecked: boolean;
  tags: Record<string, string>;
}
