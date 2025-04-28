import { getAsync, runAsync } from "@/helper";
import { UserRole } from "@/types";

export async function getUserRole(userId: string, projectId?: string, analysisId?: string): Promise<string | undefined> {
    if (projectId !== "{projectId}") {
        const projectSql =`
            SELECT
                r.name AS role_name
            FROM
                rights_project rp
            JOIN
                roles r ON rp.role_id = r.id
            WHERE
                rp.user_id = ? AND rp.project_id = ?;
        `;
        const userRole = await getAsync<UserRole>(projectSql, [userId, projectId]);
        return userRole?.role_name
    }

    if (analysisId !== "{analysisId}") {
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
        return userRole?.role_name
    }

    return undefined
}

export async function isUserProjectOwner(userId: string | number, projectId: string | number): Promise<boolean> {
    const sql = `
        SELECT EXISTS (
            SELECT 1
            FROM projects
            WHERE id = ? AND owner_id = ?
        ) AS is_owner;
    `;
    const result = await getAsync<{ is_owner: 0 | 1 }>(sql, [projectId, userId]);
    return !!result?.is_owner;
}

export async function isUserAnalyseOwner(userId: string | number, analysisId: string | number): Promise<boolean> {
    const sql = `
        SELECT EXISTS (
            SELECT 1
            FROM analyses
            WHERE id = ? AND owner_id = ?
        ) AS is_owner;
    `;
    const result = await getAsync<{ is_owner: 0 | 1 }>(sql, [analysisId, userId]);
    return !!result?.is_owner;
}

export async function isUserHaveProjectRight(userId: string, projectId: string): Promise<boolean> {
    const sqlRight = `
        SELECT EXISTS (
            SELECT 1
            FROM rights_project
            WHERE user_id = ? AND project_id = ?
        ) AS has_access;
    `;
    const result = await getAsync<{ has_access: 0 | 1 }>(sqlRight, [userId, projectId]);
    if (result?.has_access) {
        return true;
    }
    return false;
}

export async function addUser(name: string){
    try{
        const sql = `
            INSERT INTO users (name)
            VALUES (?);
        `;
        const params = [name];
        return await runAsync(sql, params);
    } catch (error) {
        throw new Error(`Erreur lors de l'ajout de l'utilisateur : ${error}`);
    }
}