"use client";

import React, { useEffect, useState } from "react";
import { getLLMSettings, updateLLMSettings, LLMSettings } from "@/lib/settings-api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PROVIDERS = [
  { value: "mistral", label: "Mistral AI" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom Endpoint" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [useCustom, setUseCustom] = useState(false);
  const [provider, setProvider] = useState("mistral");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getLLMSettings();
      setSettings(data);
      setUseCustom(data.use_custom_llm);
      setProvider(data.llm_provider || "mistral");
      setModel(data.llm_model || "");
      setApiKey(data.has_api_key ? "********" : "");
      setBaseUrl(data.llm_base_url || "");
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await updateLLMSettings({
        use_custom_llm: useCustom,
        llm_provider: useCustom ? provider : null,
        llm_model: useCustom ? model : null,
        llm_api_key: useCustom ? apiKey : null,
        llm_base_url: useCustom ? baseUrl : null,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error: any) {
      setSaveStatus("error");
      setErrorMessage(error.response?.data?.detail || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">AI Settings</h2>
        <p className="text-muted-foreground">
          Configure how the AI agent operates. You can use the app's default model or bring your own API key.
        </p>
      </div>

      <div className="h-px bg-border my-6" />

      <div className="max-w-2xl space-y-8">
        {/* Toggle Mode */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Bring Your Own Key (BYOK)</Label>
            <p className="text-sm text-muted-foreground">
              Override the workspace default settings and use your own AI provider and API key.
              Your key will be securely encrypted in our database.
            </p>
          </div>
          <Switch
            checked={useCustom}
            onCheckedChange={setUseCustom}
          />
        </div>

        {useCustom && (
          <div className="space-y-6 rounded-lg border p-6 bg-card animate-in fade-in slide-in-from-top-4 duration-300">

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Input */}
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gpt-4o, mistral-large-latest"
              />
              <p className="text-[13px] text-muted-foreground">
                Make sure the model name exactly matches the provider's API.
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-[13px] text-muted-foreground">
                {settings?.has_api_key && apiKey === "********"
                  ? "An API key is already saved and encrypted. Enter a new one to replace it."
                  : "We securely encrypt your API key using AES-256 (Fernet) before storing it."}
              </p>
            </div>

            {/* Custom Base URL (Optional) */}
            <div className="space-y-2">
              <Label>Base URL (Optional)</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                disabled={provider !== "custom"}
              />
              <p className="text-[13px] text-muted-foreground">
                Only needed if you are using an Enterprise proxy or a Custom Endpoint.
              </p>
            </div>

          </div>
        )}

        {/* Save Actions */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </span>
            )}
          </Button>

          {saveStatus === "success" && (
            <p className="text-sm font-medium text-emerald-500 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Settings saved successfully!
            </p>
          )}
        </div>

        {saveStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
