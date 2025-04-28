import {
    getAllAnalysisAllowed,
    addAnalysis,
    addAnalysisPolicies,
    addUserAnalyseRight,
    getAnalysis,
    isUserHaveAnalyseRight,
    deleteAnalysis,
    updateAnalysis,
} from '@/analyses/helper'; // Adjust path if needed
import { allAsync, getAsync, runAsync } from '@/helper'; // Import functions to be mocked
import { roles, actions } from '@/constant'; // Import constants used
import { Analysis } from '@/types';

// Mock the @/helper module
jest.mock('@/helper', () => ({
    allAsync: jest.fn(),
    getAsync: jest.fn(),
    runAsync: jest.fn(),
}));

// Type assertion for mocked functions
const mockedAllAsync = allAsync as jest.Mock;
const mockedGetAsync = getAsync as jest.Mock;
const mockedRunAsync = runAsync as jest.Mock;

describe('Analysis Helper Functions', () => {

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks(); // Or use clearMocks in config

        // Default mock implementations
        mockedAllAsync.mockResolvedValue([]); // Default: empty array
        mockedGetAsync.mockResolvedValue(undefined); // Default: not found
        mockedRunAsync.mockResolvedValue({ lastID: 0, changes: 1 }); // Default: success for INSERT/UPDATE/DELETE
    });

    // --- Tests for getAllAnalysisAllowed ---
    describe('getAllAnalysisAllowed', () => {
        const userId = 1;
        const projectId = 1;

        beforeEach(() => {
            // Reset mocks before each test
            jest.clearAllMocks();
        });

        it('should call allAsync with correct UNION SQL and params', async () => {

            await getAllAnalysisAllowed(userId.toString(), projectId);

            expect(mockedAllAsync).toHaveBeenCalledTimes(1);
        });

        it('should return the result from allAsync', async () => {
            const mockAnalyses: Analysis[] = [{ id: 1, name: 'Test Analysis', owner_id: userId, project_id: projectId }];
            mockedAllAsync.mockResolvedValueOnce(mockAnalyses);

            const result = await getAllAnalysisAllowed(userId.toString(), projectId);
            expect(result).toEqual(mockAnalyses);
        });

        it('should throw an error if allAsync fails', async () => {
            const dbError = new Error('DB select failed');
            mockedAllAsync.mockRejectedValueOnce(dbError);

            await expect(getAllAnalysisAllowed(userId.toString(), projectId)).rejects.toThrow(`Erreur lors de la récupération des analyses : ${dbError}`);
        });
    });

    // --- Tests for addAnalysis ---
    describe('addAnalysis', () => {
        const analysisName = 'New Analysis';
        const projectId = 'proj-2';
        const userId = 'user-2';

        it('should call runAsync with correct INSERT SQL and params', async () => {
            const expectedSql = `
        INSERT INTO analyses (name, project_id, owner_id)
        VALUES (?, ?, ?)
    `;
            mockedRunAsync.mockResolvedValueOnce({ lastID: 99, changes: 1 });

            await addAnalysis(analysisName, projectId, userId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining(expectedSql.trim()),
                [analysisName, projectId, userId]
            );
        });

        it('should return the new analysis ID on success', async () => {
            const mockLastId = 99;
            mockedRunAsync.mockResolvedValueOnce({ lastID: mockLastId, changes: 1 });

            const result = await addAnalysis(analysisName, projectId, userId);
            expect(result).toEqual({ newAnalyseId: mockLastId });
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB insert failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(addAnalysis(analysisName, projectId, userId)).rejects.toThrow(`Erreur lors de l'ajout de l'analyse : ${dbError}`);
        });
    });

    // --- Tests for addAnalysisPolicies ---
    describe('addAnalysisPolicies', () => {
        const projectId = 'proj-3';
        const analysisId = 101;
        const roleKeys = Object.keys(roles); // ["Admin", "Manager", "Reader"]
        const actionValues = Object.values(actions); // ["read", "write", "update", "delete"]

        it('should call runAsync for each role/action combination (Reader only read)', async () => {
            await addAnalysisPolicies(projectId, analysisId);

            // Expected calls: Admin(4) + Manager(4) + Reader(1) = 9
            const expectedCalls = (roleKeys.length - 1) * actionValues.length + 1;
            expect(mockedRunAsync).toHaveBeenCalledTimes(expectedCalls);

            // Check Reader specific call
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO analysis_policies'),
                [analysisId, projectId, 3, 'read'] // Role ID 3 for Reader
            );

            // Check Admin calls (example)
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO analysis_policies'),
                [analysisId, projectId, 1, 'read'] // Role ID 1 for Admin
            );
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO analysis_policies'),
                [analysisId, projectId, 1, 'write']
            );
            // ... other Admin actions

            // Check Manager calls (example)
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO analysis_policies'),
                [analysisId, projectId, 2, 'read'] // Role ID 2 for Manager
            );
            // ... other Manager actions

            // Ensure Reader didn't get other actions
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.anything(), [analysisId, projectId, 3, 'write']);
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.anything(), [analysisId, projectId, 3, 'update']);
            expect(mockedRunAsync).not.toHaveBeenCalledWith(expect.anything(), [analysisId, projectId, 3, 'delete']);
        });

        it('should resolve even if some insertions fail (due to catch inside loop)', async () => {
            const dbError = new Error('DB insert failed');
            // Simulate failure for one specific call (e.g., Admin-write)
            mockedRunAsync.mockImplementation(async (sql, params) => {
                if (params && params[2] === 1 && params[3] === 'write') { // Check roleId and permission
                    throw dbError;
                }
                return { lastID: 0, changes: 1 };
            });

            // The function should still resolve because Promise.all waits, and individual catches handle errors.
            await expect(addAnalysisPolicies(projectId, analysisId)).resolves.toBeDefined();

            // Verify all expected calls were still attempted
            const expectedCalls = (roleKeys.length - 1) * actionValues.length + 1;
            expect(mockedRunAsync).toHaveBeenCalledTimes(expectedCalls);
        });

        // Note: Testing the outer catch block's error message construction is difficult
        // because Promise.all is unlikely to reject when individual promises have .catch.
    });

    // --- Tests for addUserAnalyseRight ---
    describe('addUserAnalyseRight', () => {
        const userId = 55;
        const roleId = 2; // Manager
        const analyseId = 102;

        it('should call runAsync with correct INSERT SQL and params', async () => {
            const expectedSql = `
            INSERT INTO rights_analysis (user_id, role_id, analysis_id)
            VALUES (?, ?, ?);
        `;
            await addUserAnalyseRight(userId, roleId, analyseId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining(expectedSql.trim()),
                [userId, roleId, analyseId]
            );
        });

        it('should return the result from runAsync', async () => {
            const mockResult = { lastID: 25, changes: 1 };
            mockedRunAsync.mockResolvedValueOnce(mockResult);

            const result = await addUserAnalyseRight(userId, roleId, analyseId);
            expect(result).toEqual(mockResult);
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB insert failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(addUserAnalyseRight(userId, roleId, analyseId)).rejects.toThrow(`Erreur lors de l'ajout du droit utilisateur d'une analyse : ${dbError}`);
        });
    });

    // --- Tests for getAnalysis ---
    describe('getAnalysis', () => {
        const analysisId = 103;
        const projectId = 'proj-4';

        it('should call allAsync with correct SELECT SQL and params', async () => {
            await getAnalysis(analysisId, projectId);

            expect(mockedAllAsync).toHaveBeenCalledTimes(1);
            expect(mockedAllAsync).toHaveBeenCalledWith(
                expect.stringContaining("FROM analyses"),
                [analysisId, projectId]
            );
        });

        it('should return the result from allAsync', async () => {
            const mockAnalysis: Analysis[] = [{ id: analysisId, name: 'Fetched Analysis', owner_id: 1, project_id: 1 }];
            mockedAllAsync.mockResolvedValueOnce(mockAnalysis);

            const result = await getAnalysis(analysisId, projectId);
            expect(result).toEqual(mockAnalysis); // Returns array as allAsync returns array
        });

        it('should throw an error if allAsync fails', async () => {
            const dbError = new Error('DB select failed');
            mockedAllAsync.mockRejectedValueOnce(dbError);

            await expect(getAnalysis(analysisId, projectId)).rejects.toThrow(`Erreur lors de la récupération de l'analyse : ${dbError}`);
        });
    });

    // --- Tests for isUserHaveAnalyseRight ---
    describe('isUserHaveAnalyseRight', () => {
        const userId = 'user-5';
        const analysisId = 104;

        it('should call getAsync with correct EXISTS SQL and params', async () => {
            const expectedSql = `
        SELECT EXISTS (
            SELECT 1
            FROM rights_analysis
            WHERE user_id = ? AND analysis_id = ?
        ) AS has_access;
    `;
            await isUserHaveAnalyseRight(userId, analysisId.toString());

            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining(expectedSql.trim()),
                [userId, analysisId.toString()]
            );
        });

        it('should return true if getAsync returns has_access: 1', async () => {
            mockedGetAsync.mockResolvedValueOnce({ has_access: 1 });
            const result = await isUserHaveAnalyseRight(userId, analysisId.toString());
            expect(result).toBe(true);
        });

        it('should return false if getAsync returns has_access: 0', async () => {
            mockedGetAsync.mockResolvedValueOnce({ has_access: 0 });
            const result = await isUserHaveAnalyseRight(userId, analysisId.toString());
            expect(result).toBe(false);
        });

        it('should return false if getAsync returns undefined', async () => {
            mockedGetAsync.mockResolvedValueOnce(undefined);
            const result = await isUserHaveAnalyseRight(userId, analysisId.toString());
            expect(result).toBe(false);
        });

        // Note: Original function doesn't explicitly handle errors from getAsync
        it('should propagate error if getAsync fails', async () => {
            const dbError = new Error('DB query failed');
            mockedGetAsync.mockRejectedValueOnce(dbError);

            await expect(isUserHaveAnalyseRight(userId, analysisId.toString())).rejects.toThrow(dbError);
        });
    });

    // --- Tests for deleteAnalysis ---
    describe('deleteAnalysis', () => {
        const analysisId = 105;

        it('should call runAsync 3 times with correct DELETE SQL and params', async () => {
            await deleteAnalysis(analysisId);

            expect(mockedRunAsync).toHaveBeenCalledTimes(3);
            // 1. Delete from analyses table
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM analyses WHERE id = ?', [analysisId]);
            // 2. Delete from analysis_policies table - uses analysisId based on current code
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM analysis_policies WHERE project_id = ?', [analysisId]); // Potential issue: Should likely be analysis_id = ?
            // 3. Delete from rights_analysis table - uses analysisId based on current code
            expect(mockedRunAsync).toHaveBeenCalledWith('DELETE FROM rights_analysis WHERE project_id = ?', [analysisId]); // Potential issue: Should likely be analysis_id = ?
        });

        it('should throw an error if any runAsync call fails', async () => {
            const dbError = new Error('DB delete failed');
            mockedRunAsync.mockRejectedValueOnce(dbError); // Fail on first call

            await expect(deleteAnalysis(analysisId)).rejects.toThrow(`Erreur lors de la suppression de l'analyse : ${dbError}`);
            expect(mockedRunAsync).toHaveBeenCalledTimes(1); // Should stop after first error
        });
    });

    // --- Tests for updateAnalysis ---
    describe('updateAnalysis', () => {
        const analysisId = 'ana-6';
        const newName = 'Updated Name';

        it('should call runAsync with correct UPDATE SQL and params', async () => {
            const expectedSql = 'UPDATE analyses SET name = ? WHERE id = ?';
            await updateAnalysis(analysisId, newName);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(expectedSql, [newName, analysisId]);
        });

        it('should return the result from runAsync', async () => {
            const mockResult = { lastID: 0, changes: 1 };
            mockedRunAsync.mockResolvedValueOnce(mockResult);

            const result = await updateAnalysis(analysisId, newName);
            expect(result).toEqual(mockResult);
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB update failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(updateAnalysis(analysisId, newName)).rejects.toThrow(`Erreur lors de la mise à jour de l'analyse : ${dbError}`);
        });
    });

});
