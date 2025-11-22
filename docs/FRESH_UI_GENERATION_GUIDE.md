# Fresh UI Admin Kit Generation Guide

## 🎯 Purpose

This guide explains how **tstack-kit CLI** should generate Fresh UI admin panels that integrate with the @tstack/fresh-ui library.

Reference Repository: `blog-v1-ui`

---

## 🚀 CLI Command

```bash
tstack-kit generate fresh-ui <entity-name> [options]

Options:
  --api-url=<url>           Backend API URL (default: http://localhost:3000)
  --with-auth               Generate auth pages (login/register)
  --admin-path=<path>       Admin panel base path (default: /admin)
  --public-pages=<pages>    Comma-separated list of public pages
                           Values: list, detail
  --disable-pages=<pages>   Comma-separated list of pages to skip
                           Values: list, new, edit, detail
  --skip-service            Don't generate API service file
  --skip-types              Don't generate TypeScript types file

Examples:
  # Full admin panel with auth
  tstack-kit generate fresh-ui article \
    --api-url=http://localhost:3000 \
    --with-auth \
    --admin-path=/admin

  # Public listing with detail pages
  tstack-kit generate fresh-ui article \
    --public-pages=list,detail \
    --disable-pages=new,edit

  # Admin-only management panel
  tstack-kit generate fresh-ui user \
    --admin-path=/admin \
    --disable-pages=detail
```

---

## 📦 Generated Files Structure

```
blog-v1-ui/
├── config/
│   └── entities/
│       └── {{entityNamePlural}}.config.tsx    # Entity configuration
├── entities/
│   └── {{entityNamePlural}}/
│       ├── {{entityName}}.service.ts          # API service
│       └── {{entityName}}.types.ts            # TypeScript types
├── routes/
│   ├── admin/
│   │   └── {{entityNamePlural}}/
│   │       ├── index.tsx                      # List page
│   │       ├── new.tsx                        # Create page
│   │       ├── [id]/
│   │       │   ├── index.tsx                  # Detail page
│   │       │   └── edit.tsx                   # Edit page
│   └── {{entityNamePlural}}/                  # [if public pages]
│       ├── index.tsx                          # Public list
│       └── [id].tsx                           # Public detail
└── islands/                                    # [if custom islands needed]
    └── {{EntityName}}CustomIsland.tsx
```

---

## 📝 File Generation Templates

### 1. Entity Configuration (`articles.config.tsx`)

```typescript
import { EntityConfig } from "../../../lib/admin/types.ts";
import { Article } from "../../../entities/articles/article.types.ts";

export const articlesConfig: EntityConfig<Article> = {
  name: "article",
  namePlural: "articles",
  displayName: "Article",
  displayNamePlural: "Articles",
  
  // API configuration
  apiEndpoint: "/articles",
  apiUrl: "{{apiUrl}}",
  
  // Table configuration
  columns: [
    {
      key: "id",
      label: "ID",
      sortable: true,
      type: "number",
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      searchable: true,
      type: "text",
    },
    {
      key: "slug",
      label: "Slug",
      type: "text",
    },
    {{#if ownershipField}}
    {
      key: "authorName",
      label: "Author",
      type: "text",
    },
    {{/if}}
    {
      key: "published",
      label: "Published",
      sortable: true,
      type: "boolean",
      render: (value: boolean) => (
        <span class={value ? "text-green-600" : "text-gray-400"}>
          {value ? "✓ Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      type: "date",
    },
  ],
  
  // Form configuration
  formFields: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Enter article title",
      validation: {
        minLength: 3,
        maxLength: 200,
      },
    },
    {
      name: "summary",
      label: "Summary",
      type: "textarea",
      required: true,
      placeholder: "Brief summary of the article",
      rows: 3,
      validation: {
        minLength: 10,
        maxLength: 500,
      },
    },
    {
      name: "content",
      label: "Content",
      type: "textarea",
      required: true,
      placeholder: "Article content (Markdown supported)",
      rows: 15,
      validation: {
        minLength: 10,
      },
    },
    {
      name: "published",
      label: "Published",
      type: "checkbox",
      defaultValue: false,
      helperText: "Make this article visible to the public",
    },
  ],
  
  // Search & filter configuration
  searchable: ["title", "slug", "summary"],
  sortable: ["id", "title", "createdAt", "published"],
  defaultSort: { field: "createdAt", direction: "desc" },
  
  // Display configuration
  detailFields: [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "slug", label: "Slug" },
    { key: "summary", label: "Summary" },
    { key: "content", label: "Content", render: (value: string) => (
      <div class="prose" dangerouslySetInnerHTML={{ __html: value }} />
    )},
    {{#if ownershipField}}
    { key: "authorName", label: "Author" },
    {{/if}}
    { key: "published", label: "Published", render: (value: boolean) => value ? "Yes" : "No" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ],
  
  // Permissions (if applicable)
  {{#if needsAuth}}
  permissions: {
    create: {{#if roles}}[{{roles}}]{{else}}["user", "admin", "superadmin"]{{/if}},
    update: {{#if ownershipCheck}}"owner"{{else if roles}}[{{roles}}]{{else}}["user", "admin", "superadmin"]{{/if}},
    delete: {{#if ownershipCheck}}"owner"{{else if roles}}[{{roles}}]{{else}}["admin", "superadmin"]{{/if}},
  },
  {{/if}}
};
```

