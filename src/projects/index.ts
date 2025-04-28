import { OpenAPIHono } from '@hono/zod-openapi'
import { getProjectRoute, getProjectsRoute, postProjectRoute } from '@/projects/routes'
import { addProject, addProjectPolicies, addUser, addUserProjectRight, allAsync, getAllProjectAllow, getCookieData, getRoleId, getUserRole, isUserProjectOwner } from '@/helper'
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
        console.error("getProjectsRoute error: ", error);
        return c.json({
            success: false,
            message: "Erreur lors de la récupération des projets",
        }, 500)
    }
})

project.openapi(postProjectRoute, async (c) => {
    try {
        const body = c.req.valid('json');
        const { userId } = await getCookieData(c)
        const { project, users } = body
        const {newProjectId} = await addProject(project.name, userId)
        await addProjectPolicies(newProjectId)

        const haveUsers = users && users.length > 0
        if (haveUsers) {
            users.forEach(async (user) => {
                const roleId= getRoleId(user.role)
                const createUser = await addUser(user.name)
                await addUserProjectRight(createUser.lastID, roleId, newProjectId)
            })
        }

        return c.json({
            success: true,
            data:  {
                project: `Projet ${project.name} ajouté`,
                users: haveUsers ? `Utilisateur(s) ajouté(s) au projet` : "Aucun utilisateur ajouté",
            }
        })
    } catch (error) {
        console.error("postProjectRoute error: ", error);
        return c.json({
            success: false,
            message: "Erreur lors de la création du projet",
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




export default project;