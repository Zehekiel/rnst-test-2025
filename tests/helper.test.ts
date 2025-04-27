/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAsync, allAsync, getUserRole, isUserProjectOwner, isUserAnalyseOwner } from '@/helper';
import database from '@/database'; // We will mock this

// Mock the database module
jest.mock('@/database', () => ({
    // Mock the 'get' method
    get: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, row?: any) => void) => {
        // Simulate database responses based on sql or params if needed
        // Default mock implementation (can be overridden in tests)
        if (sql.includes('SELECT EXISTS')) {
             // Default for owner checks or permission checks
            callback(null, { is_owner: 0, has_permission: 0 });
        } else if (sql.includes('SELECT\n                r.name AS role_name')) {
             // Default for getUserRole
             callback(null, undefined); // Simulate user not found or no role
        } else {
             callback(null, undefined); // Default undefined for other gets
        }
    }),
    // Mock the 'all' method
    all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows?: any[]) => void) => {
        // Default mock implementation (can be overridden in tests)
        callback(null, []); // Default empty array
    }),
    // Mock the 'close' method
    close: jest.fn((callback: (err?: Error) => void) => {
        callback(); // Call the callback with no error
    }),
}));

// Type assertion for the mocked database functions
const mockedDbGet = database.get as jest.Mock;
const mockedDbAll = database.all as jest.Mock;

