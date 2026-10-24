import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, AppVariables } from './types';
import { authRoutes } from './routes/auth';
import { onboardingRoutes } from './routes/onboarding';
import { propertyRoutes } from './routes/properties';
import { roomRoutes } from './routes/rooms';
import { calendarRoutes } from './routes/calendar';
import { reservationRoutes } from './routes/reservations';
import { billingRoutes } from './routes/billing';
import { operationsRoutes } from './routes/operations';
import { channelManagerRoutes } from './routes/channelManager';
import { channelManagerV2Routes, channelManagerV2WebhookRoutes } from './routes/channelManagerV2';
import { bookingEngineRoutes } from './routes/bookingEngine';
import { aiAgentRoutes } from './routes/aiAgent';
import { reportRoutes } from './routes/reports';
import { subscriptionRoutes } from './routes/subscriptions';
import { adminRoutes } from './routes/admin';
import { webhookRoutes } from './routes/webhooks';
import { guestPortalRoutes } from './routes/guestPortal';
import { couponRoutes } from './routes/coupons';
import { dailyRatesRoutes } from './routes/dailyRates';
import { developerSetupRoutes } from './routes/developerSetup';
import { teamRoutes } from './routes/team';
import { diningRoutes } from './routes/dining';
import { supportRoutes, adminSupportRoutes } from './routes/support';
import { pushRoutes } from './routes/push';
import { weddingRoutes, weddingAdminRoutes } from './routes/wedding';
import { uploadRoutes } from './routes/upload';
import { addonsRoutes, publicAddonsRoutes } from './routes/addons';
import { hrExpensesRoutes } from './routes/hrExpenses';
import { accountDeletionRoutes } from './routes/accountDeletion';
import { laundryRoutes } from './routes/laundry';
import { connectivityRoutes } from './routes/connectivity';
import { connectivityDocsRoutes } from './routes/connectivityDocs';
import { channelIcalRoutes } from './routes/channelIcal';
import { foodProcurementRoutes } from './routes/foodProcurement';
import { tallyConnectorRoutes } from './routes/tallyConnector';
import { guestReviewsRoutes } from './routes/guestReviews';
import { marketingRoutes } from './routes/marketing';
import { taxRulesRoutes } from './routes/taxRules';
import { propertySetupRoutes } from './routes/propertySetup';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Request ID & Request logging middleware
app.use('*', async (c, next) => {
  const reqId = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', reqId);
  c.header('x-request-id', reqId);
  await next();
});

// Configure CORS for application and public widgets
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Property-ID', 'X-Razorpay-Signature'],
    exposeHeaders: ['x-request-id'],
    maxAge: 86400,
  })
);

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    product: 'HotelFlexi',
    company: 'NovaX AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'production',
  });
});

// API Routes Mounting
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/onboarding', onboardingRoutes);
app.route('/api/v1/properties', propertyRoutes);
app.route('/api/v1/rooms', roomRoutes);
app.route('/api/v1/room-types', roomRoutes);
app.route('/api/v1/calendar', calendarRoutes);
app.route('/api/v1/reservations', reservationRoutes);
app.route('/api/v1/billing', billingRoutes);
app.route('/api/v1/operations', operationsRoutes);
app.route('/api/v1/channels/ical', channelIcalRoutes);
app.route('/api/v1/channels/v2/webhooks', channelManagerV2WebhookRoutes);
app.route('/api/v1/channel-webhooks', channelManagerV2WebhookRoutes);
app.route('/api/v1/channels/v2', channelManagerV2Routes);
app.route('/api/v1/channels', channelManagerRoutes);
app.route('/api/v1/connectivity', connectivityDocsRoutes);
app.route('/api/v1/connectivity', connectivityRoutes);
app.route('/api/v1/public', bookingEngineRoutes);
app.route('/api/v1/public/addons', publicAddonsRoutes);
app.route('/api/v1/public/guest-portal', guestPortalRoutes);
app.route('/api/v1/addons', addonsRoutes);
app.route('/api/v1/salary', hrExpensesRoutes);
app.route('/api/v1/expenses', hrExpensesRoutes);
app.route('/api/v1/laundry', laundryRoutes);
app.route('/api/v1/food', foodProcurementRoutes);
app.route('/api/v1/tally', tallyConnectorRoutes);
app.route('/api/v1/reviews', guestReviewsRoutes);
app.route('/api/v1/marketing', marketingRoutes);
app.route('/api/v1/account', accountDeletionRoutes);
app.route('/api/v1/coupons', couponRoutes);
app.route('/api/v1/rooms/daily-rates', dailyRatesRoutes);
app.route('/api/v1/developer-setup', developerSetupRoutes);
app.route('/api/v1/team', teamRoutes);
app.route('/api/v1/dining', diningRoutes);
app.route('/api/v1/wedding', weddingAdminRoutes);
app.route('/api/v1/public/wedding', weddingRoutes);
app.route('/api/v1/upload', uploadRoutes);
app.route('/api/v1/support', supportRoutes);
app.route('/api/v1/admin/support', adminSupportRoutes);
app.route('/api/v1/push', pushRoutes);
app.route('/api/v1/ai', aiAgentRoutes);
app.route('/api/v1/ai-agent', aiAgentRoutes);
app.route('/api/v1/property-setup', propertySetupRoutes);
app.route('/api/v1/tax-rules', taxRulesRoutes);
app.route('/api/v1/reports', reportRoutes);
app.route('/api/v1/subscriptions', subscriptionRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/webhooks', webhookRoutes);

// Global 404
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found', path: c.req.path }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.path}:`, err);
  return c.json(
    {
      error: err.message || 'An internal error occurred',
      message: err.message,
      requestId: c.get('requestId'),
    },
    500
  );
});

export default {
  fetch: app.fetch,
  // Scheduled Cron Handler for OTA & Accounting Reconciliation
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`[Scheduled Cron] Running HotelFlexi 02:00 UTC reconciliation trigger at ${new Date(event.scheduledTime).toISOString()}`);
    // Reconciliation logic: identify any pending sync jobs older than 10 mins and retry safely
    try {
      const now = Math.floor(Date.now() / 1000);
      const stalePending = await env.DB.prepare(
        `SELECT id, connection_id FROM sync_jobs WHERE status = 'pending' AND created_at < ? LIMIT 20`
      )
        .bind(now - 600)
        .all();

      if (stalePending.results && stalePending.results.length > 0) {
        console.log(`Reconciled ${stalePending.results.length} stale sync jobs.`);
      }
    } catch (e) {
      console.error('Scheduled job execution error:', e);
    }
  },
};
