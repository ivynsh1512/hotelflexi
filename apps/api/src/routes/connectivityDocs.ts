/**
 * HotelFlexi Connectivity API — OpenAPI 3.1 Specification & Interactive Documentation
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';

export const connectivityDocsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'HotelFlexi External Connectivity API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for external channel managers, OTA aggregators (Channellyx), and CRS partners. Supports 2-way rates, availability, inbound bookings, modifications, cancellations, and no-shows.',
    contact: {
      name: 'HotelFlexi Hospitality Integration Engineering (NovaX AI)',
      email: 'integrations@novaxai.in',
      url: 'https://hotelflexi.com',
    },
  },
  servers: [
    {
      url: 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1/connectivity',
      description: 'Production Cloudflare Worker Gateway',
    },
    {
      url: 'http://localhost:8787/api/v1/connectivity',
      description: 'Local Development Server',
    },
  ],
  security: [
    {
      ApiKeyAuth: [],
      ApiSecretAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Partner Public API Key (e.g. hf_live_... or hf_test_...)',
      },
      ApiSecretAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Secret',
        description: 'Partner Secret Key (verified against salted SHA-256 hash)',
      },
    },
    schemas: {
      RatePushRequest: {
        type: 'object',
        required: ['rates'],
        properties: {
          rates: {
            type: 'array',
            items: {
              type: 'object',
              required: ['room_type_id', 'rate_plan_id', 'start_date', 'end_date'],
              properties: {
                room_type_id: { type: 'string', example: 'rt_deluxe_01' },
                rate_plan_id: { type: 'string', example: 'rp_ep_01' },
                start_date: { type: 'string', format: 'date', example: '2026-11-01' },
                end_date: { type: 'string', format: 'date', example: '2026-11-05' },
                price_paise: { type: 'integer', example: 450000, description: 'Nightly tariff in minor currency units (paise/cents)' },
                min_stay_arrival: { type: 'integer', example: 1 },
                min_stay_through: { type: 'integer', example: 1 },
                max_stay: { type: 'integer', example: 14 },
                closed_to_arrival: { type: 'boolean', example: false },
                closed_to_departure: { type: 'boolean', example: false },
                stop_sell: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
      AvailabilityPushRequest: {
        type: 'object',
        required: ['availability'],
        properties: {
          availability: {
            type: 'array',
            items: {
              type: 'object',
              required: ['room_type_id', 'start_date', 'end_date', 'available_rooms'],
              properties: {
                room_type_id: { type: 'string', example: 'rt_deluxe_01' },
                start_date: { type: 'string', format: 'date', example: '2026-11-01' },
                end_date: { type: 'string', format: 'date', example: '2026-11-05' },
                available_rooms: { type: 'integer', minimum: 0, example: 5 },
                stop_sell: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
      InboundReservationRequest: {
        type: 'object',
        required: [
          'external_reservation_id',
          'room_type_id',
          'check_in_date',
          'check_out_date',
          'guest',
        ],
        properties: {
          external_reservation_id: { type: 'string', example: 'CHX-2026-8891' },
          channel_code: { type: 'string', example: 'channellyx' },
          room_type_id: { type: 'string', example: 'rt_deluxe_01' },
          rate_plan_id: { type: 'string', example: 'rp_ep_01' },
          check_in_date: { type: 'string', format: 'date', example: '2026-11-10' },
          check_out_date: { type: 'string', format: 'date', example: '2026-11-12' },
          adults: { type: 'integer', default: 1, example: 2 },
          children: { type: 'integer', default: 0, example: 0 },
          total_amount_minor: { type: 'integer', example: 900000, description: 'Tariff in paise (e.g. ₹9,000)' },
          currency: { type: 'string', default: 'INR', example: 'INR' },
          payment_mode: { type: 'string', enum: ['pay_at_hotel', 'ota_vcc', 'paid'], example: 'ota_vcc' },
          guest: {
            type: 'object',
            required: ['full_name'],
            properties: {
              full_name: { type: 'string', example: 'Aarav Sharma' },
              email: { type: 'string', format: 'email', example: 'aarav@example.com' },
              phone: { type: 'string', example: '+919876543210' },
            },
          },
          special_requests: { type: 'string', example: 'Late check-in requested.' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Unauthorized' },
          message: { type: 'string', example: 'Invalid credentials or access denied' },
          code: { type: 'string', example: 'AUTH_KEY_INVALID' },
        },
      },
    },
  },
  paths: {
    '/me': {
      get: {
        summary: 'Partner Identity & Authorized Properties',
        description: 'Verifies API credentials and lists properties authorized for this partner.',
        responses: {
          '200': { description: 'Partner verification successful' },
          '401': { description: 'Missing or invalid credentials' },
        },
      },
    },
    '/properties': {
      get: {
        summary: 'List Authorized Properties',
        description: 'Returns all hotel properties mapped to the authenticated connectivity partner.',
        responses: {
          '200': { description: 'Array of authorized properties' },
        },
      },
    },
    '/properties/{propertyId}/room-types': {
      get: {
        summary: 'Get Room Types & Physical Units',
        parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Room categories, occupancy rules, and room unit count' },
          '403': { description: 'Property access unauthorized' },
        },
      },
    },
    '/properties/{propertyId}/rate-plans': {
      get: {
        summary: 'Get Active Rate Plans',
        parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Available rate plans and meal plan policies' },
        },
      },
    },
    '/properties/{propertyId}/rates': {
      post: {
        summary: 'Push Rates & Stay Restrictions',
        parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RatePushRequest' } } },
        },
        responses: {
          '200': { description: 'Rates successfully accepted' },
          '400': { description: 'Validation errors' },
        },
      },
    },
    '/properties/{propertyId}/availability': {
      post: {
        summary: 'Push Inventory Availability & Stop-Sell',
        parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AvailabilityPushRequest' } } },
        },
        responses: {
          '200': { description: 'Availability successfully updated' },
        },
      },
    },
    '/properties/{propertyId}/reservations': {
      post: {
        summary: 'Receive Inbound OTA Booking',
        parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InboundReservationRequest' } } },
        },
        responses: {
          '201': { description: 'Reservation created and physical room assigned' },
          '200': { description: 'Duplicate event idempotent success' },
        },
      },
    },
    '/properties/{propertyId}/reservations/{externalReservationId}': {
      put: {
        summary: 'Modify Existing Reservation',
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'externalReservationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Reservation successfully modified' },
        },
      },
    },
    '/properties/{propertyId}/reservations/{externalReservationId}/cancel': {
      post: {
        summary: 'Cancel Reservation & Restore Inventory',
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'externalReservationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Reservation cancelled, inventory released' },
        },
      },
    },
    '/properties/{propertyId}/reservations/{externalReservationId}/no-show': {
      post: {
        summary: 'Record Guest No-Show',
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'externalReservationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Reservation status transitioned to no_show' },
          '400': { description: 'Cannot declare no-show prior to scheduled check-in date' },
        },
      },
    },
    '/sandbox/seed': {
      post: {
        summary: 'Seed Isolated Sandbox Environment',
        description: 'Creates a full deterministic synthetic property with rooms, rate plans, and a sample reservation for partner certification.',
        responses: {
          '200': { description: 'Sandbox environment initialized' },
          '403': { description: 'Only available with sandbox mode credentials' },
        },
      },
    },
    '/sandbox/reset': {
      post: {
        summary: 'Reset Sandbox Environment',
        description: 'Purges all synthetic sandbox data for the partner.',
        responses: {
          '200': { description: 'Sandbox reset complete' },
        },
      },
    },
  },
};

// JSON Schema endpoint
connectivityDocsRoutes.get('/openapi.json', (c) => {
  return c.json(OPENAPI_SPEC);
});

// Interactive Swagger UI HTML endpoint
connectivityDocsRoutes.get('/docs', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HotelFlexi Connectivity API — Developer Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .top-banner { background: #0f172a; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .top-banner h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
    .top-banner span { font-size: 12px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="top-banner">
    <h1>🏨 HotelFlexi — Connectivity Provider API (v1.0)</h1>
    <span>Channellyx &amp; OTA Partner Integration Gateway</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/connectivity/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  return c.html(html);
});
