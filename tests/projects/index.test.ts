import { Hono } from 'hono';
import projectApp from '@/projects/index'; // Import the Hono app instance from your projects/index.ts
import { Project } from '@/types';
import {
    getCookieData,
    allAsync,
    getAsync,
    controlProjectPermission,
    getRoleId,
} from '@/helper';
import {
    addProject,
    addProjectPolicies,
    addUserProjectRight,
    deleteProject,
    getAllProjectAllow,
    updateProject,
} from '@/projects/helper';
import { addUser, getUserRole } from '@/users/helper';


jest.mock('@/helper', () => ({
    getCookieData: jest.fn(),
    allAsync: jest.fn(),
    getAsync: jest.fn(),
    controlProjectPermission: jest.fn(),
    getRoleId: jest.fn((roleName: string) => { // Simple mock for getRoleId
        if (roleName === 'Admin') return 1;
        if (roleName === 'Manager') return 2;
        if (roleName === 'Reader') return 3;
        return 0; // Default or unknown
    }),
}));

jest.mock('@/projects/helper', () => ({
    addProject: jest.fn(),
    addProjectPolicies: jest.fn(),
    addUserProjectRight: jest.fn(),
    deleteProject: jest.fn(),
    getAllProjectAllow: jest.fn(),
    updateProject: jest.fn(),
}));

jest.mock('@/users/helper', () => ({
    getUserRole: jest.fn(),
    addUser: jest.fn(),
}));

const mockedGetCookieData = getCookieData as jest.Mock;
const mockedGetUserRole = getUserRole as jest.Mock;
const mockedAllAsync = allAsync as jest.Mock;
const mockedGetAsync = getAsync as jest.Mock;
const mockedControlProjectPermission = controlProjectPermission as jest.Mock;
const mockedGetRoleId = getRoleId as jest.Mock;
const mockedAddProject = addProject as jest.Mock;
const mockedAddProjectPolicies = addProjectPolicies as jest.Mock;
const mockedAddUserProjectRight = addUserProjectRight as jest.Mock;
const mockedDeleteProject = deleteProject as jest.Mock;
const mockedGetAllProjectAllow = getAllProjectAllow as jest.Mock;
const mockedUpdateProject = updateProject as jest.Mock;
const mockedAddUser = addUser as jest.Mock;


