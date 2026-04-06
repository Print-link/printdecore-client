import type { Artwork, ArtworkWithBranch } from "../types/artwork";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const artworkApi = {
  /** List all artworks (public, with optional filters) */
  async getAll(params?: {
    branchId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    count: number;
    total: number;
    data: ArtworkWithBranch[];
  }> {
    const qs = new URLSearchParams();
    if (params?.branchId) qs.set("branchId", params.branchId);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));

    const res = await fetch(`${BASE_URL}/artworks?${qs.toString()}`);
    return res.json();
  },

  /** Get single artwork by ID */
  async getById(
    id: string
  ): Promise<{ success: boolean; data: ArtworkWithBranch }> {
    const res = await fetch(`${BASE_URL}/artworks/${id}`);
    return res.json();
  },

  /** Get artworks for a specific branch */
  async getByBranch(
    branchId: string
  ): Promise<{ success: boolean; count: number; data: Artwork[] }> {
    const res = await fetch(`${BASE_URL}/artworks/branch/${branchId}`);
    return res.json();
  },

  /** Create artwork (authenticated) */
  async create(formData: FormData): Promise<{ success: boolean; data: Artwork }> {
    const res = await fetch(`${BASE_URL}/artworks`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    return res.json();
  },

  /** Update artwork (authenticated) */
  async update(
    id: string,
    formData: FormData
  ): Promise<{ success: boolean; data: Artwork }> {
    const res = await fetch(`${BASE_URL}/artworks/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: formData,
    });
    return res.json();
  },

  /** Delete artwork (authenticated) */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/artworks/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });
    return res.json();
  },
};
