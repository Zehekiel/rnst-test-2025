import { OpenAPIHono } from '@hono/zod-openapi'
import { getAnalysesRoute, getAnalysisRoute, postAnalysisRoute } from '@/analyses/routes'

const analysis = new OpenAPIHono()

analysis.openapi(getAnalysesRoute, (c) => {
    const { projectId } = c.req.valid('param')
    return c.json({
        success: true,
        data: [],
    })
})

analysis.openapi(getAnalysisRoute, (c) => {
    const { projectId, analysisId } = c.req.valid('param')
    return c.json({
        success: true,
        data: {
            projectId,
            analysisId
        }
    })
})

analysis.openapi(postAnalysisRoute, (c) => {
    const { projectId } = c.req.valid('param')

    const body = c.req.valid('json');
    const { analysisId, users } = body
    
    return c.json({
        success: true,
        data: {
            projectId: "Analyse ajoutée avec succès au projet " + projectId,
            analysisId: `Analyse ${analysisId} ajoutée avec succès`,
            users: users ? "Utilisateur(s) ajouté(s)" : "Aucun utilisateur ajouté",
        }
    })
})

export default analysis