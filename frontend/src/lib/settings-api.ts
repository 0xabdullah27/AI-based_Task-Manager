import { apiClient } from "@/lib/api-client";

export interface LLMSettings {
  use_custom_llm: boolean;
  llm_provider: string | null;
  llm_model: string | null;
  has_api_key: boolean;
  llm_base_url: string | null;
}

export interface LLMSettingsUpdate {
  use_custom_llm: boolean;
  llm_provider?: string | null;
  llm_model?: string | null;
  llm_api_key?: string | null;
  llm_base_url?: string | null;
}

export const getLLMSettings = async (): Promise<LLMSettings> => {
  const response = await apiClient.get("/api/settings/llm");
  return response.data;
};

export const updateLLMSettings = async (data: LLMSettingsUpdate): Promise<LLMSettings> => {
  const response = await apiClient.put("/api/settings/llm", data);
  return response.data;
};
