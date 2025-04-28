import { OpenAPIHono } from '@hono/zod-openapi'
import { deleteProjectRoute, getProjectRoute, getProjectsRoute, postProjectRoute, updateProjectRoute } from '@/projects/routes'
import { allAsync, controlProjectPermission, getAsync, getCookieData, getRoleId } from '@/helper'
import { Project } from '@/types'
import { addProject, addProjectPolicies, addUserProjectRight, deleteProject, getAllProjectAllow, updateProject } from './helper'
import { getUserRole, addUser } from '@/users/helper'

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

        const hasPermission = await controlProjectPermission(userId, "", "write");

        if (!hasPermission) {
            return c.json({
                success: false,
                message: "Vous n'avez pas accès à créer un projet",
            }, 403)
        }

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

project.openapi(getProjectRoute, async (c) => {
    const { projectId } = c.req.valid('param')
    const { userId } = await getCookieData(c)

    const hasPermission = await controlProjectPermission(userId, projectId);
    
    if (hasPermission) {
        const sql = 'SELECT * FROM projects WHERE id = ?';
        const project = await getAsync<Project>(sql, [projectId]);
        return c.json({
            success: true,
            data: project,
        })
    } else {
        return c.json({
            success: false,
            message: "Vous n'avez pas accès à ce projet",
        }, 403)
    }
})

project.openapi(deleteProjectRoute, async (c) => {
    const { projectId } = c.req.valid('param')
    const { userId } = await getCookieData(c)

    const hasPermission = await controlProjectPermission(userId, projectId);
    
    if (hasPermission) {
        await deleteProject(projectId)
        return c.json({
            success: true,
            data: `Projet ${projectId} supprimé`,
        })
    }

    return c.json({
        success: false,
        message: "Vous n'avez pas accès à supprimer ce projet",
    }, 403)
})

project.openapi(updateProjectRoute, async (c) => {
    const { projectId } = c.req.valid('param')
    const { userId } = await getCookieData(c)
    const body = c.req.valid('json');
    const { project } = body

    const hasPermission = await controlProjectPermission(userId, projectId);

    if (!hasPermission) {
        return c.json({
            success: false,
            message: "Vous n'avez pas accès à modifier ce projet",
        }, 403)
    }
    await updateProject(projectId, project.name)
    return c.json({
        success: true,
        data:  `Projet ${project.name} modifié`,
    })
})

export default project;