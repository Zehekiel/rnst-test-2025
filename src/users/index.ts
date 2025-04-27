import { OpenAPIHono } from '@hono/zod-openapi'
import { getCurrentDataRoute, getUserRoleRoute } from './route'
import { getSignedCookie } from 'hono/cookie';
import { cookieName, secret } from '@/constant';
import { getAsync } from '@/helper';
import { User, UserRole } from '@/types';

const usersRoute = new OpenAPIHono()

usersRoute.openapi(getCurrentDataRoute, async (c) => {
    const cookie = await getSignedCookie(c, secret)
    const user = cookie[cookieName] || '{}'
    const userId = JSON.parse(user).id
    // sql to get 
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

    if (projectId !== "{projectId}") {
        // return only the project role with Join
        const sql =`
            SELECT
                r.name AS role_name
            FROM
                rights_project rp
            JOIN
                roles r ON rp.role_id = r.id
            WHERE
                rp.user_id = ? AND rp.project_id = ?;
        `;
        const userRole = await getAsync<UserRole>(sql, [userId, projectId]);
        return c.json({
            success: true,
            data:  userRole?.role_name,
        })
    }

    if (analysisId !== "{analysisId}") {
        const sql = `
            SELECT
                r.name AS role_name
            FROM
                rights_analysis ra
            JOIN
                roles r ON ra.role_id = r.id
            WHERE
                ra.user_id = ? AND ra.analysis_id = ?;
        `;
        const userRole = await getAsync<UserRole>(sql, [userId, analysisId]);
        return c.json({
            success: true,
            data:  userRole?.role_name,
        })
    }

    return c.json({
        success: true,
        data:  "Aucun ID de projet ou d'analyse fourni",
    }, 500)
})

export default usersRoute;

