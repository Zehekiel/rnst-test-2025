import { OpenAPIHono } from '@hono/zod-openapi'
import { getProjectRoute, getProjectsRoute, postProjectRoute } from '@/projects/routes'
import { allAsync, getAllProjectAllow, getCookieData, getUserRole, isUserProjectOwner } from '@/helper'
import { Project } from '@/types'

const project = new OpenAPIHono()


project.openapi(getProjectsRoute, async (c) => {
    try{
        const {userId} = await getCookieData(c)
        const userRole = await getUserRole(userId, "0");

        if (userRole === "admin") {
            const sql = 'SELECT * FROM projects';
            const projects = await allAsync<Project>(sql);

            return c.json({
                success: true,
                data:  projects,
            })
        }
        const projects = await getAllProjectAllow(userId);

        return c.json({
            success: true,
            data:  projects,
        })
    } catch (error) {
        console.error(error);
        return c.json({
            success: false,
            message: "Erreur lors de la récupération des projets",
        }, 500)
    }
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