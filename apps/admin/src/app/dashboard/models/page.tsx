"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@whalli/ui";
import { Cpu, Sparkles } from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  minSubscription: string;
  contextWindow: number;
  pricing: {
    input: number;
    output: number;
  };
}

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalModels: 0,
    providers: 0,
    avgContextWindow: 0,
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      // Mock data - replace with actual API call to /api/chat/models
      const mockModels: AIModel[] = [
        {
          id: "gpt-4-turbo",
          name: "GPT-4 Turbo",
          provider: "OpenAI",
          description: "Most capable GPT-4 model with 128K context",
          minSubscription: "PRO",
          contextWindow: 128000,
          pricing: { input: 0.01, output: 0.03 },
        },
        {
          id: "gpt-4",
          name: "GPT-4",
          provider: "OpenAI",
          description: "Original GPT-4 model with 8K context",
          minSubscription: "PRO",
          contextWindow: 8192,
          pricing: { input: 0.03, output: 0.06 },
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          provider: "OpenAI",
          description: "Fast and cost-effective model",
          minSubscription: "BASIC",
          contextWindow: 16384,
          pricing: { input: 0.0005, output: 0.0015 },
        },
        {
          id: "claude-3-opus",
          name: "Claude 3 Opus",
          provider: "Anthropic",
          description: "Most powerful Claude model",
          minSubscription: "ENTERPRISE",
          contextWindow: 200000,
          pricing: { input: 0.015, output: 0.075 },
        },
        {
          id: "claude-3-sonnet",
          name: "Claude 3 Sonnet",
          provider: "Anthropic",
          description: "Balanced performance and cost",
          minSubscription: "PRO",
          contextWindow: 200000,
          pricing: { input: 0.003, output: 0.015 },
        },
        {
          id: "claude-3-haiku",
          name: "Claude 3 Haiku",
          provider: "Anthropic",
          description: "Fast and lightweight",
          minSubscription: "BASIC",
          contextWindow: 200000,
          pricing: { input: 0.00025, output: 0.00125 },
        },
        {
          id: "grok-2",
          name: "Grok 2",
          provider: "xAI",
          description: "Latest Grok model with real-time knowledge",
          minSubscription: "ENTERPRISE",
          contextWindow: 131072,
          pricing: { input: 0.02, output: 0.1 },
        },
        {
          id: "grok-2-mini",
          name: "Grok 2 Mini",
          provider: "xAI",
          description: "Compact version of Grok 2",
          minSubscription: "PRO",
          contextWindow: 131072,
          pricing: { input: 0.002, output: 0.01 },
        },
        {
          id: "gemini-pro",
          name: "Gemini Pro",
          provider: "Google",
          description: "Google's advanced AI model",
          minSubscription: "PRO",
          contextWindow: 32768,
          pricing: { input: 0.0005, output: 0.0015 },
        },
        {
          id: "llama-3-70b",
          name: "Llama 3 70B",
          provider: "Meta",
          description: "Open-source large language model",
          minSubscription: "PRO",
          contextWindow: 8192,
          pricing: { input: 0.0007, output: 0.0009 },
        },
      ];

      setModels(mockModels);

      // Calculate stats
      const uniqueProviders = new Set(mockModels.map((m) => m.provider)).size;
      const avgContext =
        mockModels.reduce((sum, m) => sum + m.contextWindow, 0) /
        mockModels.length;

      setStats({
        totalModels: mockModels.length,
        providers: uniqueProviders,
        avgContextWindow: Math.round(avgContext),
      });
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadgeVariant = (sub: string) => {
    switch (sub?.toUpperCase()) {
      case "ENTERPRISE":
        return "default";
      case "PRO":
        return "secondary";
      case "BASIC":
        return "outline";
      default:
        return "outline";
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      OpenAI: "text-green-600",
      Anthropic: "text-orange-600",
      xAI: "text-blue-600",
      Google: "text-red-600",
      Meta: "text-purple-600",
      Mistral: "text-yellow-600",
      Cohere: "text-pink-600",
    };
    return colors[provider] || "text-gray-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Models</h1>
          <p className="text-muted-foreground">
            Available AI models across all providers
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Models
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModels}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.providers} providers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Providers
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.providers}</div>
              <p className="text-xs text-muted-foreground">
                OpenAI, Anthropic, xAI, etc.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Context Window
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.avgContextWindow / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">
                tokens on average
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Min Plan</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Pricing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading models...
                  </TableCell>
                </TableRow>
              ) : models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No models found
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">
                      {model.name}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getProviderColor(model.provider)}`}>
                        {model.provider}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {model.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getSubscriptionBadgeVariant(
                          model.minSubscription
                        )}
                      >
                        {model.minSubscription}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(model.contextWindow / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>In: ${model.pricing.input}/1K</div>
                      <div>Out: ${model.pricing.output}/1K</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
