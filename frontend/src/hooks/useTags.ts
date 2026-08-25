/**
 * useTags - Custom hook for tag management
 * Spec: 002-todo-organization-features
 * Task: T055
 */

import { useState, useCallback } from "react";
import type { Tag } from "@/types/task";
import api from "@/middleware/api-interceptor";

interface UseTagsReturn {
  tags: Tag[];
  isLoading: boolean;
  error: Error | null;
  fetchTags: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<{ tags: Tag[] }>("/api/tags/");
      setTags(response.data.tags);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch tags");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
  };
}
