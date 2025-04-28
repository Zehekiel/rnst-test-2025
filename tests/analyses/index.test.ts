import { Hono } from 'hono';
import analysisApp from '@/analyses/index'; // Import the Hono app instance
import { Analysis } from '@/types';

// --- Mocking Dependencies ---

// Mock @/helper
jest.mock('@/helper', () => ({
    getCookieData: jest.fn(),
    allAsync: jest.fn(),
    controlPermission: jest.fn(), // Generic permission checker
    getRoleId: jest.fn((roleName: string) => { // Simple mock for getRoleId
        if (roleName === 'Admin') return 1;
        if (roleName === 'Manager') return 2;
        if (roleName === 'Reader') return 3;
        return 0; // Default or unknown
    }),
    // getAsync & runAsync are used by helpers, no need to mock directly here
    // unless called directly by the route handlers themselves.
}));

// Mock @/users/helper
jest.mock('@/users/helper', () => ({
    getUserRole: jest.fn(),
    addUser: jest.fn(),
}));

// Mock @/analyses/helper (./helper relative to src/analyses/index.ts)
jest.mock('@/analyses/helper', () => ({
    getAllAnalysisAllowed: jest.fn(),
    addAnalysis: jest.fn(),
    addAnalysisPolicies: jest.fn(),
    addUserAnalyseRight: jest.fn(),
    getAnalysis: jest.fn(),
    deleteAnalysis: jest.fn(),
    updateAnalysis: jest.fn(),
}));

// Mock @/projects/helper
jest.mock('@/projects/helper', () => ({
    getProject: jest.fn(),
}));


// --- Accessing Mocked Functions ---
import {
    getCookieData,
    allAsync,
    controlPermission,
    getRoleId,
} from '@/helper';
import { addUser, getUserRole } from '@/users/helper';
import {
    getAllAnalysisAllowed,
    addAnalysis,
    addAnalysisPolicies,
    addUserAnalyseRight,
    getAnalysis,
    deleteAnalysis,
    updateAnalysis,
} from '@/analyses/helper'; // Use the correct path
import { getProject } from '@/projects/helper';

// Type assertion for mocks
const mockedGetCookieData = getCookieData as jest.Mock;
const mockedAllAsync = allAsync as jest.Mock;
const mockedControlPermission = controlPermission as jest.Mock;
const mockedGetRoleId = getRoleId as jest.Mock;
const mockedGetUserRole = getUserRole as jest.Mock;
const mockedAddUser = addUser as jest.Mock;
const mockedGetAllAnalysisAllowed = getAllAnalysisAllowed as jest.Mock;
const mockedAddAnalysis = addAnalysis as jest.Mock;
const mockedAddAnalysisPolicies = addAnalysisPolicies as jest.Mock;
const mockedAddUserAnalyseRight = addUserAnalyseRight as jest.Mock;
const mockedGetAnalysis = getAnalysis as jest.Mock;
const mockedDeleteAnalysis = deleteAnalysis as jest.Mock;
const mockedUpdateAnalysis = updateAnalysis as jest.Mock;
const mockedGetProject = getProject as jest.Mock;


// --- Test Suite ---

