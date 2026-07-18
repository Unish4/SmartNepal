// A hand-authored OpenAPI 3.0 document, not one auto-generated from
// route introspection — an accurate, deliberately-written spec that
// stays correct because a human updates it alongside a route change is
// more trustworthy for an external developer than a generator that
// guesses at intent from Express route definitions.
const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

const successEnvelope = (dataSchema) => ({
  description: "Success",
  content: {
    "application/json": {
      schema: {
        allOf: [{ $ref: "#/components/schemas/SuccessBase" }, dataSchema],
      },
    },
  },
});

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NepalSewa API",
    version: "1.0.0",
    description:
      "The API powering NepalSewa, a civic issue reporting platform for Nepal. " +
      "Most routes require a valid session cookie (see the cookieAuth security " +
      "scheme). The `/api/public/*` routes require no authentication at all and " +
      "are safe for external tools, journalists, and civic-tech researchers to " +
      "build against — see the Public API section.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    {
      url: "https://smartnepal.onrender.com",
      description: "Production",
    },
  ],
  tags: [
    { name: "Health", description: "Service health check" },
    {
      name: "Auth",
      description: "Registration, login, password reset, email verification",
    },
    {
      name: "Two-Factor",
      description: "TOTP-based 2FA, required for admin-tier roles (Phase 36)",
    },
    { name: "Issues", description: "Citizen-facing civic issue reports" },
    { name: "Comments", description: "Discussion threads on issues" },
    {
      name: "Admin",
      description: "Municipality-scoped admin operations (Phase 27)",
    },
    {
      name: "Field Worker",
      description: "Field crew dispatch and assignment management",
    },
    { name: "Notifications", description: "In-app notification feed" },
    { name: "Push", description: "Web Push subscription management" },
    {
      name: "Public API",
      description:
        "No-auth, rate-limited, read-only API for external consumers",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "httpOnly JWT set automatically on login — not settable manually via this header.",
      },
    },
    schemas: {
      SuccessBase: {
        type: "object",
        properties: { success: { type: "boolean", example: true } },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          pages: { type: "integer" },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: {
            type: "string",
            enum: ["citizen", "admin", "field_worker", "super_admin"],
          },
          isEmailVerified: { type: "boolean" },
          twoFactorEnabled: { type: "boolean" },
        },
      },
      Issue: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          category: {
            type: "string",
            enum: [
              "Road Damage",
              "Garbage",
              "Water Issue",
              "Street Light",
              "Illegal Construction",
              "Public Space",
              "Other",
            ],
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
          status: {
            type: "string",
            enum: ["open", "verified", "in-progress", "resolved", "rejected"],
          },
          images: { type: "array", items: { type: "string", format: "uri" } },
          upvoteCount: { type: "integer" },
          author: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
            },
          },
          location: {
            type: "object",
            properties: {
              province: { type: "string" },
              district: { type: "string" },
              lat: { type: "number" },
              lng: { type: "number" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "status_change",
              "assignment",
              "escalation",
              "comment",
              "admin_action",
              "badge_earned",
            ],
          },
          title: { type: "string" },
          message: { type: "string" },
          link: { type: "string" },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Service health and DB connectivity check",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },

    // ── Auth
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new citizen account",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: successEnvelope({
            type: "object",
            properties: { user: { $ref: "#/components/schemas/User" } },
          }),
          409: errorResponse,
          400: errorResponse,
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary:
          "Log in — may return a pending 2FA challenge instead of a session",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Either a full session, or a pending 2FA challenge",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/User" },
                    requiresTwoFactor: { type: "boolean" },
                    pendingToken: {
                      type: "string",
                      description:
                        "Only present when requiresTwoFactor is true",
                    },
                  },
                },
              },
            },
          },
          401: errorResponse,
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current logged-in user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: { user: { $ref: "#/components/schemas/User" } },
          }),
          401: errorResponse,
        },
      },
    },
    "/api/auth/preferences": {
      patch: {
        tags: ["Auth"],
        summary: "Update email/SMS/language preferences",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset email",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/auth/reset-password/{token}": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using an emailed token",
        security: [],
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          400: errorResponse,
        },
      },
    },
    "/api/auth/verify-email/{token}": {
      get: {
        tags: ["Auth"],
        summary: "Verify email address using an emailed token",
        security: [],
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          400: errorResponse,
        },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend the email verification link",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },

    // ── Two-Factor ──
    "/api/auth/2fa/status": {
      get: {
        tags: ["Two-Factor"],
        summary: "Check whether 2FA is enabled/required for this account",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/auth/2fa/setup": {
      post: {
        tags: ["Two-Factor"],
        summary: "Begin 2FA setup — returns a QR code and manual entry key",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/auth/2fa/verify-setup": {
      post: {
        tags: ["Two-Factor"],
        summary:
          "Confirm setup with a TOTP code — returns one-time backup codes",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          400: errorResponse,
        },
      },
    },
    "/api/auth/2fa/disable": {
      post: {
        tags: ["Two-Factor"],
        summary: "Disable 2FA (requires password + a valid code)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          401: errorResponse,
        },
      },
    },
    "/api/auth/2fa/login-verify": {
      post: {
        tags: ["Two-Factor"],
        summary: "Complete login with a TOTP or backup code",
        security: [],
        responses: {
          200: successEnvelope({ type: "object" }),
          401: errorResponse,
        },
      },
    },

    // ── Issues ──────
    "/api/issues": {
      get: {
        tags: ["Issues"],
        summary: "List issues (public, filterable, paginated)",
        security: [],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
          { name: "province", in: "query", schema: { type: "string" } },
          { name: "district", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "most-upvoted"],
            },
          },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: {
              issues: {
                type: "array",
                items: { $ref: "#/components/schemas/Issue" },
              },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          }),
        },
      },
      post: {
        tags: ["Issues"],
        summary: "Report a new issue (multipart, up to 3 photos)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  address: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: successEnvelope({
            type: "object",
            properties: { issue: { $ref: "#/components/schemas/Issue" } },
          }),
          401: errorResponse,
          429: errorResponse,
        },
      },
    },
    "/api/issues/me": {
      get: {
        tags: ["Issues"],
        summary: "List the logged-in citizen's own reports",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/issues/heatmap": {
      get: {
        tags: ["Issues"],
        summary: "Density heatmap points (public, aggregate-only)",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/issues/boundaries": {
      get: {
        tags: ["Issues"],
        summary: "Distinct province/district values that have issue data",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/issues/{id}": {
      get: {
        tags: ["Issues"],
        summary: "Get a single issue",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: { issue: { $ref: "#/components/schemas/Issue" } },
          }),
          404: errorResponse,
        },
      },
      put: {
        tags: ["Issues"],
        summary: "Update an issue you own",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
      delete: {
        tags: ["Issues"],
        summary: "Delete an issue you own",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/issues/{id}/upvote": {
      post: {
        tags: ["Issues"],
        summary: "Toggle an upvote on an issue",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },

    // ── Comments ────
    "/api/issues/{id}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List comments on an issue (public)",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
      post: {
        tags: ["Comments"],
        summary: "Post a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          201: successEnvelope({ type: "object" }),
          429: errorResponse,
        },
      },
    },
    "/api/issues/{id}/comments/{commentId}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (own comment, or any admin)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },

    // ── Admin (all require cookieAuth + admin-tier role + 2FA enabled)
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard stats, scoped to jurisdiction",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/admin/issues": {
      get: {
        tags: ["Admin"],
        summary: "Full issues table, scoped to jurisdiction",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List citizen accounts",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Analytics including resolution cost by category",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/sms-balance": {
      get: {
        tags: ["Admin"],
        summary: "Remaining Sparrow SMS credit",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/issues/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Change an issue's status (audit-logged)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/admin/issues/{id}/assign": {
      patch: {
        tags: ["Admin"],
        summary: "Assign an issue to a field worker",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/field-workers": {
      get: {
        tags: ["Admin"],
        summary: "List field workers in your jurisdiction",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a field worker account (audit-logged)",
        security: [{ cookieAuth: [] }],
        responses: { 201: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/escalations/run": {
      post: {
        tags: ["Admin"],
        summary: "Manually trigger the SLA escalation sweep (super_admin only)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/admin/audit-log": {
      get: {
        tags: ["Admin"],
        summary: "Audit log, scoped to jurisdiction",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/admin/export/csv": {
      get: {
        tags: ["Admin"],
        summary: "Export filtered issues as CSV",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "CSV file" } },
      },
    },
    "/api/admin/export/pdf": {
      get: {
        tags: ["Admin"],
        summary: "Export a filtered PDF summary report",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "PDF file" } },
      },
    },
    "/api/admin/admins": {
      get: {
        tags: ["Admin"],
        summary: "List all admin accounts (super_admin only)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a jurisdiction-scoped admin (super_admin only)",
        security: [{ cookieAuth: [] }],
        responses: {
          201: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/admin/admins/{id}/jurisdiction": {
      patch: {
        tags: ["Admin"],
        summary: "Reassign an admin's jurisdiction (super_admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },

    // ── Field Worker
    "/api/field/assignments": {
      get: {
        tags: ["Field Worker"],
        summary: "List your assigned issues, priority-sorted",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/field/stats": {
      get: {
        tags: ["Field Worker"],
        summary: "Your assignment counts by status",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/field/assignments/{id}/status": {
      patch: {
        tags: ["Field Worker"],
        summary: "Update an assignment (resolved requires photo proof)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          403: errorResponse,
        },
      },
    },
    "/api/field/offline-map-bounds": {
      get: {
        tags: ["Field Worker"],
        summary:
          "Bounding box of your jurisdiction, for offline tile pre-caching",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({ type: "object" }),
          400: errorResponse,
          404: errorResponse,
        },
      },
    },

    // ── Notifications
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List your notifications",
        security: [{ cookieAuth: [] }],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: {
              notifications: {
                type: "array",
                items: { $ref: "#/components/schemas/Notification" },
              },
            },
          }),
        },
      },
    },
    "/api/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Lightweight unread count (for polling)",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark one notification as read",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({ type: "object" }),
          404: errorResponse,
        },
      },
    },
    "/api/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },

    // ── Push ────────
    "/api/push/vapid-public-key": {
      get: {
        tags: ["Push"],
        summary: "Get the VAPID public key (no secret)",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/push/subscribe": {
      post: {
        tags: ["Push"],
        summary: "Register a browser push subscription",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/push/unsubscribe": {
      post: {
        tags: ["Push"],
        summary: "Remove a browser push subscription",
        security: [{ cookieAuth: [] }],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },

    // ── Public API ──
    "/api/public/scorecard-directory": {
      get: {
        tags: ["Public API"],
        summary: "List every province/district with reported issues",
        security: [],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/public/scorecard/{province}/{district}": {
      get: {
        tags: ["Public API"],
        summary: "Public per-municipality transparency scorecard",
        security: [],
        parameters: [
          {
            name: "province",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "district",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: successEnvelope({ type: "object" }) },
      },
    },
    "/api/public/v1/issues": {
      get: {
        tags: ["Public API"],
        summary:
          "List public issue data — no auth, rate-limited, max page size 25",
        security: [],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "province", in: "query", schema: { type: "string" } },
          { name: "district", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "most-upvoted"],
            },
          },
          { name: "page", in: "query", schema: { type: "integer" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", maximum: 25 },
          },
        ],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: {
              issues: {
                type: "array",
                items: { $ref: "#/components/schemas/Issue" },
              },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          }),
          429: errorResponse,
        },
      },
    },
    "/api/public/v1/issues/{id}": {
      get: {
        tags: ["Public API"],
        summary: "Get a single public issue by ID",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: successEnvelope({
            type: "object",
            properties: { issue: { $ref: "#/components/schemas/Issue" } },
          }),
          404: errorResponse,
          400: errorResponse,
          429: errorResponse,
        },
      },
    },
    "/api/public/v1/categories": {
      get: {
        tags: ["Public API"],
        summary: "The fixed list of valid issue categories",
        security: [],
        responses: {
          200: successEnvelope({ type: "object" }),
          429: errorResponse,
        },
      },
    },
    "/api/public/v1/stats": {
      get: {
        tags: ["Public API"],
        summary: "Nationwide platform statistics, unscoped by jurisdiction",
        security: [],
        responses: {
          200: successEnvelope({ type: "object" }),
          429: errorResponse,
        },
      },
    },
  },
};