describe('Project Routes', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono().route('/projects', projectApp);
        jest.clearAllMocks();

        // --- Add Default Mock Implementations ---
        // It's good practice to set default behaviors here
        mockedGetCookieData.mockResolvedValue({ userId: 'user123' }); // Default logged-in user
        mockedGetUserRole.mockResolvedValue('reader'); // Default role for the user
        mockedControlProjectPermission.mockResolvedValue(true); // Default permission allowed
        mockedGetAllProjectAllow.mockResolvedValue([]); // Default empty projects for non-admin
        mockedAllAsync.mockResolvedValue([]); // Default empty projects for admin
        mockedGetAsync.mockResolvedValue(null); // Default not found for single project
        mockedAddProject.mockResolvedValue({ newProjectId: 1 }); // Default success for add
        mockedAddUser.mockResolvedValue({ lastID: 1 }); // Default success for add user
        // Add defaults for other mocks as needed
        mockedAddProjectPolicies.mockResolvedValue(undefined);
        mockedAddUserProjectRight.mockResolvedValue(undefined);
        mockedDeleteProject.mockResolvedValue(undefined);
        mockedUpdateProject.mockResolvedValue(undefined);
    });
    // --- GET /projects ---
    describe('GET /projects', () => {
        it('should return all projects for an admin user', async () => {
            const mockProjects: Project[] = [{ id: 1, name: 'Admin Project 1', owner_id: 1 }, { id: 2, name: 'Admin Project 2', owner_id: 1 }];
            mockedGetUserRole.mockResolvedValue('admin'); // Override role for this test
            mockedAllAsync.mockResolvedValueOnce(mockProjects);

            const res = await app.request('/projects');

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockProjects);
            expect(mockedGetUserRole).toHaveBeenCalledWith('user123', '0');
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM projects');
            expect(mockedGetAllProjectAllow).not.toHaveBeenCalled();
        });

        it('should return allowed projects for a non-admin user', async () => {
            const mockAllowedProjects: Project[] = [{ id: 2, name: 'Allowed Project', owner_id: 1 }];
            mockedGetUserRole.mockResolvedValueOnce('manager'); // Non-admin role
            mockedGetAllProjectAllow.mockResolvedValueOnce(mockAllowedProjects);

            const res = await app.request('/projects');

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockAllowedProjects);
            expect(mockedGetUserRole).toHaveBeenCalledWith('user123', '0');
            expect(mockedGetAllProjectAllow).toHaveBeenCalledWith('user123');
            expect(mockedAllAsync).not.toHaveBeenCalled();
        });

        it('should return 500 on error', async () => {
            mockedGetCookieData.mockRejectedValueOnce(new Error('Cookie error')); // Simulate error

            const res = await app.request('/projects');

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain('Erreur lors de la récupération des projets');
        });
    });

    // --- POST /projects ---
    describe('POST /projects', () => {
        const projectPayload = {
            project: { name: 'New Project' },
            users: [{ name: 'testuser', role: 'Reader' }],
        };

        it('should create a project and add users if permitted', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedAddProject.mockResolvedValueOnce({ newProjectId: 99 });
            mockedAddUser.mockResolvedValueOnce({ lastID: 'user999' }); // Mock the result of adding a user

            const req = new Request('http://localhost/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectPayload),
            });
            const res = await app.fetch(req);


            expect(res.status).toBe(200); // Your route returns 200, maybe 201 is better?
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data.project).toContain('New Project ajouté');
            expect(json.data.users).toContain('Utilisateur(s) ajouté(s)');

            expect(mockedControlProjectPermission).toHaveBeenCalledWith('user123', '', 'write');
            expect(mockedAddProject).toHaveBeenCalledWith('New Project', 'user123');
            expect(mockedAddProjectPolicies).toHaveBeenCalledWith(99);
            expect(mockedAddUser).toHaveBeenCalledWith('testuser');
            expect(mockedGetRoleId).toHaveBeenCalledWith('Reader');
            expect(mockedAddUserProjectRight).toHaveBeenCalledWith('user999', 3, 99); // Assumes Reader role ID is 3
        });

        it('should create a project without users if none provided', async () => {
            const payloadNoUsers = { project: { name: 'Solo Project' } };
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedAddProject.mockResolvedValueOnce({ newProjectId: 100 });

            const req = new Request('http://localhost/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadNoUsers),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data.project).toContain('Solo Project ajouté');
            expect(json.data.users).toContain('Aucun utilisateur ajouté');

            expect(mockedAddProject).toHaveBeenCalledWith('Solo Project', 'user123');
            expect(mockedAddProjectPolicies).toHaveBeenCalledWith(100);
            expect(mockedAddUser).not.toHaveBeenCalled();
            expect(mockedAddUserProjectRight).not.toHaveBeenCalled();
        });


        it('should return 403 if user lacks permission', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(false); // No permission

            const req = new Request('http://localhost/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectPayload),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain("Vous n'avez pas accès à créer un projet");
            expect(mockedAddProject).not.toHaveBeenCalled();
        });

        it('should return 500 on error during creation', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedAddProject.mockRejectedValueOnce(new Error('DB insert failed')); // Simulate error

            const req = new Request('http://localhost/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectPayload),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain('Erreur lors de la création du projet');
        });

        // TODO: Add test case for error during user addition loop (if needed)
        // Note: The current implementation with forEach(async) might not wait correctly.
        // Consider refactoring to use Promise.all for user addition.
    });

    // --- GET /projects/{projectId} ---
    describe('GET /projects/{projectId}', () => {
        const projectId = 1;
        const mockProject: Project = { id: projectId, name: 'Specific Project', owner_id: 1 };

        it('should return project details if permitted', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedGetAsync.mockResolvedValueOnce(mockProject);

            const res = await app.request(`/projects/${projectId}`);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockProject);
            expect(mockedControlProjectPermission).toHaveBeenCalledWith('user123', projectId.toString());
            expect(mockedGetAsync).toHaveBeenCalledWith('SELECT * FROM projects WHERE id = ?', [projectId.toString()]);
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(false); // No permission

            const res = await app.request(`/projects/${projectId}`);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain("Vous n'avez pas accès à ce projet");
            expect(mockedGetAsync).not.toHaveBeenCalled();
        });

        it('should return 500 if controlProjectPermission fails (example)', async () => {
            mockedControlProjectPermission.mockRejectedValueOnce(new Error('Permission check error'));

            const res = await app.request(`/projects/${projectId}`);
            // Depending on how errors are caught in the route, this might be 500
            // Adjust based on actual error handling if it differs
            expect(res.status).toBe(500); // Or check specific error handling if implemented
        });
    });

    // --- DELETE /projects/{projectId} ---
    describe('DELETE /projects/{projectId}', () => {
        const projectId = 'proj789';

        it('should delete the project if permitted', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedDeleteProject.mockResolvedValueOnce(undefined); // deleteProject might not return anything

            const res = await app.request(`/projects/${projectId}`, { method: 'DELETE' });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toContain(`Projet ${projectId} supprimé`);
            expect(mockedControlProjectPermission).toHaveBeenCalledWith('user123', projectId);
            expect(mockedDeleteProject).toHaveBeenCalledWith(projectId);
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(false); // No permission

            const res = await app.request(`/projects/${projectId}`, { method: 'DELETE' });

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain("Vous n'avez pas accès à supprimer ce projet");
            expect(mockedDeleteProject).not.toHaveBeenCalled();
        });

        it('should return 500 if deleteProject fails (example)', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedDeleteProject.mockRejectedValueOnce(new Error('DB delete error'));

            const res = await app.request(`/projects/${projectId}`, { method: 'DELETE' });
            expect(res.status).toBe(500); // Adjust if specific error handling exists
        });
    });

    // --- PUT /projects/{projectId} ---
    describe('PUT /projects/{projectId}', () => {
        const projectId = 'proj101';
        const updatePayload = { project: { name: 'Updated Project Name' } };

        it('should update the project if permitted', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedUpdateProject.mockResolvedValueOnce(undefined); // updateProject might not return anything

            const req = new Request(`http://localhost/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toContain('Updated Project Name modifié');
            expect(mockedControlProjectPermission).toHaveBeenCalledWith('user123', projectId);
            expect(mockedUpdateProject).toHaveBeenCalledWith(projectId, 'Updated Project Name');
        });

        it('should return 403 if user lacks permission', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(false); // No permission

            const req = new Request(`http://localhost/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });
            const res = await app.fetch(req);

            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.message).toContain("Vous n'avez pas accès à modifier ce projet");
            expect(mockedUpdateProject).not.toHaveBeenCalled();
        });

        it('should return 500 if updateProject fails (example)', async () => {
            mockedControlProjectPermission.mockResolvedValueOnce(true);
            mockedUpdateProject.mockRejectedValueOnce(new Error('DB update error'));

            const req = new Request(`http://localhost/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(500); // Adjust if specific error handling exists
        });
    });
});
