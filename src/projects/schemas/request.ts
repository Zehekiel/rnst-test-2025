import { z } from 'zod';

export const getProjectQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet')
});

export const postProjectBodySchema = z.object({
    project: z.string(),
    users: z.array(z.string()).optional(),
});