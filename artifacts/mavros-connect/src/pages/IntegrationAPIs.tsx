import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Webhook,
  Plug,
  FileJson,
  Lock,
  Zap,
  BarChart3,
  Code,
} from "lucide-react";
import { authenticatedFetch } from "@/utils/authenticatedFetch";

interface ApiKey {
  id: number;
  keyName: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

interface Webhook {
  id: number;
  url: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  createdAt: string;
}

interface Integration {
  id: number;
  serviceName: string;
  serviceType: string;
  isActive: boolean;
  syncStatus: string;
  lastSyncAt: string;
}

interface WebhookLog {
  id: number;
  eventType: string;
  statusCode: number;
  attempt: number;
  createdAt: string;
}

interface OAuthApp {
  id: number;
  appName: string;
  clientId: string;
  isActive: boolean;
  createdAt: string;
}

interface RateLimit {
  id: number;
  requestsPerSecond: number;
  requestsPerDay: number;
  currentRequestCount: number;
}

interface ApiDoc {
  id: number;
  endpointPath: string;
  method: string;
  description: string;
  createdAt: string;
}

export default function IntegrationAPIs() {
  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/api-keys");
      return response.json();
    },
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/webhooks");
      return response.json();
    },
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/list");
      return response.json();
    },
  });

  const { data: oauthApps = [] } = useQuery({
    queryKey: ["oauth-apps"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/oauth/apps");
      return response.json();
    },
  });

  const { data: rateLimits = [] } = useQuery({
    queryKey: ["rate-limits"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/rate-limits");
      return response.json();
    },
  });

  const { data: apiDocs = [] } = useQuery({
    queryKey: ["api-docs"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/integrations/docs");
      return response.json();
    },
  });

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === "boolean") {
      return status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
    }
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integration & APIs</h1>
        <p className="text-gray-500 mt-2">Webhooks, API keys, OAuth, integrations, and documentation</p>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="keys" className="flex items-center gap-1">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Keys</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1">
            <Webhook className="w-4 h-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1">
            <Plug className="w-4 h-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="oauth" className="flex items-center gap-1">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">OAuth</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Limits</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-1">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
        </TabsList>

        {/* API KEYS TAB */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-gray-500">No API keys found</p>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key: ApiKey) => (
                    <Card key={key.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{key.keyName}</p>
                            <p className="text-xs text-gray-600">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(key.isActive)}>
                            {key.isActive ? "Active" : "Revoked"}
                          </Badge>
                        </div>
                        {key.scopes && key.scopes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((scope: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOKS TAB */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <p className="text-gray-500">No webhooks found</p>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook: Webhook) => (
                    <Card key={webhook.id} className="bg-blue-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm break-all">{webhook.url}</p>
                            <p className="text-xs text-gray-600">
                              Retries: {webhook.retryCount} | Created: {new Date(webhook.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(webhook.isActive)}>
                            {webhook.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {webhook.events && webhook.events.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <p className="text-gray-500">No integrations found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration: Integration) => (
                    <Card key={integration.id} className="bg-purple-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{integration.serviceName}</p>
                              <p className="text-xs text-gray-600">{integration.serviceType}</p>
                            </div>
                            <Badge className={getStatusColor(integration.isActive)}>
                              {integration.isActive ? "Connected" : "Disconnected"}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant="outline" className={`${getStatusColor(integration.syncStatus)} text-xs`}>
                              {integration.syncStatus}
                            </Badge>
                          </div>
                          {integration.lastSyncAt && (
                            <p className="text-xs text-gray-600">
                              Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OAUTH TAB */}
        <TabsContent value="oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {oauthApps.length === 0 ? (
                <p className="text-gray-500">No OAuth apps found</p>
              ) : (
                <div className="space-y-3">
                  {oauthApps.map((app: OAuthApp) => (
                    <Card key={app.id} className="bg-indigo-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{app.appName}</p>
                            <p className="text-xs text-gray-600 break-all">
                              Client ID: {app.clientId.slice(0, 20)}...
                            </p>
                            <p className="text-xs text-gray-600">
                              Created: {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(app.isActive)}>
                            {app.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RATE LIMITS TAB */}
        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              {rateLimits.length === 0 ? (
                <p className="text-gray-500">No rate limits configured</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rateLimits.map((limit: RateLimit) => (
                    <Card key={limit.id} className="bg-orange-50">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Per Second</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {limit.requestsPerSecond}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Per Day</p>
                            <p className="text-lg font-bold text-orange-600">
                              {limit.requestsPerDay.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Current Usage</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (limit.currentRequestCount / (limit.requestsPerDay / 10)) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {limit.currentRequestCount} requests
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTATION TAB */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              {apiDocs.length === 0 ? (
                <p className="text-gray-500">No API documentation found</p>
              ) : (
                <div className="space-y-3">
                  {apiDocs.map((doc: ApiDoc) => (
                    <Card key={doc.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-bold">
                                {doc.method}
                              </Badge>
                              <p className="font-mono text-sm break-all">{doc.endpointPath}</p>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{doc.description}</p>
                            <p className="text-xs text-gray-600 mt-2">
                              Updated: {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATUS TAB */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-medium text-gray-600">Total API Keys</p>
                    <p className="text-3xl font-bold text-blue-600">{apiKeys.length}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Active: {apiKeys.filter((k: ApiKey) => k.isActive).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-medium text-gray-600">Webhooks</p>
                    <p className="text-3xl font-bold text-green-600">{webhooks.length}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Active: {webhooks.filter((w: Webhook) => w.isActive).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-medium text-gray-600">Integrations</p>
                    <p className="text-3xl font-bold text-purple-600">{integrations.length}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Connected: {integrations.filter((i: Integration) => i.isActive).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-medium text-gray-600">OAuth Apps</p>
                    <p className="text-3xl font-bold text-indigo-600">{oauthApps.length}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Active: {oauthApps.filter((a: OAuthApp) => a.isActive).length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
