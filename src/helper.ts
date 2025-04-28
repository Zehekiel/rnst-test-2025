import database from "@/database";
import { cookieName, roles, secret } from "./constant";
import { getSignedCookie } from "hono/cookie";
import { Context, Env } from "hono";
import { getUserRole, isUserAnalyseOwner, isUserHaveProjectRight, isUserProjectOwner } from "./users/helper";
import { PermissionLevel } from "./types";
import { isUserHaveAnalyseRight } from "./analyses/helper";

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

export async function getCookieData(context: Context<Env, "/", Record<string, unknown>>) {
    const cookie = await getSignedCookie(context, secret)
    const user = cookie[cookieName] || '{}'
    const userId = JSON.parse(user).id
    const userName = JSON.parse(user).name
    return { userId, userName }
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

export async function controlPermission(props : {userId: string, projectId: string, analysisId?: string, action?: PermissionLevel}): Promise<boolean> {
    const { userId, projectId, analysisId, action } = props
    const role = await getUserRole(userId, projectId);
    const hightRole = await getUserRole(userId, "0");

    if (hightRole === "admin") {
        return true;
    }

    if (action){
        if (hightRole === "manager" && (action === "write")) {
            return true;
        }
        if (role === "read" && action === "read") {
            return true;
        }
    }

    const isOwner = await isUserProjectOwner(userId, projectId);
    if (isOwner) {
        return true;
    }

    if (analysisId) {
        const isAnalyseOwner = await isUserAnalyseOwner(userId, analysisId);
        if (isAnalyseOwner) {
            return true;
        }
    }
    const isProjectRight = await isUserHaveProjectRight(userId, projectId);
    if (isProjectRight) {
        return true;
    }

    const isAnalyseRight = await isUserHaveAnalyseRight(userId, analysisId);
    if (isAnalyseRight) {
        return true;
    }
    return false;
}