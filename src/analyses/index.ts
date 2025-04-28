import { OpenAPIHono } from '@hono/zod-openapi'
import { getAnalysesRoute, getAnalysisRoute, postAnalysisRoute } from '@/analyses/routes'
import { getCookieData, allAsync, controlPermission, getRoleId } from '@/helper'
import { Analysis } from '@/types'
import { addUser, getUserRole } from '@/users/helper'
import { addAnalysis, addAnalysisPolicies, addUserAnalyseRight, getAllAnalysisAllowed, getAnalysis } from './helper'
import { getProject } from '@/projects/helper'

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
        console.error("getAnalysesRoute error: ", error);
        return c.json({
            success: false,
            message: "Erreur lors de la récupération des projets",
        }, 500)
    }
})

analysis.openapi(postAnalysisRoute, async (c) => {
    const { projectId } = c.req.valid('param')
    const { userId } = await getCookieData(c)
    const body = c.req.valid('json');
    const { analysisName, users } = body
    
    const hasPermission = await controlPermission({userId, projectId: "", action: "write"});
    if (!hasPermission) {
        return c.json({
            success: false,
            message: "Vous n'avez pas les droits afin de créer un projet",
        }, 401)
    }

    const have_project = await getProject(projectId)
    if (!have_project) {
        return c.json({
            success: false,
            message: "Le projet n'existe pas",
        }, 403)
    }

    const { newAnalyseId } = await addAnalysis(analysisName,projectId, userId)
    await addAnalysisPolicies(projectId, newAnalyseId)

    const haveUsers = users && users.length > 0
    if (haveUsers) {
        users.forEach(async (user) => {
            const roleId= getRoleId(user.role)
            const createUser = await addUser(user.name)
            await addUserAnalyseRight(createUser.lastID, roleId, newAnalyseId)
        })
    }

    return c.json({
        success: true,
        data: {
            projectId: "Analyse ajoutée avec succès au projet " + have_project.name,
            analysisId: `Analyse ${analysisName} ajoutée avec succès`,
            users: haveUsers ? "Utilisateur(s) ajouté(s)" : "Aucun utilisateur ajouté",
        }
    })
})

analysis.openapi(getAnalysisRoute, async (c) => {
    const { projectId, analysisId } = c.req.valid('param')
    const { userId } = await getCookieData(c)

    const havePermission = await controlPermission({userId, projectId, analysisId, action: "read"})
    if (!havePermission) {
        return c.json({
            success: false,
            message: "Vous n'avez pas accès à cette analyse",
        }, 403)
    }

    const analyse = await getAnalysis(analysisId, projectId)

    return c.json({
        success: true,
        data: analyse
    })
})


export default analysis