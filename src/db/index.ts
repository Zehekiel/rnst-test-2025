import { OpenAPIHono } from '@hono/zod-openapi'
import { deleteSQLRoute, getAllAnalysisRoute, getAllProjectRoute, postInitSQLRoute } from './route'
import database from '@/database';
import { analysisPolicyTable,rightsProjectTable, rightsAnalysisTable,analysisTable, projectPolicyTable, projectTable, roleTable, userTable } from '@/db/modele';
import { getSignedCookie } from 'hono/cookie';
import { cookieName, secret } from '@/constant';
import { allAsync } from '../helper';
import { Analysis, Project } from '@/types';

const databaseRoute = new OpenAPIHono()


databaseRoute.openapi(postInitSQLRoute, async (c) => {
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
            database.run(`INSERT INTO users (id, name) VALUES (2, 'Manager')`);
            database.run(`INSERT INTO users (id, name) VALUES (3, 'Reader')`);
            database.run(`INSERT INTO users (id, name) VALUES (4, 'Admin')`);
        })

        database.serialize(() => {
            // Create different projects
            database.run(`INSERT INTO projects (id, name, owner_id) VALUES (1, 'Projet 1', ${userId})`);
            database.run(`INSERT INTO projects (id, name, owner_id) VALUES (2, 'Projet 2', 2)`);
            database.run(`INSERT INTO projects (id, name, owner_id) VALUES (3, 'Projet 3', 3)`);
        })

        database.serialize(() => {
            // Create different analysis
            database.run(`INSERT INTO analyses (id, name, owner_id, project_id) VALUES (1, 'Analyse 1', ${userId}, 1)`);
            database.run(`INSERT INTO analyses (id, name, owner_id, project_id) VALUES (2, 'Analyse 2', 2, 2)`);
            database.run(`INSERT INTO analyses (id, name, owner_id, project_id) VALUES (3, 'Analyse 3', 3, 3)`);
        })

        database.serialize(() => {
            // Add project policies for admin
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'write')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'read')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'update')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 1, 'delete')`);
            // Add project policies for manager
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (0, 2, 'write')`);

            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (1, 2, 'write')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (1, 2, 'read')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (1, 2, 'update')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (1, 2, 'delete')`);

            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (2, 2, 'write')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (2, 2, 'read')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (2, 2, 'update')`);
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (2, 2, 'delete')`);
            // Add project policies for reader
            database.run(`INSERT INTO project_policies (project_id, role_id, permission_level) VALUES (3, 3, 'read')`);
        })

        database.serialize(() => {
            // Add analysis policies for admin
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'write')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'read')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'update')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (0, 1, 'delete')`);
            // Add analysis policies for manager
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (1, 2, 'read')`);
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (2, 2, 'read')`);
            // Add analysis policies for reader
            database.run(`INSERT INTO analysis_policies (analysis_id, role_id, permission_level) VALUES (3, 3, 'read')`);
        })

        database.serialize(() => {
            // Add project right for current user who initialize the database
            database.run(`INSERT INTO rights_project (user_id, role_id, project_id) VALUES (${userId}, 1, 0)`);
            // Add project right for manager user
            database.run(`INSERT INTO rights_project (user_id, role_id, project_id) VALUES (2, 1, 1)`);
            database.run(`INSERT INTO rights_project (user_id, role_id, project_id) VALUES (2, 1, 2)`);
            // Add project right for reader user
            database.run(`INSERT INTO rights_project (user_id, role_id, project_id) VALUES (3, 3, 3)`);
        })

        database.serialize(() => {
            // Add analysis right for current user who initialize the database
            database.run(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (${userId}, 1, 0)`);
            // Add analysis right for manager user
            database.run(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (2, 2, 1)`);
            database.run(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (2, 2, 2)`);
            // Add analysis right for reader user
            database.run(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (3, 3, 2)`);
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

databaseRoute.openapi(getAllProjectRoute, async (c) => {
    const sql = 'SELECT * FROM projects';
    const projects = await allAsync<Project[]>(sql);

    return c.json({
        success: true,
        data:  projects,
    })
})

databaseRoute.openapi(getAllAnalysisRoute, async (c) => {
    const sql = 'SELECT * FROM analyses';
    const analysis = await allAsync<Analysis[]>(sql);

    return c.json({
        success: true,
        data:  analysis,
    })
})

export default databaseRoute;

