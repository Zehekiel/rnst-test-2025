import {
    deleteProject,
    addUserProjectRight,
    addProjectPolicies,
    addProject,
    getAllProjectAllow,
    updateProject,
} from '@/projects/helper'; // Adjust path if needed
import { runAsync, allAsync } from '@/helper';
import { roles, actions } from '@/constant'; // Import constants used by addProjectPolicies
import { Project } from '@/types';

// Mock the @/helper module
jest.mock('@/helper', () => ({
    runAsync: jest.fn(),
    allAsync: jest.fn(),
}));

// Mock the @/constant module (only if needed, e.g., if values change)
// If roles and actions are stable, direct import is fine.
// jest.mock('@/constant', () => ({
//     roles: { Admin: 'Admin', Manager: 'Manager', Reader: 'Reader' }, // Example values
//     actions: { read: 'read', write: 'write', update: 'update', delete: 'delete' }, // Example values
// }));

// Type assertion for the mocked functions
const mockedRunAsync = runAsync as jest.Mock;
const mockedAllAsync = allAsync as jest.Mock;

describe('Project Helper Functions', () => {

    beforeEach(() => {
        // Clear mock calls and reset implementations before each test
        mockedRunAsync.mockClear();
        mockedAllAsync.mockClear();
        mockedRunAsync.mockResolvedValue({ lastID: 0, changes: 1 }); // Default success for runAsync
        mockedAllAsync.mockResolvedValue([]); // Default empty array for allAsync
    });

    // --- Tests for deleteProject ---
    describe('deleteProject', () => {
        const projectId = 'proj-123';

        it('should call runAsync 4 times with correct SQL for deletion', async () => {
            await deleteProject(projectId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(4);
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM projects WHERE id = ?', [projectId]);
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM project_policies WHERE project_id = ?', [projectId]);
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM rights_project WHERE project_id = ?', [projectId]);
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM analyses WHERE project_id = ?', [projectId]);
        });

        it('should throw an error if any runAsync call fails', async () => {
            const dbError = new Error('DB delete failed');
            mockedRunAsync.mockRejectedValueOnce(dbError); // Simulate failure on the first call

            await expect(deleteProject(projectId)).rejects.toThrow(`Erreur lors de la suppression du projet : ${dbError}`);
            expect(mockedRunAsync).toHaveBeenCalledTimes(1); // Should stop after the first error
        });
    });

    // --- Tests for addUserProjectRight ---
    describe('addUserProjectRight', () => {
        const userId = 99;
        const roleId = 3;
        const projectId = 101;

        it('should call runAsync with correct SQL and params for insertion', async () => {
            const expectedSql = `
            INSERT INTO rights_project (user_id, role_id, project_id)
            VALUES (?, ?, ?);
        `;
            await addUserProjectRight(userId, roleId, projectId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining(expectedSql.trim()), [userId, roleId, projectId]);
        });

        it('should return the result of runAsync on success', async () => {
            const mockResult = { lastID: 5, changes: 1 };
            mockedRunAsync.mockResolvedValueOnce(mockResult);

            const result = await addUserProjectRight(userId, roleId, projectId);
            expect(result).toEqual(mockResult);
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB insert failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(addUserProjectRight(userId, roleId, projectId)).rejects.toThrow(`Erreur lors de l'ajout du droit utilisateur : ${dbError}`);
        });
    });

    // --- Tests for addProjectPolicies ---
    describe('addProjectPolicies', () => {
        const projectId = 202;
        const roleKeys = Object.keys(roles); // ["Admin", "Manager", "Reader"]
        const actionValues = Object.values(actions); // ["read", "write", "update", "delete"]

        it('should call runAsync for each role and action, except Reader only gets read', async () => {
            await addProjectPolicies(projectId);

            // Expected calls:
            // Admin (roleId 1): read, write, update, delete (4 calls)
            // Manager (roleId 2): read, write, update, delete (4 calls)
            // Reader (roleId 3): read (1 call)
            const expectedCalls = (roleKeys.length - 1) * actionValues.length + 1;

            expect(mockedRunAsync).toHaveBeenCalledTimes(expectedCalls);

            // Check Reader specific call
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 3, 'read']);

            // Check Admin calls (example)
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 1, 'read']);
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 1, 'write']);
            // ... other Admin actions

            // Check Manager calls (example)
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 2, 'read']);
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 2, 'write']);
            // ... other Manager actions

            // Ensure Reader didn't get other actions
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 3, 'write']);
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 3, 'update']);
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO project_policies'), [projectId, 3, 'delete']);
        });

        it('should resolve even if some insertions fail (due to catch inside loop)', async () => {
            const dbError = new Error('DB insert failed');
            // Simulate failure for one specific call (e.g., Admin-write)
            mockedRunAsync.mockImplementation(async (sql, params) => {
                if (params && params[1] === 1 && params[2] === 'write') {
                    throw dbError;
                }
                return { lastID: 0, changes: 1 };
            });

            // The function itself should still resolve because Promise.all waits for all promises,
            // and the individual catches prevent Promise.all from rejecting immediately.
            // The outer try/catch in the original function is unlikely to be hit unless Promise.all itself fails.
            await expect(addProjectPolicies(projectId)).resolves.toBeDefined();

            // Verify all expected calls were still attempted
            const expectedCalls = (roleKeys.length - 1) * actionValues.length + 1;
            expect(mockedRunAsync).toHaveBeenCalledTimes(expectedCalls);
        });

        // Note: Testing the error message construction in the final catch block is hard
        // because Promise.all is unlikely to reject when individual promises have .catch.
        // You might refactor the error handling in addProjectPolicies if you need to test that specific path.
    });

    // --- Tests for addProject ---
    describe('addProject', () => {
        const projectName = 'New Test Project';
        const ownerId = 'owner-456';

        it('should call runAsync with correct SQL and params, including ON CONFLICT', async () => {
            const expectedSql = `
            INSERT INTO projects (name, owner_id)
            VALUES (?, ?);
            ON CONFLICT(name) DO NOTHING;
        `;
            mockedRunAsync.mockResolvedValueOnce({ lastID: 303, changes: 1 });

            await addProject(projectName, ownerId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(expect.stringContaining(expectedSql.trim()), [projectName, ownerId]);
        });

        it('should return the new project ID on success', async () => {
            const mockLastId = 303;
            mockedRunAsync.mockResolvedValueOnce({ lastID: mockLastId, changes: 1 });

            const result = await addProject(projectName, ownerId);

            expect(result).toEqual({ newProjectId: mockLastId });
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB insert failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(addProject(projectName, ownerId)).rejects.toThrow(`Erreur lors de l'ajout du projet : ${dbError}`);
        });
    });

    // --- Tests for getAllProjectAllow ---
    describe('getAllProjectAllow', () => {
        const userId = 'user-789';

        it('should call allAsync with correct UNION SQL and params', async () => {
            const expectedSql = `
            SELECT p.id, p.name, p.owner_id
            FROM projects p
            WHERE p.owner_id = ?
            UNION
            SELECT p.id, p.name, p.owner_id
            FROM projects p
            JOIN rights_project rp ON p.id = rp.project_id
            WHERE rp.user_id = ?
        `;
            await getAllProjectAllow(userId);

            expect(mockedAllAsync).toHaveBeenCalledTimes(1);
            expect(mockedAllAsync).toHaveBeenCalledWith(expect.stringContaining(expectedSql.trim()), [userId, userId]);
        });

        it('should return the projects array from allAsync', async () => {
            const mockProjects: Project[] = [{ id: 1, name: 'Owned Project', owner_id: 1 }, { id: 5, name: 'Shared Project', owner_id: 1 }];
            mockedAllAsync.mockResolvedValueOnce(mockProjects);

            const result = await getAllProjectAllow(userId);

            expect(result).toEqual(mockProjects);
        });

        it('should return empty array if allAsync returns empty', async () => {
            mockedAllAsync.mockResolvedValueOnce([]); // Default behavior, but explicit here

            const result = await getAllProjectAllow(userId);

            expect(result).toEqual([]);
        });

        // Note: The original function doesn't have explicit error handling for allAsync.
        // If allAsync rejects, the error will propagate up.
        it('should propagate error if allAsync fails', async () => {
            const dbError = new Error('DB select failed');
            mockedAllAsync.mockRejectedValueOnce(dbError);

            await expect(getAllProjectAllow(userId)).rejects.toThrow(dbError);
        });
    });

    // --- Tests for updateProject ---
    describe('updateProject', () => {
        const projectId = 'proj-upd-1';
        const newName = 'Updated Project Name';

        it('should call runAsync with correct SQL and params for update', async () => {
            await updateProject(projectId, newName);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith('UPDATE projects SET name = ? WHERE id = ?', [newName, projectId]);
        });

        it('should return the result of runAsync on success', async () => {
            const mockResult = { lastID: 0, changes: 1 };
            mockedRunAsync.mockResolvedValueOnce(mockResult);

            const result = await updateProject(projectId, newName);
            expect(result).toEqual(mockResult);
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB update failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(updateProject(projectId, newName)).rejects.toThrow(`Erreur lors de la mise à jour du projet : ${dbError}`);
        });
    });
});
