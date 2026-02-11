import type { DomRefs } from "./types.js";

export const dom: DomRefs = {
  loadingContainer: document.getElementById("loadingContainer") as HTMLElement,
  emptyContainer: document.getElementById("emptyContainer") as HTMLElement,
  tableContainer: document.getElementById("tableContainer") as HTMLElement,
  secretsTable: document.getElementById("secretsTable") as HTMLElement,
  searchInput: document.getElementById("searchInput") as HTMLInputElement,
  statusFilter: document.getElementById("statusFilter") as HTMLSelectElement,
  createBtn: document.getElementById("createBtn") as HTMLButtonElement,
  refreshBtn: document.getElementById("refreshBtn") as HTMLButtonElement,
  prevBtn: document.getElementById("prevBtn") as HTMLButtonElement,
  nextBtn: document.getElementById("nextBtn") as HTMLButtonElement,
  pageInfo: document.getElementById("pageInfo") as HTMLElement,
  totalInfo: document.getElementById("totalInfo") as HTMLElement,
  messageContainer: document.getElementById("messageContainer") as HTMLElement,
};
