export interface Artwork {
  id: string;
  branchId: string;
  title: string;
  description: string | null;
  tags: string[];
  images: string[];
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtworkWithBranch extends Artwork {
  branchName: string;
  branchLocation: string | null;
  branchAvatar: string | null;
}
