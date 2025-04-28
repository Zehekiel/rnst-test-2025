import { roles, actions } from "@/constant";
import { allAsync, runAsync } from "@/helper";
import { Project } from "@/types";

export async function deleteProject(projectId: string) {
    try{
        const projectSql = 'DELETE FROM projects WHERE id = ?';
        await runAsync(projectSql, [projectId]);
        const sql = 'DELETE FROM project_policies WHERE project_id = ?';
        await runAsync(sql, [projectId]);
        const sqlRight = 'DELETE FROM rights_project WHERE project_id = ?';
        await runAsync(sqlRight, [projectId]);
        const sqlAnalysis = 'DELETE FROM analyses WHERE project_id = ?';
        await runAsync(sqlAnalysis, [projectId]);
    } catch (error) {
        throw new Error(`Erreur lors de la suppression du projet : ${error}`);
    }
}
export async function addUserProjectRight(userId: number, roleId: number, projectId: number) {
    try{
        const sql = `
            INSERT INTO rights_project (user_id, role_id, project_id)
            VALUES (?, ?, ?);
        `;
        const params = [userId, roleId, projectId];
        return await runAsync(sql, params);
    } catch (error) {
        throw new Error(`Erreur lors de l'ajout du droit utilisateur : ${error}`);
    }
}

export async function addProjectPolicies(projectId: number) {
    const errors: string[] = [];
    const insertSql = `
        INSERT INTO project_policies (project_id, role_id, permission_level)
        VALUES (?, ?, ?);
    `;

    try{
        const insertPromises: Promise<unknown>[] = []; 
        Object.values(roles).forEach(async(_, index) => {
            // Ajoute qu'une politique de lecture pour le rôle "Reader"
            if (index === 2) {
                const params = [projectId, 3, "read"];
                insertPromises.push(
                    runAsync(insertSql, params).catch(err => {
                        // Si une insertion échoue, enregistre l'erreur
                        const errorMessage = `Error adding policy (Project: ${projectId}, Role: ${index}, Permission: ${"read"}): ${err.message}`;
                        errors.push(errorMessage);
                    })
                );
                return
            }
            Object.values(actions).forEach(async(action) => {
                const params = [projectId, index + 1, action];
                insertPromises.push(
                    runAsync(insertSql, params).catch(err => {
                        // Si une insertion échoue, enregistre l'erreur
                        const errorMessage = `Error adding policy (Project: ${projectId}, Role: ${index}, Permission: ${action}): ${err.message}`;
                        errors.push(errorMessage);
                    })
                );
            })
        })

        return await Promise.all(insertPromises);
    }
    catch (error) {
        throw new Error(`Erreur lors de l'ajout des politiques de projet : ${error}/n ${errors.join('\n')}`);
    }
}

export async function addProject(name: string, ownerId: string): Promise<{ newProjectId: number }> {
    
    try{   
        const sql = `
            INSERT INTO projects (name, owner_id)
            VALUES (?, ?);
            ON CONFLICT(name) DO NOTHING; 
        `;
        const params = [name, ownerId];
        const result = await runAsync(sql, params);
        const { lastID } = result;
        return { newProjectId:lastID }
    } catch (error) {
        throw new Error(`Erreur lors de l'ajout du projet : ${error}`);
    }
}

export async function getAllProjectAllow(userId: string): Promise<Project[]> {
    const params: unknown[] = [];
    const sql = `
            SELECT p.id, p.name, p.owner_id
            FROM projects p
            WHERE p.owner_id = ?
            UNION
            SELECT p.id, p.name, p.owner_id
            FROM projects p
            JOIN rights_project rp ON p.id = rp.project_id
            WHERE rp.user_id = ?
        `;
        params.push(userId, userId); // Add userId twice for the UNION query
        const projects = await allAsync<Project>(sql, params);
        return projects
}


export async function updateProject(projectId: string, name: string) {
    try{
        const sql = 'UPDATE projects SET name = ? WHERE id = ?';
        return await runAsync(sql, [name, projectId]);
    } catch (error) {
        throw new Error(`Erreur lors de la mise à jour du projet : ${error}`);
    }
}