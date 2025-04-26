import analysis from '@/analyses/index';


describe('Analysis Routes', () => {
    describe('GET /projects/:projectId/analyses', () => {
        it('should return success true and an empty data array', async () => {
            const projectId = 'proj-abc';
            const path = `/projects/${projectId}/analyses`;

            // Simulate a GET request to the route
            const res = await analysis.request(path, {
                method: 'GET',
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body).toEqual({
                success: true,
                data: [],
            });
        });
    });

    describe('GET /projects/:projectId/analyses/:analysisId', () => {
        it('should return success true and the extracted IDs', async () => {
            const projectId = 'proj-123';
            const analysisId = 'analysis-456';
            const path = `/projects/${projectId}/analyses/${analysisId}`;

            // Simulate a GET request
            const res = await analysis.request(path, {
                method: 'GET',
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body).toEqual({
                success: true,
                data: {
                    projectId: projectId, // The handler returns the actual IDs
                    analysisId: analysisId,
                },
            });
        });
    });

    describe('POST /projects/:projectId/analyses', () => {
        it('should return success true and confirmation messages', async () => {
            const projectId = 'proj-xyz';
            const path = `/projects/${projectId}/analyses`;
            const requestBody = {
                analysisId: 'new-analysis-789',
                users: ['user1', 'user2'], // Example with users
            };

            // Simulate a POST request with a JSON body
            const res = await analysis.request(path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body).toEqual({
                success: true,
                data: {
                    projectId: `Analyse ajoutée avec succès au projet ${projectId}`,
                    analysisId: `Analyse ${requestBody.analysisId} ajoutée avec succès`,
                    users: "Utilisateur(s) ajouté(s)",
                },
            });
        });

        it('should return success true and "Aucun utilisateur ajouté" when users are not provided', async () => {
            const projectId = 'proj-xyz';
            const path = `/projects/${projectId}/analyses`;
            const requestBody = {
                analysisId: 'another-analysis-000',
                // users property is omitted or null/undefined
            };

            // Simulate a POST request
            const res = await analysis.request(path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body).toEqual({
                success: true,
                data: {
                    projectId: `Analyse ajoutée avec succès au projet ${projectId}`,
                    analysisId: `Analyse ${requestBody.analysisId} ajoutée avec succès`,
                    users: "Aucun utilisateur ajouté",
                },
            });
        });
    });
});