### 2. TypeScript Types (`article.types.ts`)

```typescript
// Generated types for {{EntityName}} entity

export interface {{EntityName}} {
  id: number;
  // TODO: Add your entity fields
  title: string;
  slug: string;
  content: string;
  summary: string;
  {{#if ownershipField}}
  {{ownershipField}}: number;
  authorName?: string;  // From join
  {{/if}}
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Create{{EntityName}}DTO {
  // TODO: Add create DTO fields
  title: string;
  content: string;
  summary: string;
  published?: boolean;
}

export interface Update{{EntityName}}DTO {
  // TODO: Add update DTO fields (all optional)
  title?: string;
  content?: string;
  summary?: string;
  published?: boolean;
}

export interface {{EntityName}}ListResponse {
  data: {{EntityName}}[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface {{EntityName}}Response {
  data: {{EntityName}};
  message?: string;
}
```

### 3. API Service (`article.service.ts`)

```typescript
import { clientApi } from "../../lib/client-api.ts";
import type {
  {{EntityName}},
  Create{{EntityName}}DTO,
  Update{{EntityName}}DTO,
  {{EntityName}}ListResponse,
  {{EntityName}}Response,
} from "./{{entityName}}.types.ts";

export const {{entityName}}Service = {
  /**
   * Get all {{entityNamePlural}}
   */
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
  }): Promise<{{EntityName}}ListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize) queryParams.set("pageSize", params.pageSize.toString());
    if (params?.search) queryParams.set("search", params.search);
    if (params?.sort) queryParams.set("sort", params.sort);
    if (params?.order) queryParams.set("order", params.order);

    const url = `/{{entityNamePlural}}${queryParams.toString() ? `?${queryParams}` : ""}`;
    return await clientApi.get<{{EntityName}}ListResponse>(url);
  },

  /**
   * Get {{entityName}} by ID
   */
  async getById(id: number): Promise<{{EntityName}}Response> {
    return await clientApi.get<{{EntityName}}Response>(`/{{entityNamePlural}}/${id}`);
  },

  /**
   * Create new {{entityName}}
   */
  async create(data: Create{{EntityName}}DTO): Promise<{{EntityName}}Response> {
    return await clientApi.post<{{EntityName}}Response>("/{{entityNamePlural}}", data);
  },

  /**
   * Update {{entityName}}
   */
  async update(id: number, data: Update{{EntityName}}DTO): Promise<{{EntityName}}Response> {
    return await clientApi.put<{{EntityName}}Response>(`/{{entityNamePlural}}/${id}`, data);
  },

  /**
   * Delete {{entityName}}
   */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return await clientApi.delete(`/{{entityNamePlural}}/${id}`);
  },
};
```

### 4. Admin List Page (`routes/admin/articles/index.tsx`)

```typescript
import { defineRoute } from "fresh";
import { AdminLayout } from "../../../components/layout/AdminLayout.tsx";
import { DataTable } from "../../../components/admin/DataTable.tsx";
import { Pagination } from "../../../components/admin/Pagination.tsx";
import { articlesConfig } from "../../../config/entities/articles.config.tsx";
import { {{entityName}}Service } from "../../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  // Parse query params
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "id";
  const order = (url.searchParams.get("order") || "asc") as "asc" | "desc";

  // Fetch data
  const response = await {{entityName}}Service.getAll({
    page,
    pageSize,
    search,
    sort,
    order,
  });

  return (
    <AdminLayout title={`Manage ${articlesConfig.displayNamePlural}`}>
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold">{articlesConfig.displayNamePlural}</h1>
        <a
          href={`/admin/{{entityNamePlural}}/new`}
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New {articlesConfig.displayName}
        </a>
      </div>

      <DataTable
        config={articlesConfig}
        data={response.data}
        currentPage={page}
        pageSize={pageSize}
        search={search}
        sort={sort}
        order={order}
      />

      {response.meta && (
        <Pagination
          currentPage={response.meta.page}
          totalPages={response.meta.totalPages}
          baseUrl={`/admin/{{entityNamePlural}}`}
        />
      )}
    </AdminLayout>
  );
});
```

