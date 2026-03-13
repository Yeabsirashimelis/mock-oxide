"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Endpoint } from "@/app/generated/prisma/client";
import { LivePreview } from "./live-preview";
import { CodeSnippets } from "./code-snippets";

interface SchemaTemplate {
  id: string;
  name: string;
  description: string | null;
  schema: unknown;
  createdAt: string;
}

interface EndpointFormProps {
  mode: "create" | "edit";
  projectSlug: string;
  initialData?: Endpoint;
}

const SCHEMA_EXAMPLES = {
  user: `{
  "id": "uuid",
  "name": "fullName",
  "email": "email",
  "avatar": "avatar",
  "role": "enum:admin,user,guest",
  "active": "boolean",
  "createdAt": "datetime"
}`,
  product: `{
  "id": "uuid",
  "name": "productName",
  "description": "productDescription",
  "price": "price",
  "category": "category",
  "inStock": "boolean",
  "rating": "number:1-5"
}`,
  post: `{
  "id": "uuid",
  "title": "sentence",
  "content": "paragraph",
  "author": {
    "name": "fullName",
    "email": "email"
  },
  "tags": "array:word:3",
  "published": "boolean",
  "createdAt": "datetime"
}`,
};

export function EndpointForm({ mode, projectSlug, initialData }: EndpointFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SchemaTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    path: initialData?.path || "/",
    method: initialData?.method || "GET",
    description: initialData?.description || "",
    schema: initialData?.schema
      ? JSON.stringify(initialData.schema, null, 2)
      : SCHEMA_EXAMPLES.user,
    responseCode: initialData?.responseCode || 200,
    delay: initialData?.delay || 0,
    isArray: initialData?.isArray || false,
    arrayCount: initialData?.arrayCount || 10,
    pagination: initialData?.pagination || false,
    stateful: initialData?.stateful || false,
    authRequired: initialData?.authRequired || false,
    rateLimit: initialData?.rateLimit || null,
    validateRequest: initialData?.validateRequest || false,
    enabled: initialData?.enabled ?? true,
  });

  // Custom headers state
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>(
    initialData?.responseHeaders
      ? Object.entries(initialData.responseHeaders as Record<string, string>).map(([key, value]) => ({
          key,
          value,
        }))
      : []
  );

  // CORS origins state
  const [corsOrigins, setCorsOrigins] = useState<string[]>(
    initialData?.corsOrigins || []
  );

  // Response scenarios state
  interface Condition {
    type: "query" | "header";
    key: string;
    operator: "equals" | "contains" | "exists";
    value: string;
  }

  interface Scenario {
    name: string;
    conditions: Condition[];
    response: {
      statusCode: number;
      body: string;
      delay?: number;
    };
  }

  const [scenarios, setScenarios] = useState<Scenario[]>(
    (initialData?.scenarios as unknown as Scenario[]) || []
  );

  // Fetch user's templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates");
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
    }
    fetchTemplates();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
    setError(null);
  };

  const handleExampleSelect = (example: keyof typeof SCHEMA_EXAMPLES) => {
    setFormData((prev) => ({
      ...prev,
      schema: SCHEMA_EXAMPLES[example],
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }

    try {
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(formData.schema);
      } catch {
        setError("Invalid JSON schema");
        return;
      }

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          schema: parsedSchema,
        }),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates((prev) => [newTemplate, ...prev]);
        setTemplateName("");
        setTemplateDescription("");
        setShowSaveTemplate(false);
        setError(null);
      } else {
        setError("Failed to save template");
      }
    } catch (error) {
      setError("Failed to save template");
    }
  };

  const handleLoadTemplate = (template: SchemaTemplate) => {
    setFormData((prev) => ({
      ...prev,
      schema: JSON.stringify(template.schema, null, 2),
    }));
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        setError("Failed to delete template");
      }
    } catch (error) {
      setError("Failed to delete template");
    }
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    (template.description?.toLowerCase().includes(templateSearch.toLowerCase()) ?? false)
  );

  // Custom headers handlers
  const handleAddHeader = () => {
    setCustomHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    setCustomHeaders((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleRemoveHeader = (index: number) => {
    setCustomHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  // CORS origins handlers
  const handleAddOrigin = () => {
    setCorsOrigins((prev) => [...prev, ""]);
  };

  const handleOriginChange = (index: number, value: string) => {
    setCorsOrigins((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveOrigin = (index: number) => {
    setCorsOrigins((prev) => prev.filter((_, i) => i !== index));
  };

  // Scenario handlers
  const handleAddScenario = () => {
    setScenarios((prev) => [
      ...prev,
      {
        name: `Scenario ${prev.length + 1}`,
        conditions: [{ type: "query", key: "", operator: "equals", value: "" }],
        response: {
          statusCode: 400,
          body: '{ "error": "Bad request" }',
        },
      },
    ]);
  };

  const handleRemoveScenario = (index: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScenarioNameChange = (index: number, name: string) => {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  };

  const handleScenarioResponseChange = (
    index: number,
    field: "statusCode" | "body" | "delay",
    value: string | number
  ) => {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        response: { ...updated[index].response, [field]: value },
      };
      return updated;
    });
  };

  const handleAddCondition = (scenarioIndex: number) => {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[scenarioIndex] = {
        ...updated[scenarioIndex],
        conditions: [
          ...updated[scenarioIndex].conditions,
          { type: "query", key: "", operator: "equals", value: "" },
        ],
      };
      return updated;
    });
  };

  const handleRemoveCondition = (scenarioIndex: number, conditionIndex: number) => {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[scenarioIndex] = {
        ...updated[scenarioIndex],
        conditions: updated[scenarioIndex].conditions.filter(
          (_, i) => i !== conditionIndex
        ),
      };
      return updated;
    });
  };

  const handleConditionChange = (
    scenarioIndex: number,
    conditionIndex: number,
    field: keyof Condition,
    value: string
  ) => {
    setScenarios((prev) => {
      const updated = [...prev];
      const conditions = [...updated[scenarioIndex].conditions];
      conditions[conditionIndex] = { ...conditions[conditionIndex], [field]: value };
      updated[scenarioIndex] = { ...updated[scenarioIndex], conditions };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate JSON schema
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(formData.schema);
      } catch {
        throw new Error("Invalid JSON schema");
      }

      // Convert custom headers array to object
      const responseHeaders = customHeaders.reduce((acc, header) => {
        if (header.key.trim() && header.value.trim()) {
          acc[header.key.trim()] = header.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Filter out empty CORS origins
      const filteredCorsOrigins = corsOrigins.filter((origin) => origin.trim() !== "");

      // Filter out scenarios with empty conditions
      const validScenarios = scenarios
        .filter((s) => s.name.trim() && s.conditions.some((c) => c.key.trim()))
        .map((s) => ({
          ...s,
          conditions: s.conditions.filter((c) => c.key.trim()),
          response: {
            ...s.response,
            body: (() => {
              try {
                return JSON.parse(s.response.body);
              } catch {
                return s.response.body;
              }
            })(),
          },
        }));

      const payload = {
        ...formData,
        schema: parsedSchema,
        path: formData.path.startsWith("/") ? formData.path : `/${formData.path}`,
        responseHeaders: Object.keys(responseHeaders).length > 0 ? responseHeaders : null,
        corsOrigins: filteredCorsOrigins,
        scenarios: validScenarios.length > 0 ? validScenarios : null,
      };

      const url =
        mode === "create"
          ? `/api/projects/${projectSlug}/endpoints`
          : `/api/projects/${projectSlug}/endpoints/${initialData!.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save endpoint");
      }

      router.push(`/dashboard/projects/${projectSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Name (optional)
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Get all users"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Path
              </label>
              <input
                name="path"
                type="text"
                required
                value={formData.path}
                onChange={handleChange}
                placeholder="/users"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Returns a list of all users"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Status Code
              </label>
              <input
                name="responseCode"
                type="number"
                value={formData.responseCode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Delay (ms)
              </label>
              <input
                name="delay"
                type="number"
                min="0"
                value={formData.delay}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-zinc-500 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, delay: 0 }))}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, delay: 200 }))}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  Fast (200ms)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, delay: 500 }))}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  Normal (500ms)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, delay: 2000 }))}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  Slow (2s)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, delay: 5000 }))}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  Very Slow (5s)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Rate Limit (requests per minute, optional)
            </label>
            <input
              name="rateLimit"
              type="number"
              min="1"
              value={formData.rateLimit || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  rateLimit: value === "" ? null : Number(value),
                }));
                setError(null);
              }}
              placeholder="Unlimited"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Leave empty for unlimited requests. Example: 60 = max 60 requests per minute
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                name="isArray"
                type="checkbox"
                checked={formData.isArray}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">Return as array</span>
            </label>

            {formData.isArray && (
              <div className="ml-7 space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-zinc-400">Array size:</label>
                  <input
                    name="arrayCount"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.arrayCount}
                    onChange={handleChange}
                    className="w-24 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    name="pagination"
                    type="checkbox"
                    checked={formData.pagination}
                    onChange={handleChange}
                    className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Enable pagination</span>
                </label>
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                name="stateful"
                type="checkbox"
                checked={formData.stateful}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">Stateful (CRUD mode)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                name="authRequired"
                type="checkbox"
                checked={formData.authRequired}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">Require API key</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                name="validateRequest"
                type="checkbox"
                checked={formData.validateRequest}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">Validate request body</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                name="enabled"
                type="checkbox"
                checked={formData.enabled}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">Enabled</span>
            </label>
          </div>

          {/* Custom Response Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                Custom Response Headers (optional)
              </label>
              <button
                type="button"
                onClick={handleAddHeader}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                + Add Header
              </button>
            </div>

            {customHeaders.length > 0 ? (
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                      placeholder="Header-Name"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                      placeholder="Header Value"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(index)}
                      className="px-2 py-2 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Remove header"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                No custom headers. Common examples: Cache-Control, X-Custom-Header
              </p>
            )}
          </div>

          {/* CORS Allowed Origins */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                CORS Allowed Origins (optional)
              </label>
              <button
                type="button"
                onClick={handleAddOrigin}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                + Add Origin
              </button>
            </div>

            {corsOrigins.length > 0 ? (
              <div className="space-y-2">
                {corsOrigins.map((origin, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => handleOriginChange(index, e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOrigin(index)}
                      className="px-2 py-2 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Remove origin"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                No origins configured. Empty = allow all origins (*)
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              Leave empty to allow all origins. Add specific origins like https://example.com to restrict access.
            </p>
          </div>

          {/* Response Scenarios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                Response Scenarios (optional)
              </label>
              <button
                type="button"
                onClick={handleAddScenario}
                className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                + Add Scenario
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Return different responses based on query params or headers. Example: ?fail=true returns an error.
            </p>

            {scenarios.length > 0 ? (
              <div className="space-y-4">
                {scenarios.map((scenario, sIndex) => (
                  <div
                    key={sIndex}
                    className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={scenario.name}
                        onChange={(e) => handleScenarioNameChange(sIndex, e.target.value)}
                        placeholder="Scenario name"
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveScenario(sIndex)}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                        title="Remove scenario"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    {/* Conditions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-400">Conditions (all must match):</span>
                        <button
                          type="button"
                          onClick={() => handleAddCondition(sIndex)}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          + Add condition
                        </button>
                      </div>
                      <div className="space-y-2">
                        {scenario.conditions.map((condition, cIndex) => (
                          <div key={cIndex} className="flex items-center gap-2">
                            <select
                              value={condition.type}
                              onChange={(e) =>
                                handleConditionChange(sIndex, cIndex, "type", e.target.value)
                              }
                              className="px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="query">Query</option>
                              <option value="header">Header</option>
                            </select>
                            <input
                              type="text"
                              value={condition.key}
                              onChange={(e) =>
                                handleConditionChange(sIndex, cIndex, "key", e.target.value)
                              }
                              placeholder={condition.type === "query" ? "param" : "Header-Name"}
                              className="w-24 px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <select
                              value={condition.operator}
                              onChange={(e) =>
                                handleConditionChange(sIndex, cIndex, "operator", e.target.value)
                              }
                              className="px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="equals">=</option>
                              <option value="contains">contains</option>
                              <option value="exists">exists</option>
                            </select>
                            {condition.operator !== "exists" && (
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) =>
                                  handleConditionChange(sIndex, cIndex, "value", e.target.value)
                                }
                                placeholder="value"
                                className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            )}
                            {scenario.conditions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCondition(sIndex, cIndex)}
                                className="text-zinc-500 hover:text-red-400 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Status Code</label>
                        <input
                          type="number"
                          value={scenario.response.statusCode}
                          onChange={(e) =>
                            handleScenarioResponseChange(sIndex, "statusCode", Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Delay (ms)</label>
                        <input
                          type="number"
                          value={scenario.response.delay || 0}
                          onChange={(e) =>
                            handleScenarioResponseChange(sIndex, "delay", Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Response Body (JSON)</label>
                      <textarea
                        value={scenario.response.body}
                        onChange={(e) =>
                          handleScenarioResponseChange(sIndex, "body", e.target.value)
                        }
                        rows={3}
                        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                No scenarios configured. Add scenarios to return different responses based on conditions.
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Schema Editor */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              JSON Schema
            </label>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExampleSelect("user")}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => handleExampleSelect("product")}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                >
                  Product
                </button>
                <button
                  type="button"
                  onClick={() => handleExampleSelect("post")}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                >
                  Post
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Save as Template
              </button>
            </div>

            {/* Save Template Dialog */}
            {showSaveTemplate && (
              <div className="mb-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg space-y-2">
                <input
                  type="text"
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplate(false);
                      setTemplateName("");
                      setTemplateDescription("");
                    }}
                    className="px-3 py-1.5 text-sm border border-zinc-600 hover:border-zinc-500 text-zinc-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Saved Templates */}
            {templates.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Your Templates ({templates.length}):</p>
                  {templates.length > 3 && (
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                    />
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="group flex items-center gap-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(template)}
                          className="text-zinc-300 hover:text-zinc-100 transition-colors"
                          title={template.description || template.name}
                        >
                          {template.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete template"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No templates found</p>
                  )}
                </div>
              </div>
            )}
            <textarea
              name="schema"
              rows={20}
              required
              value={formData.schema}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Live Preview</h3>
        <LivePreview
          schema={formData.schema}
          isArray={formData.isArray}
          arrayCount={formData.arrayCount}
        />
      </div>

      {/* Code Snippets */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Code Snippets</h3>
        <CodeSnippets
          projectSlug={projectSlug}
          path={formData.path}
          method={formData.method}
          authRequired={formData.authRequired}
        />
      </div>

      {error && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isLoading
            ? "Saving..."
            : mode === "create"
            ? "Create Endpoint"
            : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
