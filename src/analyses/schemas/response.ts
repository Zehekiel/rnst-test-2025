import { z } from 'zod';

export const analysesResponseSchema = z.object({
    success: z.boolean().describe('Indique si la requête a réussi'),
    data: z.array(
        z.string().describe("IDs d'analyse"),
    ).describe('Liste des analyses d\'un projet'),
});

export const postAnalysisResponseSchema = z.object({
    success: z.boolean().describe('Indique si la requête a réussi'),
    data: z.object({
        projectId: z.string().describe('ID du projet sur lequel l\'analyse a été ajoutée'),
        analysisId: z.string().describe('Message de confirmation d\'ajout d\'analyse'),
        users: z.string().describe('Message de confirmation d\'ajout d\'utilisateur'),
    }).describe('Liste des analyses d\'un projet'),
});

export const analysisResponseSchema = z.object({
    success: z.boolean().describe('Indique si la requête a réussi'),
    data: z.object({
        id: z.string().describe('ID de l\'analyse'),
        projectId: z.string().describe('ID du projet lié à l\'analyse'),
        ownerId: z.string().describe('ID de l\'utilisateur propriétaire de l\'analyse'),
        name: z.string().describe('Nom de l\'analyse'),
    }).describe('Liste des analyses d\'un projet'),
});
