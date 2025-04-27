import database from "@/database";
import { UserRole } from "./types";

// Wrapper pour db.get
export function getAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        database.get(sql, params, (err: Error | null, row: T) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Wrapper pour db.all
export function allAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
        // Utilise database.all pour récupérer toutes les lignes
        database.all(sql, params, (err: Error | null, rows: T[]) => {
            if (err) {
                reject(err);
            } else {
                // Retourne un tableau de lignes (peut être vide si rien n'est trouvé)
                resolve(rows);
            }
        });
    });
}

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