### 5. Admin Create Page (`routes/admin/articles/new.tsx`)

```typescript
import { defineRoute } from "fresh";
import { AdminLayout } from "../../../components/layout/AdminLayout.tsx";
import { GenericForm } from "../../../components/admin/GenericForm.tsx";
import { articlesConfig } from "../../../config/entities/articles.config.tsx";
import { {{entityName}}Service } from "../../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  if (req.method === "POST") {
    const formData = await req.formData();
    const data = Object.fromEntries(formData);
    
    try {
      await {{entityName}}Service.create(data);
      return new Response("", {
        status: 303,
        headers: { Location: "/admin/{{entityNamePlural}}" },
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  }

  return (
    <AdminLayout title={`Create ${articlesConfig.displayName}`}>
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">
          Create New {articlesConfig.displayName}
        </h1>

        <GenericForm
          config={articlesConfig}
          action={`/admin/{{entityNamePlural}}/new`}
          method="POST"
          submitLabel="Create"
          cancelUrl="/admin/{{entityNamePlural}}"
        />
      </div>
    </AdminLayout>
  );
});
```

### 6. Admin Detail Page (`routes/admin/articles/[id]/index.tsx`)

```typescript
import { defineRoute } from "fresh";
import { AdminLayout } from "../../../../components/layout/AdminLayout.tsx";
import { ShowPage } from "../../../../components/admin/ShowPage.tsx";
import { articlesConfig } from "../../../../config/entities/articles.config.tsx";
import { {{entityName}}Service } from "../../../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  const id = parseInt(ctx.params.id);
  
  try {
    const response = await {{entityName}}Service.getById(id);
    const {{entityName}} = response.data;

    return (
      <AdminLayout title={`${articlesConfig.displayName} #${id}`}>
        <ShowPage
          config={articlesConfig}
          data={ {{entityName}} }
          editUrl={`/admin/{{entityNamePlural}}/${id}/edit`}
          listUrl="/admin/{{entityNamePlural}}"
          deleteUrl={`/admin/{{entityNamePlural}}/${id}`}
        />
      </AdminLayout>
    );
  } catch (error) {
    return ctx.render({ error: error.message });
  }
});
```

### 7. Admin Edit Page (`routes/admin/articles/[id]/edit.tsx`)

```typescript
import { defineRoute } from "fresh";
import { AdminLayout } from "../../../../components/layout/AdminLayout.tsx";
import { GenericForm } from "../../../../components/admin/GenericForm.tsx";
import { articlesConfig } from "../../../../config/entities/articles.config.tsx";
import { {{entityName}}Service } from "../../../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  const id = parseInt(ctx.params.id);

  if (req.method === "POST") {
    const formData = await req.formData();
    const data = Object.fromEntries(formData);
    
    try {
      await {{entityName}}Service.update(id, data);
      return new Response("", {
        status: 303,
        headers: { Location: `/admin/{{entityNamePlural}}/${id}` },
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  }

  // Fetch existing data
  try {
    const response = await {{entityName}}Service.getById(id);
    const {{entityName}} = response.data;

    return (
      <AdminLayout title={`Edit ${articlesConfig.displayName} #${id}`}>
        <div class="max-w-3xl mx-auto">
          <h1 class="text-3xl font-bold mb-6">
            Edit {articlesConfig.displayName} #{id}
          </h1>

          <GenericForm
            config={articlesConfig}
            initialData={ {{entityName}} }
            action={`/admin/{{entityNamePlural}}/${id}/edit`}
            method="POST"
            submitLabel="Update"
            cancelUrl={`/admin/{{entityNamePlural}}/${id}`}
          />
        </div>
      </AdminLayout>
    );
  } catch (error) {
    return ctx.render({ error: error.message });
  }
});
```

### 8. Public List Page (`routes/articles/index.tsx`) [if public pages]

```typescript
import { defineRoute } from "fresh";
import { {{entityName}}Service } from "../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 12;

  const response = await {{entityName}}Service.getAll({ page, pageSize });

  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8">{{displayNamePlural}}</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {response.data.map(({{entityName}}) => (
          <a
            href={`/{{entityNamePlural}}/${{{entityName}}.id}`}
            class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 class="text-xl font-bold mb-2">{{{entityName}}.title}</h2>
            <p class="text-gray-600 mb-4">{{{entityName}}.summary}</p>
            <span class="text-blue-600 hover:underline">Read more →</span>
          </a>
        ))}
      </div>

      {response.meta && response.meta.totalPages > 1 && (
        <div class="mt-8 flex justify-center gap-2">
          {Array.from({ length: response.meta.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              href={`/{{entityNamePlural}}?page=${p}`}
              class={`px-4 py-2 rounded ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});
```

### 9. Public Detail Page (`routes/articles/[id].tsx`) [if public pages]

```typescript
import { defineRoute } from "fresh";
import { {{entityName}}Service } from "../../entities/{{entityNamePlural}}/{{entityName}}.service.ts";

export default defineRoute(async (req, ctx) => {
  const id = parseInt(ctx.params.id);
  
  try {
    const response = await {{entityName}}Service.getById(id);
    const {{entityName}} = response.data;

    return (
      <div class="container mx-auto px-4 py-8">
        <article class="max-w-3xl mx-auto">
          <h1 class="text-4xl font-bold mb-4">{{{entityName}}.title}</h1>
          
          <div class="text-gray-600 mb-6">
            {{#if ownershipField}}
            <span>By {{{entityName}}.authorName}</span>
            <span class="mx-2">•</span>
            {{/if}}
            <time datetime={{{entityName}}.createdAt}>
              {new Date({{entityName}}.createdAt).toLocaleDateString()}
            </time>
          </div>

          <div class="prose max-w-none">
            <p class="text-xl text-gray-700 mb-6">{{{entityName}}.summary}</p>
            <div dangerouslySetInnerHTML={{ __html: {{entityName}}.content }} />
          </div>

          <div class="mt-8">
            <a
              href="/{{entityNamePlural}}"
              class="text-blue-600 hover:underline"
            >
              ← Back to {{"{{displayNamePlural}}"}}
            </a>
          </div>
        </article>
      </div>
    );
  } catch (error) {
    return <div>{{EntityName}} not found</div>;
  }
});
```

---

## 🔧 CLI Implementation Logic

### Template Variable Calculation

```typescript
interface FreshUIContext {
  entityName: string;              // "article"
  EntityName: string;              // "Article"
  entityNamePlural: string;        // "articles"
  displayName: string;             // "Article"
  displayNamePlural: string;       // "Articles"
  apiUrl: string;                  // "http://localhost:3000"
  adminPath: string;               // "/admin"
  ownershipField?: string;         // "authorId"
  publicPages: string[];           // ["list", "detail"]
  disablePages: string[];          // ["new", "edit"]
  needsAuth: boolean;
  roles?: string[];
  ownershipCheck: boolean;
  
  // Computed flags
  hasPublicList: boolean;
  hasPublicDetail: boolean;
  hasAdminList: boolean;
  hasAdminNew: boolean;
  hasAdminDetail: boolean;
  hasAdminEdit: boolean;
}
```

---

## ✅ Post-Generation Steps

1. **Install dependencies** (if not already installed):
   ```bash
   deno install
   ```

2. **Update navigation** (if admin pages):
   Add link to `components/layout/AdminLayout.tsx`:
   ```tsx
   <a href="/admin/{{entityNamePlural}}">{{displayNamePlural}}</a>
   ```

3. **Format code**:
   ```bash
   deno fmt
   ```

4. **Start dev server**:
   ```bash
   deno task start
   ```

5. **Print success message**:
   ```
   ✅ Successfully generated Fresh UI for {{EntityName}}!
   
   Admin Panel Pages:
   - /admin/{{entityNamePlural}} (List)
   - /admin/{{entityNamePlural}}/new (Create)
   - /admin/{{entityNamePlural}}/:id (Detail)
   - /admin/{{entityNamePlural}}/:id/edit (Edit)
   
   Public Pages:
   - /{{entityNamePlural}} (List)
   - /{{entityNamePlural}}/:id (Detail)
   
   Next steps:
   1. Customize entity config in config/entities/{{entityNamePlural}}.config.tsx
   2. Start dev server: deno task start
   3. Visit: http://localhost:8000/admin/{{entityNamePlural}}
   ```

---

This guide provides everything needed to generate production-ready Fresh UI admin panels! 🎉
