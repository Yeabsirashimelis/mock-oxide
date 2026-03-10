export interface SnippetOptions {
  url: string;
  method: string;
  hasAuth?: boolean;
  apiKey?: string;
}

export function generateCurl(options: SnippetOptions): string {
  const { url, method, hasAuth, apiKey } = options;

  let snippet = `curl -X ${method} '${url}'`;

  if (hasAuth && apiKey) {
    snippet += ` \\\n  -H 'X-API-Key: ${apiKey}'`;
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    snippet += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '{}'`;
  }

  return snippet;
}

export function generateJavaScript(options: SnippetOptions): string {
  const { url, method, hasAuth, apiKey } = options;

  const headers: Record<string, string> = {};

  if (hasAuth && apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    headers["Content-Type"] = "application/json";
  }

  const hasHeaders = Object.keys(headers).length > 0;
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  let snippet = `const response = await fetch('${url}', {\n  method: '${method}'`;

  if (hasHeaders) {
    snippet += `,\n  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")}`;
  }

  if (hasBody) {
    snippet += `,\n  body: JSON.stringify({})`;
  }

  snippet += `\n});\n\nconst data = await response.json();\nconsole.log(data);`;

  return snippet;
}

export function generatePython(options: SnippetOptions): string {
  const { url, method, hasAuth, apiKey } = options;

  let snippet = `import requests\n\n`;

  const headers: Record<string, string> = {};

  if (hasAuth && apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  snippet += `url = '${url}'\n`;

  if (Object.keys(headers).length > 0) {
    snippet += `headers = ${JSON.stringify(headers, null, 2).replace(/"/g, "'")}\n`;
  }

  if (hasBody) {
    snippet += `data = {}\n\n`;
  } else {
    snippet += `\n`;
  }

  snippet += `response = requests.${method.toLowerCase()}(url`;

  if (Object.keys(headers).length > 0) {
    snippet += `, headers=headers`;
  }

  if (hasBody) {
    snippet += `, json=data`;
  }

  snippet += `)\nprint(response.json())`;

  return snippet;
}

export function generateGo(options: SnippetOptions): string {
  const { url, method, hasAuth, apiKey } = options;

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  let snippet = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"`;

  if (hasBody) {
    snippet += `\n\t"strings"`;
  }

  snippet += `\n)\n\nfunc main() {\n`;

  if (hasBody) {
    snippet += `\tbody := strings.NewReader("{}")\n\t`;
  }

  snippet += `req, err := http.NewRequest("${method}", "${url}", `;

  if (hasBody) {
    snippet += `body`;
  } else {
    snippet += `nil`;
  }

  snippet += `)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n`;

  if (hasAuth && apiKey) {
    snippet += `\treq.Header.Set("X-API-Key", "${apiKey}")\n`;
  }

  if (hasBody) {
    snippet += `\treq.Header.Set("Content-Type", "application/json")\n`;
  }

  snippet += `\n\tresp, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n\n`;
  snippet += `\tbody, err := io.ReadAll(resp.Body)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n`;
  snippet += `\tfmt.Println(string(body))\n}`;

  return snippet;
}
