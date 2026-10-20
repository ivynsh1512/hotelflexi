import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';

export const uploadRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

uploadRoutes.use('*', authMiddleware, tenantMiddleware);

uploadRoutes.post('/', async (c) => {
  const contentType = c.req.header('content-type') || '';

  // 1. JSON payload with Data URI or URL
  if (contentType.includes('application/json')) {
    const body = await c.req.json().catch(() => ({}));
    const { dataUri, imageUrl } = body;

    if (imageUrl) {
      return c.json({ success: true, url: imageUrl });
    }

    if (dataUri && typeof dataUri === 'string' && dataUri.startsWith('data:image/')) {
      return c.json({ success: true, url: dataUri });
    }

    return c.json({ error: 'Please provide a valid image URL or dataUri' }, 400);
  }

  // 2. Multipart form data
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return c.json({ error: 'No file uploaded' }, 400);
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const mimeType = file.type || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64}`;

      return c.json({ success: true, url: dataUri });
    } catch (err: any) {
      return c.json({ error: 'Failed to process file upload', message: err.message }, 500);
    }
  }

  return c.json({ error: 'Unsupported media type. Send JSON with dataUri or multipart/form-data.' }, 415);
});
