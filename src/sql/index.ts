import { OpenAPIHono } from '@hono/zod-openapi'
import { deleteSQLRoute, getInitSQLRoute } from './route'
import database from '@/database';
import { analysisPermissionsTable, analysisTable, projectPermissionsTable, projectTable, roleTable, userTable } from '@/sql/modele';

const databaseRoute = new OpenAPIHono()


databaseRoute.openapi(getInitSQLRoute, (c) => {
    database.serialize(() => {
        database.run(userTable);
        database.run(roleTable);
        database.run(projectTable);
        database.run(analysisTable);
        database.run(projectPermissionsTable);
        database.run(analysisPermissionsTable);
    });

    return c.json({
        success: true,
        data:  "Base de données initialisée",
    })
})

databaseRoute.openapi(deleteSQLRoute, (c) => {   
    database.serialize(() => {
        database.run(`DROP TABLE IF EXISTS users`);
        database.run(`DROP TABLE IF EXISTS roles`);
        database.run(`DROP TABLE IF EXISTS projects`);
        database.run(`DROP TABLE IF EXISTS analyses`);
        database.run(`DROP TABLE IF EXISTS project_permissions`);
        database.run(`DROP TABLE IF EXISTS analysis_permissions`);
    });

    return c.json({
        success: true,
        data:  "Base de données supprimée",
    })
})


export default databaseRoute;

