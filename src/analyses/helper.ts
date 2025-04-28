import { allAsync } from "@/helper";
import { Analysis } from "@/types";

export async function getAllAnalysisAllowed(userId: string, projectId: string | number): Promise<Analysis[]> {
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
}

