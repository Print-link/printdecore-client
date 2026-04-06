import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ImageBroken,
  SpinnerGap,
} from "@phosphor-icons/react";
import { artworkApi } from "../services/artworkApi";
import type { Artwork } from "../types/artwork";

interface BranchArtworksTabProps {
  branchId: string;
}

export const BranchArtworksTab = ({ branchId }: BranchArtworksTabProps) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["branchArtworks", branchId],
    queryFn: () => artworkApi.getByBranch(branchId),
    enabled: !!branchId,
  });

  const artworks = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerGap
          size={32}
          className="text-[#fbbf24] animate-spin"
        />
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ImageBroken
            size={28}
            weight="duotone"
            className="text-gray-400"
          />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          No artworks yet
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This branch hasn't posted any artworks
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-2 md:columns-3 gap-3 sm:gap-4">
      {artworks.map((art) => (
        <div key={art.id} className="mb-3 sm:mb-4 break-inside-avoid">
          <BranchArtworkCard
            art={art}
            onClick={() => navigate(`/home/artworks/${art.id}`)}
          />
        </div>
      ))}
    </div>
  );
};

const BranchArtworkCard = ({
  art,
  onClick,
}: {
  art: Artwork;
  onClick: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasMultiple = art.images.length > 1;
  const thumbnail = art.images[0];

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-[#fbbf24]/50 dark:hover:border-[#fbbf24]/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-100/20 dark:hover:shadow-amber-900/10">
        {/* Image */}
        <div className="relative overflow-hidden">
          {thumbnail ? (
            <>
              {!imageLoaded && (
                <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-800 animate-pulse" />
              )}
              <img
                src={thumbnail}
                alt={art.title}
                onLoad={() => setImageLoaded(true)}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  imageLoaded ? "block" : "hidden"
                }`}
              />
            </>
          ) : (
            <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ImageBroken size={32} className="text-gray-300" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Multi-image badge */}
          {hasMultiple && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/50 backdrop-blur-sm rounded-md sm:rounded-lg">
              <span className="text-[10px] sm:text-xs font-bold text-white">
                1/{art.images.length}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">
            {art.title}
          </h3>
          {art.description && (
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
              {art.description}
            </p>
          )}

          {/* Tags */}
          {art.tags.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {art.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-500 dark:text-gray-400 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {art.tags.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-400 rounded-md">
                  +{art.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
