import database from "@/database";
import { Project, UserRole } from "./types";
import { actions, cookieName, roles, secret } from "./constant";
import { getSignedCookie } from "hono/cookie";
import { Context, Env } from "hono";
import { useActionState } from "hono/jsx";

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

export function runAsync(sql: string, params?: unknown[]): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
        // Utilise function() pour accéder à this.lastID et this.changes
        database.run(sql, params, function (err: Error | null) {
            if (err) {
                reject(err);
            } else {
                // Retourne l'ID de la dernière ligne insérée et le nombre de lignes modifiées
                resolve({ lastID: this.lastID, changes: this.changes });
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

export async function getCookieData(context: Context<Env, "/", Record<string, unknown>>) {
    const cookie = await getSignedCookie(context, secret)
    const user = cookie[cookieName] || '{}'
    const userId = JSON.parse(user).id
    const userName = JSON.parse(user).name
    return { userId, userName }
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

export function getRoleId(roleName: string): number {
    const roleId: number = Object.values(roles).reduce((acc, role, index) => {
        if (role === roleName) {
            return index + 1;
        }
        return acc;
    }, -1);
    if (roleId === -1) {
        throw new Error(`Rôle ${roleName} non valide`);
    }
    return roleId
};

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
