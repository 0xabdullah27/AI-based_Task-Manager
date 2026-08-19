/**
 * Test: [APIModule] API Integration
 *
 * Spec: [spec-id]
 * Task: [task-id]
 *
 * Tests API integration using MSW (Mock Service Worker) following TDD principles.
 * Coverage target: 70%+
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { [apiFunction] } from '@/lib/api/[module]';

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('[APIModule] API', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  describe('[apiFunction] - GET /api/[resource]', () => {
    it('should fetch resources successfully', async () => {
      // Arrange
      const mockData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockData));
        })
      );

      // Act
      const result = await [apiFunction]();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('should include auth token in request', async () => {
      // Arrange
      let capturedHeaders: Record<string, string> = {};

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          capturedHeaders = Object.fromEntries(req.headers);
          return res(ctx.status(200), ctx.json([]));
        })
      );

      // Act
      await [apiFunction]({ token: 'test-token' });

      // Assert
      expect(capturedHeaders['authorization']).toBe('Bearer test-token');
    });

    it('should handle query parameters', async () => {
      // Arrange
      let capturedParams: Record<string, string> = {};

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          capturedParams = Object.fromEntries(req.url.searchParams);
          return res(ctx.status(200), ctx.json([]));
        })
      );

      // Act
      await [apiFunction]({ completed: true, limit: 10 });

      // Assert
      expect(capturedParams['completed']).toBe('true');
      expect(capturedParams['limit']).toBe('10');
    });

    it('should handle 404 not found', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ error: 'Resource not found' })
          );
        })
      );

      // Act & Assert
      await expect([apiFunction]('999')).rejects.toThrow('Resource not found');
    });

    it('should handle 401 unauthorized', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Unauthorized' })
          );
        })
      );

      // Act & Assert
      await expect([apiFunction]()).rejects.toThrow('Unauthorized');
    });

    it('should handle 500 server error', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          );
        })
      );

      // Act & Assert
      await expect([apiFunction]()).rejects.toThrow('Internal server error');
    });

    it('should handle network error', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res) => {
          return res.networkError('Network connection failed');
        })
      );

      // Act & Assert
      await expect([apiFunction]()).rejects.toThrow('Network connection failed');
    });

    it('should handle timeout', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(ctx.delay(5000), ctx.json([]));
        })
      );

      // Act & Assert
      await expect([apiFunction]({ timeout: 1000 })).rejects.toThrow('Timeout');
    });
  });

  describe('[createFunction] - POST /api/[resource]', () => {
    it('should create resource successfully', async () => {
      // Arrange
      const newItem = { name: 'New Item' };
      const createdItem = { id: '1', ...newItem, createdAt: new Date().toISOString() };

      server.use(
        rest.post(`${BASE_URL}/[resource]`, async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.status(201), ctx.json({ ...body, id: '1', createdAt: new Date().toISOString() }));
        })
      );

      // Act
      const result = await [createFunction](newItem);

      // Assert
      expect(result).toMatchObject(newItem);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should validate request body', async () => {
      // Arrange
      let capturedBody: any = null;

      server.use(
        rest.post(`${BASE_URL}/[resource]`, async (req, res, ctx) => {
          capturedBody = await req.json();
          return res(ctx.status(201), ctx.json(capturedBody));
        })
      );

      const requestData = { name: 'Test', description: 'Description' };

      // Act
      await [createFunction](requestData);

      // Assert
      expect(capturedBody).toEqual(requestData);
    });

    it('should handle 422 validation error', async () => {
      // Arrange
      server.use(
        rest.post(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: 'Validation Error',
              details: [
                { field: 'name', message: 'Name is required' },
              ],
            })
          );
        })
      );

      // Act & Assert
      await expect([createFunction]({})).rejects.toThrow('Validation Error');
    });

    it('should handle 409 conflict', async () => {
      // Arrange
      server.use(
        rest.post(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({ error: 'Resource already exists' })
          );
        })
      );

      // Act & Assert
      await expect([createFunction]({ name: 'Duplicate' })).rejects.toThrow('Resource already exists');
    });
  });

  describe('[updateFunction] - PATCH /api/[resource]/:id', () => {
    it('should update resource successfully', async () => {
      // Arrange
      const resourceId = '1';
      const updates = { name: 'Updated Name' };
      const updatedResource = { id: resourceId, ...updates };

      server.use(
        rest.patch(`${BASE_URL}/[resource]/:id`, async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.status(200), ctx.json({ id: req.params.id, ...body }));
        })
      );

      // Act
      const result = await [updateFunction](resourceId, updates);

      // Assert
      expect(result).toEqual(updatedResource);
    });

    it('should send only changed fields', async () => {
      // Arrange
      let capturedBody: any = null;

      server.use(
        rest.patch(`${BASE_URL}/[resource]/:id`, async (req, res, ctx) => {
          capturedBody = await req.json();
          return res(ctx.status(200), ctx.json({}));
        })
      );

      const updates = { name: 'New Name' }; // Only updating name

      // Act
      await [updateFunction]('1', updates);

      // Assert
      expect(capturedBody).toEqual(updates);
      expect(Object.keys(capturedBody)).toHaveLength(1);
    });

    it('should handle 404 when resource not found', async () => {
      // Arrange
      server.use(
        rest.patch(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Resource not found' }));
        })
      );

      // Act & Assert
      await expect([updateFunction]('999', { name: 'Test' })).rejects.toThrow('Resource not found');
    });
  });

  describe('[deleteFunction] - DELETE /api/[resource]/:id', () => {
    it('should delete resource successfully', async () => {
      // Arrange
      const resourceId = '1';

      server.use(
        rest.delete(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      // Act
      await [deleteFunction](resourceId);

      // Assert - No error thrown means success
    });

    it('should handle 404 when resource not found', async () => {
      // Arrange
      server.use(
        rest.delete(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Resource not found' }));
        })
      );

      // Act & Assert
      await expect([deleteFunction]('999')).rejects.toThrow('Resource not found');
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      server.use(
        rest.delete(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(ctx.status(403), ctx.json({ error: 'Forbidden' }));
        })
      );

      // Act & Assert
      await expect([deleteFunction]('1')).rejects.toThrow('Forbidden');
    });
  });

  describe('Request Configuration', () => {
    it('should set correct content-type header', async () => {
      // Arrange
      let capturedHeaders: Record<string, string> = {};

      server.use(
        rest.post(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          capturedHeaders = Object.fromEntries(req.headers);
          return res(ctx.status(201), ctx.json({}));
        })
      );

      // Act
      await [createFunction]({ name: 'Test' });

      // Assert
      expect(capturedHeaders['content-type']).toContain('application/json');
    });

    it('should include custom headers', async () => {
      // Arrange
      let capturedHeaders: Record<string, string> = {};

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          capturedHeaders = Object.fromEntries(req.headers);
          return res(ctx.status(200), ctx.json([]));
        })
      );

      // Act
      await [apiFunction]({
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      // Assert
      expect(capturedHeaders['x-custom-header']).toBe('custom-value');
    });
  });

  describe('Response Handling', () => {
    it('should parse JSON response', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' };

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(ctx.json(mockData));
        })
      );

      // Act
      const result = await [apiFunction]();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('should handle empty response', async () => {
      // Arrange
      server.use(
        rest.delete(`${BASE_URL}/[resource]/:id`, (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      // Act
      const result = await [deleteFunction]('1');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle non-JSON response', async () => {
      // Arrange
      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          return res(ctx.text('Plain text response'));
        })
      );

      // Act & Assert
      await expect([apiFunction]()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient errors', async () => {
      // Arrange
      let attempts = 0;

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          attempts++;
          if (attempts < 3) {
            return res(ctx.status(503), ctx.json({ error: 'Service unavailable' }));
          }
          return res(ctx.status(200), ctx.json([]));
        })
      );

      // Act
      const result = await [apiFunction]({ retry: 3 });

      // Assert
      expect(attempts).toBe(3);
      expect(result).toEqual([]);
    });

    it('should not retry on client errors', async () => {
      // Arrange
      let attempts = 0;

      server.use(
        rest.get(`${BASE_URL}/[resource]`, (req, res, ctx) => {
          attempts++;
          return res(ctx.status(400), ctx.json({ error: 'Bad request' }));
        })
      );

      // Act & Assert
      await expect([apiFunction]({ retry: 3 })).rejects.toThrow('Bad request');
      expect(attempts).toBe(1); // No retry
    });
  });
});
