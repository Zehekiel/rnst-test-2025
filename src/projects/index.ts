import { OpenAPIHono } from '@hono/zod-openapi'
import { getProjectRoute, getProjectsRoute, postProjectRoute } from './routes.js'

const project = new OpenAPIHono()


project.openapi(getProjectsRoute, (c) => {
  return c.json({
    success: true,
    data:  [],
  })
})


project.openapi(getProjectRoute, (c) => {
  const { projectId } = c.req.valid('param')
  return c.json({
    success: true,
    data: projectId,
  })
})


project.openapi(postProjectRoute, (c) => {
  const body = c.req.valid('json');
  const { project, users } = body
  
  return c.json({
    success: true,
    data:  {
      project: `Projet ${project} ajouté`,
      users: users ? `Utilisateur(s) ajouté(s) au projet` : "Aucun utilisateur ajouté",
    }
  })
})

export default project;