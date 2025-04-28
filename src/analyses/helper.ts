import { actions, roles } from "@/constant";
import { allAsync, getAsync, runAsync } from "@/helper";
import { Analysis } from "@/types";

export async function getAllAnalysisAllowed(userId: string, projectId: string | number): Promise<Analysis[]> {
    try{
        // Prépare les paramètres pour la requête SQL
        const params: unknown[] = [
            projectId, // Pour la clause WHERE p.project_id = ? dans la première partie
            userId,    // Pour la clause WHERE p.owner_id = ? dans la première partie
            projectId, // Pour la clause WHERE p.project_id = ? dans la deuxième partie
            userId     // Pour la clause WHERE rp.user_id = ? dans la deuxième partie
        ];

        // Requête SQL modifiée pour filtrer par projectId et corriger la jointure
        const sql = `
            SELECT p.id, p.name, p.owner_id, p.project_id -- Ajout de project_id pour clarté
            FROM analyses p
            WHERE p.project_id = ? AND p.owner_id = ? -- Filtre par projet ET propriétaire
            UNION
            SELECT p.id, p.name, p.owner_id, p.project_id -- Ajout de project_id pour clarté
            FROM analyses p
            JOIN rights_analysis rp ON p.id = rp.analysis_id -- Correction: Jointure sur analysis_id
            WHERE p.project_id = ? AND rp.user_id = ? -- Filtre par projet ET droits utilisateur
        `;

        // Exécute la requête
        const analyses = await allAsync<Analysis>(sql, params);
        return analyses;
    } catch (error) {
        throw new Error("Erreur lors de la récupération des analyses : " + error);
    }
}

export async function addAnalysis(analysisName: string, projectId: string, userId: string) {
    try{
        const sql = `
        INSERT INTO analyses (name, project_id, owner_id)
        VALUES (?, ?, ?)
    `;
    const params = [analysisName, projectId, userId];
    const result = await runAsync(sql, params);
    return { newAnalyseId: result.lastID };

    } catch (error) {
        throw new Error("Erreur lors de l'ajout de l'analyse : " + error);
    }
}

export async function addAnalysisPolicies(projectId: string, analysisId: number) {
    const errors: string[] = [];
    const insertSql = `
        INSERT INTO analysis_policies (analysis_id, project_id, role_id, permission_level)
        VALUES (?, ?, ?, ?);
    `;

    try{
        const insertPromises: Promise<unknown>[] = []; 
        Object.values(roles).forEach(async(_, index) => {
            // Ajoute qu'une politique de lecture pour le rôle "Reader"
            if (index === 2) {
                const params = [analysisId, projectId, 3, "read"];
                insertPromises.push(
                    runAsync(insertSql, params).catch(err => {
                        // Si une insertion échoue, enregistre l'erreur
                        const errorMessage = `Error adding policy (Project: ${projectId}, Role: ${index}, Permission: ${"read"}, Analyse: ${analysisId}: Error: ${err.message}`;
                        errors.push(errorMessage);
                    })
                );
                return
            }
            Object.values(actions).forEach(async(action) => {
                const params = [analysisId, projectId, index + 1, action];
                insertPromises.push(
                    runAsync(insertSql, params).catch(err => {
                        // Si une insertion échoue, enregistre l'erreur
                        const errorMessage = `Error adding policy (Project: ${projectId}, Role: ${index}, Permission: ${action}), Analyse: ${analysisId}: Error: ${err.message}`;
                        errors.push(errorMessage);
                    })
                );
            })
        })

        return await Promise.all(insertPromises);
    }
    catch (error) {
        throw new Error(`Erreur lors de l'ajout des politiques d'analyse : ${error}/n ${errors.join('\n')}`);
    }
}

export async function addUserAnalyseRight(userId: number, roleId: number, analyseId: number) {
    try{
        const sql = `
            INSERT INTO rights_analysis (user_id, role_id, analysis_id)
            VALUES (?, ?, ?);
        `;
        const params = [userId, roleId, analyseId];
        return await runAsync(sql, params);
    } catch (error) {
        throw new Error(`Erreur lors de l'ajout du droit utilisateur d'une analyse : ${error}`);
    }
}

export async function getAnalysis(analysisId: string | number, projectId: string | number) {
    try{
        const sql = `
            SELECT *
            FROM analyses
            WHERE id = ? AND project_id = ?
        `;
        const analysis = await allAsync(sql, [analysisId, projectId]);
        return analysis;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de l'analyse : ${error}`);
    }
}

export async function isUserHaveAnalyseRight(userId: string, analysisId: string | undefined): Promise<boolean> {
    const sqlRight = `
        SELECT EXISTS (
            SELECT 1
            FROM rights_analysis
            WHERE user_id = ? AND analysis_id = ?
        ) AS has_access;
    `;
    const result = await getAsync<{ has_access: 0 | 1 }>(sqlRight, [userId, analysisId]);
    if (result?.has_access) {
        return true;
    }
    return false;
}

export async function deleteAnalysis(analysisId: string | number) {
    try{
        const projectSql = 'DELETE FROM analyses WHERE id = ?';
        await runAsync(projectSql, [analysisId]);
        const sql = 'DELETE FROM analysis_policies WHERE project_id = ?';
        await runAsync(sql, [analysisId]);
        const sqlRight = 'DELETE FROM rights_analysis WHERE project_id = ?';
        await runAsync(sqlRight, [analysisId]);
    } catch (error) {
        throw new Error(`Erreur lors de la suppression de l'analyse : ${error}`);
    }
}

export async function updateAnalysis(analysisId: string, name: string) {
    try{
        const sql = 'UPDATE analyses SET name = ? WHERE id = ?';
        return await runAsync(sql, [name, analysisId]);
    } catch (error) {
        throw new Error(`Erreur lors de la mise à jour de l'analyse : ${error}`);
    }
}