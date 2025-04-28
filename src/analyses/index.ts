import { OpenAPIHono } from '@hono/zod-openapi'
import { getAnalysesRoute, getAnalysisRoute, postAnalysisRoute } from '@/analyses/routes'
import { getCookieData, allAsync } from '@/helper'
import { Analysis } from '@/types'
import { getUserRole } from '@/users/helper'
import { getAllAnalysisAllowed } from './helper'

const analysis = new OpenAPIHono()

analysis.openapi(getAnalysesRoute, async(c) => {
    const { projectId } = c.req.valid('param')

    try{
        const {userId} = await getCookieData(c)
        const userRole = await getUserRole(userId, "0");

        if (userRole === "admin") {
            const sql = 'SELECT * FROM analyses WHERE project_id = ?';
            const analyses = await allAsync<Analysis>(sql, [projectId]);

            return c.json({
                success: true,
                data:  analyses,
            })
        }
        const projects = await getAllAnalysisAllowed(userId, projectId);

        return c.json({
            success: true,
            data:  projects,
        })
    } catch (error) {
        console.error("getProjectsRoute error: ", error);
        return c.json({
            success: false,
            message: "Erreur lors de la récupération des projets",
        }, 500)
    }
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