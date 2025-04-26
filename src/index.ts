import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import analysis from './analyses/index.js';
import project from './projects/index.js';

/**
 * @see https://hono.dev/
 */
const app = new OpenAPIHono()

app.route('/', analysis);
app.route('/projects', project);

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'rnst-test',
    description: 'Documentation API de pour le projet de test RNST',
  },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
