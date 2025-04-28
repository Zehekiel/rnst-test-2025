import { OpenAPIHono } from '@hono/zod-openapi'
import { getCurrentDataRoute, getUserAuthorizationRoute, getUserProjectRoute, getUserRoleRoute } from './route'
import { getSignedCookie } from 'hono/cookie';
import { cookieName, secret } from '@/constant';
import { allAsync, getAsync } from '@/helper';
import { Project, User, UserRole } from '@/types';
import { getAllProjectAllow } from '@/projects/helper';
import { getUserRole, isUserProjectOwner, isUserAnalyseOwner } from './helper';

const usersRoute = new OpenAPIHono()

usersRoute.openapi(getCurrentDataRoute, async (c) => {
    const cookie = await getSignedCookie(c, secret)
    const user = cookie[cookieName] || '{}'
    const userId = JSON.parse(user).id
    const sql = 'SELECT * FROM users WHERE id = ?';
    const userData = await getAsync<User>(sql, [userId]);

    return c.json({
        success: true,
        data:  userData,
    })
})

usersRoute.openapi(getUserRoleRoute, async (c) => {
    const projectId = c.req.param('projectId')
    const analysisId = c.req.param('analysisId')
    const userId = c.req.param('userId')

    try {
        const userRole = await getUserRole(userId, projectId, analysisId);
        return c.json({
            success: true,
            data:  userRole,
        })
    } catch  {
        return c.json({
            success: false,
            data:  "Aucun ID de projet ou d'analyse fourni",
        }, 500)
    }
})

usersRoute.openapi(getUserAuthorizationRoute    , async (c) => {
    const projectId = c.req.param('projectId')
    const analysisId = c.req.param('analysisId')
    const userId = c.req.param('userId')
    const action = c.req.param('action')

    let hasPermission = false

    const userRole = await getUserRole(userId, projectId, analysisId);

    if (userRole === "admin") {
        return c.json({
            success: true,
            data:  true,
        })
    }

    if (projectId !== "{projectId}") {
        const isOwner = await isUserProjectOwner(userId, projectId);
        if (isOwner) {
            return c.json({
                success: true,
                data:  true,
            })
        }

        // return only the project role with Join
        const projectAuthSql =`
            SELECT EXISTS (
                SELECT 1
                FROM rights_project rp
                JOIN project_policies pp ON rp.role_id = pp.role_id AND rp.project_id = pp.project_id
                WHERE rp.user_id = ? AND rp.project_id = ? AND pp.permission_level = ?
            ) AS has_permission;
        `;
        const result = await getAsync<{ has_permission: 0 | 1 }>(projectAuthSql, [userId, projectId, action]);
        hasPermission = !!result?.has_permission; // Convertit 0/1 en false/true
        return c.json({
            success: true,
            data:  hasPermission,
        })
    }

    if (analysisId !== "{analysisId}") {
        const isOwner = await isUserAnalyseOwner(userId, analysisId);
        if (isOwner) {
            return c.json({
                success: true,
                data:  true,
            })
        }


        const analyseSql = `
            SELECT
                r.name AS role_name
            FROM
                rights_analysis ra
            JOIN
                roles r ON ra.role_id = r.id
            WHERE
                ra.user_id = ? AND ra.analysis_id = ?;
        `;
        const userRole = await getAsync<UserRole>(analyseSql, [userId, analysisId]);
        return c.json({
            success: true,
            data:  userRole?.role_name,
        })
    }

    // Si aucun ID de projet ou d'analyse n'est fourni

    return c.json({
        success: true,
        data:  "Aucun ID de projet ou d'analyse fourni",
    }, 500)
})

usersRoute.openapi(getUserProjectRoute, async (c) => {
    try{
        const userId = c.req.param('userId')
        const userRole = await getUserRole(userId, "0");


        if (userRole === "admin") {
            const allProjectSql = 'SELECT * FROM projects';
            const allProjects = await allAsync<Project>(allProjectSql);

            return c.json({
                success: true,
                data:  allProjects,
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

export default usersRoute;