describe('Database Helpers', () => {

    // Reset mocks before each test
    beforeEach(() => {
        mockedDbGet.mockClear();
        mockedDbAll.mockClear();
    });

    // --- Tests for getAsync ---
    describe('getAsync', () => {
        it('should resolve with the row when db.get finds data', async () => {
            const mockRow = { id: 1, name: 'Test Data' };
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, mockRow);
            });

            const result = await getAsync<{ id: number; name: string }>('SELECT * FROM test WHERE id = ?', [1]);
            expect(result).toEqual(mockRow);
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1], expect.any(Function));
        });

        it('should resolve with undefined when db.get finds no data', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
            });

            const result = await getAsync('SELECT * FROM test WHERE id = ?', [99]);
            expect(result).toBeUndefined();
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [99], expect.any(Function));
        });

        it('should reject with an error when db.get fails', async () => {
            const mockError = new Error('DB Error');
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(mockError);
            });

            await expect(getAsync('SELECT * FROM test WHERE id = ?', [1])).rejects.toThrow('DB Error');
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1], expect.any(Function));
        });
    });

    // --- Tests for allAsync ---
    describe('allAsync', () => {
        it('should resolve with an array of rows when db.all finds data', async () => {
            const mockRows = [{ id: 1 }, { id: 2 }];
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(null, mockRows);
            });

            const result = await allAsync<{ id: number }>('SELECT * FROM test');
            expect(result).toEqual(mockRows);
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * FROM test', undefined, expect.any(Function));
        });

        it('should resolve with an empty array when db.all finds no data', async () => {
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(null, []);
            });

            const result = await allAsync('SELECT * FROM test WHERE name = ?', ['NonExistent']);
            expect(result).toEqual([]);
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * FROM test WHERE name = ?', ['NonExistent'], expect.any(Function));
        });

        it('should reject with an error when db.all fails', async () => {
            const mockError = new Error('DB All Error');
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(mockError);
            });

            await expect(allAsync('SELECT * FROM test')).rejects.toThrow('DB All Error');
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * FROM test', undefined, expect.any(Function));
        });
    });

    // --- Tests for getUserRole ---
    describe('getUserRole', () => {
        it('should return role from project if projectId is valid', async () => {
            const mockRole = { role_name: 'manager' };
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                 // Check if it's the project role query
                if (sql.includes('rights_project') && params?.includes('project1')) {
                    callback(null, mockRole);
                } else {
                    callback(null, undefined);
                }
            });

            const role = await getUserRole('user1', 'project1', "{analysisId}");
            expect(role).toBe('manager');
            expect(mockedDbGet).toHaveBeenCalledTimes(1);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('rights_project'), ['user1', 'project1'], expect.any(Function));
        });

        it('should return role from analysis if analysisId is valid and projectId is placeholder', async () => {
            const mockRole = { role_name: 'reader' };
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                // Check if it's the analysis role query
                if (sql.includes('rights_analysis') && params?.includes('analysis1')) {
                    callback(null, mockRole);
                } else {
                    callback(null, undefined);
                }
            });

            const role = await getUserRole('user1', "{projectId}", 'analysis1');
            expect(role).toBe('reader');
            expect(mockedDbGet).toHaveBeenCalledTimes(1); // Only analysis query should run
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('rights_analysis'), ['user1', 'analysis1'], expect.any(Function));
        });

        it('should return role from analysis if analysisId is valid and projectId is undefined', async () => {
            const mockRole = { role_name: 'reader' };
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                if (sql.includes('rights_analysis') && params?.includes('analysis1')) {
                    callback(null, mockRole);
                } else {
                    callback(null, undefined);
                }
            });

            // Pass undefined for projectId
            const role = await getUserRole('user1', "{projectId}", 'analysis1');
            expect(role).toBe('reader');
            expect(mockedDbGet).toHaveBeenCalledTimes(1);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('rights_analysis'), ['user1', 'analysis1'], expect.any(Function));
        });


        it('should return undefined if neither projectId nor analysisId is valid', async () => {
            const role = await getUserRole('user1', '{projectId}', '{analysisId}');
            expect(role).toBeUndefined();
            expect(mockedDbGet).not.toHaveBeenCalled(); // No query should run
        });

         it('should return undefined if IDs are valid but user has no role', async () => {
            // Mock db.get to return undefined for the specific query
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
            });

            const role = await getUserRole('user1', 'project1', '{analysisId}');
            expect(role).toBeUndefined();
            expect(mockedDbGet).toHaveBeenCalledTimes(1);
        });

        it('should prioritize projectId over analysisId', async () => {
            const mockProjectRole = { role_name: 'admin' };
             mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                 // Only respond to the project query
                 if (sql.includes('rights_project') && params?.includes('project1')) {
                     callback(null, mockProjectRole);
                 } else {
                     callback(null, undefined); // Ignore analysis query if called
                 }
            });

            const role = await getUserRole('user1', 'project1', 'analysis1');
            expect(role).toBe('admin');
            expect(mockedDbGet).toHaveBeenCalledTimes(1);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('rights_project'), ['user1', 'project1'], expect.any(Function));
            // Ensure analysis query was NOT called
            expect(mockedDbGet).not.toHaveBeenCalledWith(expect.stringContaining('rights_analysis'), expect.anything(), expect.anything());
        });
    });

    // --- Tests for isUserProjectOwner ---
    describe('isUserProjectOwner', () => {
        it('should return true if the user is the owner', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, { is_owner: 1 }); // Simulate owner found
            });

            const isOwner = await isUserProjectOwner('user1', 'project1');
            expect(isOwner).toBe(true);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('FROM projects'), ['project1', 'user1'], expect.any(Function));
        });

        it('should return false if the user is not the owner', async () => {
             mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, { is_owner: 0 }); // Simulate owner not found
            });

            const isOwner = await isUserProjectOwner('user2', 'project1');
            expect(isOwner).toBe(false);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('FROM projects'), ['project1', 'user2'], expect.any(Function));
        });

         it('should return false if the db query returns undefined', async () => {
             mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined); // Simulate unexpected undefined result
            });

            const isOwner = await isUserProjectOwner('user1', 'project1');
            expect(isOwner).toBe(false);
        });
    });

    // --- Tests for isUserAnalyseOwner ---
    describe('isUserAnalyseOwner', () => {
        it('should return true if the user is the owner', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, { is_owner: 1 }); // Simulate owner found
            });

            const isOwner = await isUserAnalyseOwner('user1', 'analysis1');
            expect(isOwner).toBe(true);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('FROM analyses'), ['analysis1', 'user1'], expect.any(Function));
        });

        it('should return false if the user is not the owner', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, { is_owner: 0 }); // Simulate owner not found
            });

            const isOwner = await isUserAnalyseOwner('user2', 'analysis1');
            expect(isOwner).toBe(false);
            expect(mockedDbGet).toHaveBeenCalledWith(expect.stringContaining('FROM analyses'), ['analysis1', 'user2'], expect.any(Function));
        });

        it('should return false if the db query returns undefined', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined); // Simulate unexpected undefined result
            });

            const isOwner = await isUserAnalyseOwner('user1', 'analysis1');
            expect(isOwner).toBe(false);
        });
    });
});
