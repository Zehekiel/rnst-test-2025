import { OpenAPIHono } from '@hono/zod-openapi'
import { deleteSQLRoute, getCurrentDataRoute, getInitSQLRoute } from './route'
import database from '@/database';
import { analysisPolicyTable,rightsProjectTable, rightsAnalysisTable,analysisTable, projectPolicyTable, projectTable, roleTable, userTable } from '@/sql/modele';
import { getSignedCookie } from 'hono/cookie';
import { cookieName, secret } from '@/constant';
import { getAsync } from './helper';
import { User } from '@/types';

const databaseRoute = new OpenAPIHono()


databaseRoute.openapi(getInitSQLRoute, async (c) => {
    try {
        
        const cookie = await getSignedCookie(c, secret)
        const user = cookie[cookieName] || '{}'
        const userId = JSON.parse(user).id
        const userName = JSON.parse(user).name

        database.serialize(() => {
            database.run(userTable);
            database.run(roleTable);
            database.run(projectTable);
            database.run(analysisTable);
            database.run(projectPolicyTable);
            database.run(analysisPolicyTable);
            database.run(rightsProjectTable);
            database.run(rightsAnalysisTable);
        });

        database.serialize(() => {
            // Add default roles
            database.run(`INSERT INTO roles (name, id) VALUES ('admin', 1)`);
            database.run(`INSERT INTO roles (name, id) VALUES ('manager', 2)`);
            database.run(`INSERT INTO roles (name, id) VALUES ('reader', 3)`);
        });

        database.serialize(() => {
            // Create the current user as admin
            database.run(`INSERT INTO users (id, name) VALUES (${userId}, '${userName}')`);
        })

        database.serialize(() => {
            // Create a project for the current user
            database.run(`INSERT INTO projects (id, name, owner_id) VALUES (1, 'Projet 1', ${userId})`);
        })

        database.serialize(() => {
            // Add project policies for admin
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'write')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'read')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'update')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'delete')`);
        })
        
        database.serialize(() => {
            // Add analysis policies for admin
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'write')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'read')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'update')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'delete')`);
        })

        database.serialize(() => {
            // Add project right for current user who initialize the database
            database.run(`INSERT INTO rights_project (user_id, role_id, project_id) VALUES (${userId}, 1, 1)`);
        })

        database.serialize(() => {
            // Add analysis right for current user who initialize the database
            database.run(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (${userId}, 1, 1)`);
        })


        return c.json({
            success: true,
            data:  "Base de données initialisée",
        }, 200)
    } catch (error) {
        console.error(error);
        return c.json({
            success: false,
            message: "Erreur lors de l'initialisation de la base de données",
        }, 500)
    }
})

databaseRoute.openapi(deleteSQLRoute, (c) => {   
    database.serialize(() => {
        database.run(`DROP TABLE IF EXISTS users`);
        database.run(`DROP TABLE IF EXISTS roles`);
        database.run(`DROP TABLE IF EXISTS projects`);
        database.run(`DROP TABLE IF EXISTS analyses`);
        database.run(`DROP TABLE IF EXISTS project_policies`);
        database.run(`DROP TABLE IF EXISTS analysis_policies`);
        database.run(`DROP TABLE IF EXISTS rights_project`);
        database.run(`DROP TABLE IF EXISTS rights_analysis`);
    });

    return c.json({
        success: true,
        data:  "Base de données supprimée",
    })
})

databaseRoute.openapi(getCurrentDataRoute, async (c) => {
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

export default databaseRoute;