describe('Analysis Routes', () => {
    let app: Hono;

    beforeEach(() => {
        // Create a fresh Hono instance with the analysis routes for each test
        app = new Hono().route('/', analysisApp); // Mount at root for simpler paths in tests

        // Reset mocks (alternative to clearMocks in jest.config.js)
        // jest.clearAllMocks();

        // Default mock implementations
        mockedGetCookieData.mockResolvedValue({ userId: 'user123' });
        mockedGetUserRole.mockResolvedValue('reader'); // Default role
        mockedControlPermission.mockResolvedValue(true); // Default: permission granted
        mockedAllAsync.mockResolvedValue([]); // Default: empty array for DB queries
        mockedGetAllAnalysisAllowed.mockResolvedValue([]); // Default: empty array
        mockedGetProject.mockResolvedValue({ id: 'proj-xyz', name: 'Test Project', owner_id: 'owner456' }); // Default project exists
        mockedAddAnalysis.mockResolvedValue({ newAnalyseId: 99 }); // Default success
        mockedGetAnalysis.mockResolvedValue([]); // Default: analysis not found or empty array
    });

    // --- GET /projects/:projectId/analyses ---
    describe('GET /projects/:projectId/analyses', () => {
        const projectId = 1;
        const path = `/projects/${projectId}/analyses`;

        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should return all project analyses for an admin user', async () => {
            const mockAnalyses: Analysis[] = [{ id: 1, name: 'Analysis 1', owner_id: 123, project_id: projectId }];
            mockedGetUserRole.mockResolvedValueOnce('admin'); // Set user as admin
            mockedAllAsync.mockResolvedValueOnce(mockAnalyses); // Mock the direct DB query for admin

            const res = await app.request(path);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockAnalyses);
            expect(mockedGetUserRole).toHaveBeenCalledWith('user123', '0');
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM analyses WHERE project_id = ?', [projectId.toString()]);
            expect(mockedGetAllAnalysisAllowed).not.toHaveBeenCalled(); // Should not call this for admin
        });

        it('should return allowed project analyses for a non-admin user', async () => {
            const mockAllowedAnalyses: Analysis[] = [{ id: 2, name: 'Allowed Analysis', owner_id: 123, project_id: projectId }];
            mockedGetUserRole.mockResolvedValueOnce('manager'); // Non-admin role
            mockedGetAllAnalysisAllowed.mockResolvedValueOnce(mockAllowedAnalyses); // Mock the specific helper

            const res = await app.request(path);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockAllowedAnalyses);
            expect(mockedGetUserRole).toHaveBeenCalledWith('user123', '0');
            expect(mockedGetAllAnalysisAllowed).toHaveBeenCalledWith('user123', projectId.toString());
            expect(mockedAllAsync).not.toHaveBeenCalled(); // Should not call direct query for non-admin
        });

        it('should return 500 on error', async () => {
            mockedGetUserRole.mockRejectedValueOnce(new Error('DB error')); // Simulate error

            const res = await app.request(path);

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            // Check message based on your actual error response
            expect(json.message).toContain("Erreur lors de la récupération");
        });
    });

    // --- POST /projects/:projectId/analyses ---
    describe('POST /projects/:projectId/analyses', () => {
        const projectId = 'proj-xyz';
        const path = `/projects/${projectId}/analyses`;
        const analysisName = 'My New Analysis';
        const requestBody = {
            analysisName: analysisName,
            users: [{ name: 'testuser', role: 'Reader' }],
        };
        const requestBodyNoUsers = {
            analysisName: analysisName,
        };

        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should create analysis, add policies and users if permitted', async () => {
            const newAnalysisId = 99;
            const addedUserId = 55;
            const readerRoleId = 3;
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedGetProject.mockResolvedValueOnce({ id: projectId, name: 'Test Project', owner_id: 'owner456' }); // Project exists
            mockedAddAnalysis.mockResolvedValueOnce({ newAnalyseId: newAnalysisId });
            mockedAddUser.mockResolvedValueOnce({ lastID: addedUserId }); // Mock user creation/finding
            mockedGetRoleId.mockReturnValueOnce(readerRoleId); // Mock role ID lookup

            const req = new Request(`http://localhost${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(200); // Your route returns 200
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data.projectId).toContain('Test Project');
            expect(json.data.analysisId).toContain(analysisName);
            expect(json.data.users).toBe("Utilisateur(s) ajouté(s)");

            expect(mockedControlPermission).toHaveBeenCalledWith({ userId: 'user123', projectId: "", action: "write" });
            expect(mockedGetProject).toHaveBeenCalledWith(projectId);
            expect(mockedAddAnalysis).toHaveBeenCalledWith(analysisName, projectId, 'user123');
            expect(mockedAddAnalysisPolicies).toHaveBeenCalledWith(projectId, newAnalysisId);
            // Note: The forEach(async) loop makes precise assertion difficult without Promise.all
            // We check if the functions *inside* the loop were called at least once.
            expect(mockedAddUser).toHaveBeenCalledWith('testuser');
            expect(mockedGetRoleId).toHaveBeenCalledWith('Reader');
            expect(mockedAddUserAnalyseRight).toHaveBeenCalledWith(addedUserId, readerRoleId, newAnalysisId);
        });

        it('should create analysis without adding users if none provided', async () => {
            const newAnalysisId = 100;
            mockedControlPermission.mockResolvedValueOnce(true);
            mockedGetProject.mockResolvedValueOnce({ id: projectId, name: 'Test Project', owner_id: 'owner456' });
            mockedAddAnalysis.mockResolvedValueOnce({ newAnalyseId: newAnalysisId });

            const req = new Request(`http://localhost${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBodyNoUsers),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data.users).toBe("Aucun utilisateur ajouté");

            expect(mockedAddAnalysis).toHaveBeenCalledWith(analysisName, projectId, 'user123');
            expect(mockedAddAnalysisPolicies).toHaveBeenCalledWith(projectId, newAnalysisId);
            expect(mockedAddUser).not.toHaveBeenCalled();
            expect(mockedGetRoleId).not.toHaveBeenCalled();
            expect(mockedAddUserAnalyseRight).not.toHaveBeenCalled();
        });

        it('should return 401 if user lacks permission', async () => {
            mockedControlPermission.mockResolvedValueOnce(false); // No permission

            const req = new Request(`http://localhost${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(401);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain("Vous n'avez pas les droits");
            expect(mockedAddAnalysis).not.toHaveBeenCalled();
        });

        it('should return 403 if project does not exist', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedGetProject.mockResolvedValueOnce(null); // Project does NOT exist

            const req = new Request(`http://localhost${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Le projet n'existe pas");
            expect(mockedAddAnalysis).not.toHaveBeenCalled();
        });

        // Add test for error during addAnalysis or addAnalysisPolicies if needed
    });

    // --- GET /projects/:projectId/analyses/:analysisId ---
    describe('GET /projects/:projectId/analyses/:analysisId', () => {
        const projectId = 1;
        const analysisId = 1;
        const path = `/projects/${projectId}/analyses/${analysisId}`;
        const mockAnalysis: Analysis = { id: analysisId, name: 'Specific Analysis', owner_id: 1, project_id: projectId };

        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should return analysis details if permitted', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            // Note: getAnalysis helper returns an array, adjust mock accordingly
            mockedGetAnalysis.mockResolvedValueOnce([mockAnalysis]);

            const res = await app.request(path);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            // The route returns the array from the helper
            expect(json.data).toEqual([mockAnalysis]);
            expect(mockedControlPermission).toHaveBeenCalledWith({ userId: 'user123', projectId: projectId.toString(), analysisId: analysisId.toString(), action: "read" });
            expect(mockedGetAnalysis).toHaveBeenCalledWith(analysisId.toString(), projectId.toString());
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlPermission.mockResolvedValueOnce(false); // No permission

            const res = await app.request(path);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Vous n'avez pas accès à cette analyse");
            expect(mockedGetAnalysis).not.toHaveBeenCalled();
        });

        // Add test for analysis not found (getAnalysis returns empty array) if needed
    });

    // --- DELETE /projects/:projectId/analyses/:analysisId ---
    describe('DELETE /projects/:projectId/analyses/:analysisId', () => {
        const projectId = 'proj-789';
        const analysisId = 'analysis-del';
        const path = `/projects/${projectId}/analyses/${analysisId}`;

        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should delete the analysis if permitted', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedDeleteAnalysis.mockResolvedValueOnce(undefined); // Mock successful deletion

            const res = await app.request(path, { method: 'DELETE' });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toBe("Analyse supprimée avec succès");
            expect(mockedControlPermission).toHaveBeenCalledWith({ userId: 'user123', projectId, analysisId, action: "update" }); // Checks 'update' permission? Should maybe be 'delete'?
            expect(mockedDeleteAnalysis).toHaveBeenCalledWith(analysisId);
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlPermission.mockResolvedValueOnce(false); // No permission

            const res = await app.request(path, { method: 'DELETE' });

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Vous n'avez pas accès à cette analyse");
            expect(mockedDeleteAnalysis).not.toHaveBeenCalled();
        });

        it('should return 500 on deletion error', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedDeleteAnalysis.mockRejectedValueOnce(new Error('DB delete failed')); // Simulate error

            const res = await app.request(path, { method: 'DELETE' });

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Erreur lors de la suppression de l'analyse");
        });
    });

    // --- PUT /projects/:projectId/analyses/:analysisId ---
    describe('PUT /projects/:projectId/analyses/:analysisId', () => {
        const projectId = 'proj-upd';
        const analysisId = 'analysis-upd';
        const path = `/projects/${projectId}/analyses/${analysisId}`;
        const newName = 'Updated Analysis Name';
        const requestBody = { analysis: { name: newName } };

        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should update the analysis name if permitted', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedUpdateAnalysis.mockResolvedValueOnce(undefined); // Mock successful update

            const req = new Request(`http://localhost${path}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toBe(`Analyse ${newName} modifiée`);
            expect(mockedControlPermission).toHaveBeenCalledWith({ userId: 'user123', projectId, analysisId, action: "update" });
            expect(mockedUpdateAnalysis).toHaveBeenCalledWith(analysisId, newName);
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlPermission.mockResolvedValueOnce(false); // No permission

            const req = new Request(`http://localhost${path}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Vous n'avez pas accès à cette analyse");
            expect(mockedUpdateAnalysis).not.toHaveBeenCalled();
        });

        it('should return 500 on update error', async () => {
            mockedControlPermission.mockResolvedValueOnce(true); // Has permission
            mockedUpdateAnalysis.mockRejectedValueOnce(new Error('DB update failed')); // Simulate error

            const req = new Request(`http://localhost${path}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toBe("Erreur lors de la modification de l'analyse");
        });
    });
});
