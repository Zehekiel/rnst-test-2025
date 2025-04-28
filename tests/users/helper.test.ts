import { getUserRole, isUserProjectOwner, isUserAnalyseOwner, addUser } from '@/users/helper'; // Adjust path if needed
import { getAsync, runAsync } from '@/helper'; // Import the functions to be mocked
import { UserRole } from '@/types'; // Import necessary types

// Mock the @/helper module
jest.mock('@/helper', () => ({
    getAsync: jest.fn(),
    runAsync: jest.fn(),
}));

// Type assertion for the mocked functions
const mockedGetAsync = getAsync as jest.Mock;
const mockedRunAsync = runAsync as jest.Mock;

describe('User Helper Functions', () => {

    beforeEach(() => {
        // Reset mocks before each test (alternative to clearMocks in config)
        // jest.clearAllMocks();

        // Set default mock implementations
        mockedGetAsync.mockResolvedValue(undefined); // Default: not found
        mockedRunAsync.mockResolvedValue({ lastID: 0, changes: 0 }); // Default: no changes/insert
    });

    // --- Tests for getUserRole ---
    describe('getUserRole', () => {
        const userId = 'user-1';
        const projectId = 'proj-1';
        const analysisId = 'ana-1';
        const placeholderProjectId = '{projectId}';
        const placeholderAnalysisId = '{analysisId}';

        beforeEach(() => {
            // Reset the mock before each test
            jest.clearAllMocks();
        });

        it('should query project role if projectId is valid', async () => {
            const mockRole: UserRole = { role_name: 'manager' };
            mockedGetAsync.mockResolvedValueOnce(mockRole);

            const role = await getUserRole(userId, projectId, placeholderAnalysisId);

            expect(role).toBe('manager');
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining('rights_project rp'),
                [userId, projectId]
            );
        });

        it('should query analysis role if analysisId is valid and projectId is placeholder', async () => {
            const mockRole: UserRole = { role_name: 'reader' };
            mockedGetAsync.mockResolvedValueOnce(mockRole);

            const role = await getUserRole(userId, placeholderProjectId, analysisId);

            expect(role).toBe('reader');
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining('rights_analysis ra'),
                [userId, analysisId]
            );
        });

        it('should prioritize projectId over analysisId', async () => {
            const mockProjectRole: UserRole = { role_name: 'admin' };
            mockedGetAsync.mockResolvedValueOnce(mockProjectRole); // Only mock the first call

            const role = await getUserRole(userId, projectId, analysisId); // Both IDs provided

            expect(role).toBe('admin');
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining('rights_project rp'),
                [userId, projectId]
            );
            // Ensure analysis query was NOT called
            expect(mockedGetAsync).not.toHaveBeenCalledWith(
                expect.stringContaining('rights_analysis ra'),
                expect.anything()
            );
        });

        it('should return undefined if neither projectId nor analysisId is valid', async () => {
            const role = await getUserRole(userId, placeholderProjectId, placeholderAnalysisId);

            expect(role).toBeUndefined();
            expect(mockedGetAsync).not.toHaveBeenCalled();
        });

        it('should return undefined if getAsync returns undefined (no role found)', async () => {
            mockedGetAsync.mockResolvedValueOnce(undefined); // Explicitly return undefined

            const role = await getUserRole(userId, projectId, placeholderAnalysisId);

            expect(role).toBeUndefined();
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });

        it('should propagate error if getAsync fails', async () => {
            const dbError = new Error('DB query failed');
            mockedGetAsync.mockRejectedValueOnce(dbError);

            await expect(getUserRole(userId, projectId, placeholderAnalysisId)).rejects.toThrow(dbError);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });
    });

    // --- Tests for isUserProjectOwner ---
    describe('isUserProjectOwner', () => {
        const userId = 'user-2';
        const projectId = 'proj-2';

        beforeEach(() => {
            // Reset the mock before each test
            jest.clearAllMocks();
        });

        it('should return true if getAsync returns is_owner: 1', async () => {
            mockedGetAsync.mockResolvedValueOnce({ is_owner: 1 });

            const isOwner = await isUserProjectOwner(userId, projectId);

            expect(isOwner).toBe(true);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining('projects'),
                [projectId, userId]
            );
        });

        it('should return false if getAsync returns is_owner: 0', async () => {
            mockedGetAsync.mockResolvedValueOnce({ is_owner: 0 });

            const isOwner = await isUserProjectOwner(userId, projectId);

            expect(isOwner).toBe(false);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });

        it('should return false if getAsync returns undefined', async () => {
            mockedGetAsync.mockResolvedValueOnce(undefined); // Simulate unexpected undefined

            const isOwner = await isUserProjectOwner(userId, projectId);

            expect(isOwner).toBe(false);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });

        it('should propagate error if getAsync fails', async () => {
            const dbError = new Error('DB query failed');
            mockedGetAsync.mockRejectedValueOnce(dbError);

            await expect(isUserProjectOwner(userId, projectId)).rejects.toThrow(dbError);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });
    });

    // --- Tests for isUserAnalyseOwner ---
    describe('isUserAnalyseOwner', () => {
        const userId = 'user-3';
        const analysisId = 'ana-3';

        beforeEach(() => {
            // Reset the mock before each test
            jest.clearAllMocks();
        });

        it('should return true if getAsync returns is_owner: 1', async () => {
            mockedGetAsync.mockResolvedValueOnce({ is_owner: 1 });

            const isOwner = await isUserAnalyseOwner(userId, analysisId);

            expect(isOwner).toBe(true);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
            expect(mockedGetAsync).toHaveBeenCalledWith(
                expect.stringContaining('analyses'),
                [analysisId, userId]
            );
        });

        it('should return false if getAsync returns is_owner: 0', async () => {
            mockedGetAsync.mockResolvedValueOnce({ is_owner: 0 });

            const isOwner = await isUserAnalyseOwner(userId, analysisId);

            expect(isOwner).toBe(false);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });

        it('should return false if getAsync returns undefined', async () => {
            mockedGetAsync.mockResolvedValueOnce(undefined);

            const isOwner = await isUserAnalyseOwner(userId, analysisId);

            expect(isOwner).toBe(false);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });

        it('should propagate error if getAsync fails', async () => {
            const dbError = new Error('DB query failed');
            mockedGetAsync.mockRejectedValueOnce(dbError);

            await expect(isUserAnalyseOwner(userId, analysisId)).rejects.toThrow(dbError);
            expect(mockedGetAsync).toHaveBeenCalledTimes(1);
        });
    });

    // --- Tests for addUser ---
    describe('addUser', () => {
        const userName = 'New User';

        beforeEach(() => {
            // Reset the mock before each test
            jest.clearAllMocks();
        });

        it('should call runAsync with correct SQL and params', async () => {
            const expectedSql = `
            INSERT INTO users (name)
            VALUES (?);
        `;
            await addUser(userName);

            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
            expect(mockedRunAsync).toHaveBeenCalledWith(
                expect.stringContaining(expectedSql.trim()),
                [userName]
            );
        });

        it('should return the result from runAsync on success', async () => {
            const mockResult = { lastID: 123, changes: 1 };
            mockedRunAsync.mockResolvedValueOnce(mockResult);

            const result = await addUser(userName);

            expect(result).toEqual(mockResult);
        });

        it('should throw an error if runAsync fails', async () => {
            const dbError = new Error('DB insert failed');
            mockedRunAsync.mockRejectedValueOnce(dbError);

            await expect(addUser(userName)).rejects.toThrow(`Erreur lors de l'ajout de l'utilisateur : ${dbError}`);
            expect(mockedRunAsync).toHaveBeenCalledTimes(1);
        });
    });
});
