"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Endpoint } from "@/app/generated/prisma/client";

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
    enabled: initialData?.enabled ?? true,
  });

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

      const payload = {
        ...formData,
        schema: parsedSchema,
        path: formData.path.startsWith("/") ? formData.path : `/${formData.path}`,
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
            </div>
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
                name="enabled"
                type="checkbox"
                checked={formData.enabled}
                onChange={handleChange}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">Enabled</span>
            </label>
          </div>
        </div>

        {/* Right Column - Schema Editor */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              JSON Schema
            </label>
            <div className="flex gap-2 mb-2">
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
