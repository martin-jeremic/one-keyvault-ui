import type { State } from "./types.js";

const initial = window.__ONE_KEYVAULT_STATE__ || {};

export const state: State = {
  currentPage: 0,
  pageSize: 10,
  totalSecrets: 0,
  allSecrets: [],
  sortField: "name",
  sortDirection: "asc",
  statusFilter: "all",
  expandedSecretName: null,
  editsBySecretName: {},
  vaultUrl: initial.vaultUrl || "",
};
