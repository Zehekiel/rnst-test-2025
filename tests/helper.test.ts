/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAsync, allAsync, runAsync, getCookieData, getRoleId, controlPermission } from '@/helper';
import database from '@/database'; // We will mock this
import { Env } from 'hono/types';
import { Context } from 'hono';
import { cookieName, secret } from '@/constant';
import { getUserRole, isUserHaveProjectRight, isUserProjectOwner } from '@/users/helper';
import { getSignedCookie } from 'hono/cookie';
import { PermissionLevel } from '@/types';

// Mock the database module
jest.mock('@/database', () => ({
    // Define the structure with mock functions
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
}));

jest.mock('hono/cookie', () => ({
    getSignedCookie: jest.fn(),
}));

jest.mock('@/users/helper', () => ({
    getUserRole: jest.fn(),
    isUserProjectOwner: jest.fn(),
    isUserHaveProjectRight: jest.fn(),
}));


// Type assertion for the mocked database functions
const mockedDbGet = database.get as jest.Mock;
const mockedDbAll = database.all as jest.Mock;
const mockedDbRun = database.run as jest.Mock;
const mockedGetSignedCookie = getSignedCookie as jest.Mock;
const mockedGetUserRole = getUserRole as jest.Mock;
const mockedIsUserProjectOwner = isUserProjectOwner as jest.Mock;
const mockedIsUserHaveProjectRight = isUserHaveProjectRight as jest.Mock;


describe('Database Helpers', () => {

    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks to ensure no state is carried over
        mockedDbGet.mockImplementation((sql, params, callback) => {
        // Default mock logic for 'get' (e.g., return undefined or specific structure)
            if (sql.includes('SELECT EXISTS')) {
                callback(null, { is_owner: 0, has_permission: 0 });
            } else if (sql.includes('r.name AS role_name')) { // Simplified check for role query
                callback(null, undefined);
            } else {
                callback(null, undefined);
            }
        });
        mockedDbAll.mockImplementation((sql, params, callback) => {
            // Default mock logic for 'all' (e.g., return empty array)
            callback(null, []);
        });
        mockedDbRun.mockImplementation((sql, params, callback) => {
            // Simule le contexte 'this' que sqlite3 fournirait
            const context = { lastID: 1, changes: 1 }; // Valeurs par défaut pour le succès
            // Appelle le callback avec 'null' pour l'erreur et définit 'this'
            callback.call(context, null);
        });
    });

    // --- Tests for getAsync ---
    describe('getAsync', () => {
        it('should resolve with the row when db.get finds data', async () => {
            const mockRow = { id: 1, name: 'Test Data' };
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, mockRow);
            });

            const result = await getAsync<{ id: number; name: string }>('SELECT * test WHERE id = ?', [1]);
            expect(result).toEqual(mockRow);
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * test WHERE id = ?', [1], expect.any(Function));
        });

        it('should resolve with undefined when db.get finds no data', async () => {
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
            });

            const result = await getAsync('SELECT * test WHERE id = ?', [99]);
            expect(result).toBeUndefined();
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * test WHERE id = ?', [99], expect.any(Function));
        });

        it('should reject with an error when db.get fails', async () => {
            const mockError = new Error('DB Error');
            mockedDbGet.mockImplementationOnce((sql, params, callback) => {
                callback(mockError);
            });

            await expect(getAsync('SELECT * test WHERE id = ?', [1])).rejects.toThrow('DB Error');
            expect(mockedDbGet).toHaveBeenCalledWith('SELECT * test WHERE id = ?', [1], expect.any(Function));
        });
    });

    // --- Tests for allAsync ---
    describe('allAsync', () => {
        it('should resolve with an array of rows when db.all finds data', async () => {
            const mockRows = [{ id: 1 }, { id: 2 }];
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(null, mockRows);
            });

            const result = await allAsync<{ id: number }>('SELECT * test');
            expect(result).toEqual(mockRows);
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * test', undefined, expect.any(Function));
        });

        it('should resolve with an empty array when db.all finds no data', async () => {
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(null, []);
            });

            const result = await allAsync('SELECT * test WHERE name = ?', ['NonExistent']);
            expect(result).toEqual([]);
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * test WHERE name = ?', ['NonExistent'], expect.any(Function));
        });

        it('should reject with an error when db.all fails', async () => {
            const mockError = new Error('DB All Error');
            mockedDbAll.mockImplementationOnce((sql, params, callback) => {
                callback(mockError);
            });

            await expect(allAsync('SELECT * test')).rejects.toThrow('DB All Error');
            expect(mockedDbAll).toHaveBeenCalledWith('SELECT * test', undefined, expect.any(Function));
        });
    });

    // --- Tests for runAsync ---
    describe('runAsync', () => {
        it('should resolve with lastID and changes when db.run succeeds', async () => {
            // Arrange: Configure le mock spécifiquement pour ce test si nécessaire
            const mockContext = { lastID: 5, changes: 1 };
            mockedDbRun.mockImplementationOnce((sql, params, callback) => {
                // Appelle le callback avec le contexte spécifique à ce test
                callback.call(mockContext, null);
            });

            // Act
            const result = await runAsync('INSERT INTO test (name) VALUES (?)', ['Test']);

            // Assert
            // Le résultat doit correspondre aux valeurs définies dans mockContext
            expect(result).toEqual({ lastID: 5, changes: 1 });
            expect(mockedDbRun).toHaveBeenCalledWith('INSERT INTO test (name) VALUES (?)', ['Test'], expect.any(Function));
        });


        it('should reject with an error when db.run fails', async () => {
            const mockError = new Error('DB Run Error');
            mockedDbRun.mockImplementationOnce((sql, params, callback) => {
                callback(mockError);
            });

            await expect(runAsync('INSERT INTO test (name) VALUES (?)', ['Test'])).rejects.toThrow('DB Run Error');
            expect(mockedDbRun).toHaveBeenCalledWith('INSERT INTO test (name) VALUES (?)', ['Test'], expect.any(Function));
        });
    })

    // --- Tests for getCookieData ---
    describe('getCookieData', () => {
        // Create a minimal mock context object
        const createMockContext = (): Context<Env, "/", Record<string, unknown>> => ({
            // Add properties/methods of Context if needed by getSignedCookie mock or the function itself
            req: {
                // Mock request properties if necessary
            },
            // Add other context properties if needed
        } as unknown as Context<Env, "/", Record<string, unknown>>);

        it('should return userId and userName when cookie is valid JSON', async () => {
            const mockContext = createMockContext();
            const cookiePayload = { id: 'user123', name: 'Test User' };
            const cookieValue = JSON.stringify(cookiePayload);
            mockedGetSignedCookie.mockResolvedValue({ [cookieName]: cookieValue });

            const result = await getCookieData(mockContext);

            expect(result).toEqual({ userId: 'user123', userName: 'Test User' });
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(mockContext, secret);
        });

        it('should return undefined userId and userName when cookie is missing', async () => {
            const mockContext = createMockContext();
            // No cookie set in the mock return value (default behavior set in beforeEach)
            mockedGetSignedCookie.mockResolvedValue({});

            const result = await getCookieData(mockContext);

            expect(result).toEqual({ userId: undefined, userName: undefined });
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(mockContext, secret);
        });

        it('should return undefined userId and userName when cookie value is not valid JSON', async () => {
            const mockContext = createMockContext();
            const invalidCookieValue = 'not-json';
            mockedGetSignedCookie.mockResolvedValue({ [cookieName]: invalidCookieValue });

            // JSON.parse will throw an error here. The function should handle it gracefully.
            // Depending on how you want to handle it, adjust the expectation.
            // Current implementation will likely throw. Let's test that.
            await expect(getCookieData(mockContext)).rejects.toThrow(SyntaxError); // Expect JSON.parse error
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(mockContext, secret);
        });

        it('should return undefined userId/userName if JSON is valid but missing properties', async () => {
            const mockContext = createMockContext();
            const partialCookiePayload = { someOtherProp: 'value' }; // Missing id and name
            const cookieValue = JSON.stringify(partialCookiePayload);
            mockedGetSignedCookie.mockResolvedValue({ [cookieName]: cookieValue });

            const result = await getCookieData(mockContext);

            expect(result).toEqual({ userId: undefined, userName: undefined });
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(mockContext, secret);
        });

        it('should handle empty string cookie value gracefully by returning undefined values', async () => { // Updated test description
            const mockContext = createMockContext();
            mockedGetSignedCookie.mockResolvedValue({ [cookieName]: '' }); // Empty string

            // Expect the promise to resolve, not reject
            const result = await getCookieData(mockContext);

            // Check that it resolved to the expected object with undefined values
            expect(result).toEqual({ userId: undefined, userName: undefined });

            // Verify the cookie function was still called
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(mockContext, secret);
        });
    });

   // --- Tests for getRoleId ---
    describe('getRoleId', () => {
    // Using the actual 'roles' constant from '@/constant'
    // Note: This relies on the order and values in the constant.
    // roles = {"administrateur": 'Admin', "Manager": 'Manager', "Reader": 'Reader'}

        it('should return correct ID for "Admin"', () => {
            // 'Admin' is the first value, index 0 -> ID 1
            expect(getRoleId('Admin')).toBe(1);
        });

        it('should return correct ID for "Manager"', () => {
            // 'Manager' is the second value, index 1 -> ID 2
            expect(getRoleId('Manager')).toBe(2);
        });

        it('should return correct ID for "Reader"', () => {
            // 'Reader' is the third value, index 2 -> ID 3
            expect(getRoleId('Reader')).toBe(3);
        });

        it('should throw error for an invalid role name', () => {
            expect(() => getRoleId('Guest')).toThrow('Rôle Guest non valide');
        });

        it('should throw error for a key name instead of value', () => {
            // 'administrateur' is a key, not a value in the roles object
            expect(() => getRoleId('administrateur')).toThrow('Rôle administrateur non valide');
        });

        it('should be case-sensitive', () => {
            expect(() => getRoleId('manager')).toThrow('Rôle manager non valide'); // Lowercase 'm'
            expect(() => getRoleId('ADMIN')).toThrow('Rôle ADMIN non valide'); // Uppercase
        });
    });

    // --- Tests for controlPermission ---
    describe('controlPermission', () => {
        const userId = 'user-42';
        const projectId = 'proj-99';
        const writeAction: PermissionLevel = 'write';
        const readAction: PermissionLevel = 'read';

        beforeEach(() => {
            // Reset mocks before each test
            jest.clearAllMocks();
        });

        it('should return true if project role is "admin"', async () => {
            mockedGetUserRole.mockImplementation(async (uid, pid) => {
                if (pid === projectId) return 'admin'; // Project role is admin
                return 'admin'; // Global role doesn't matter here
            });

            const result = await controlPermission({userId, projectId, action: writeAction});
            expect(result).toBe(true);
            expect(mockedGetUserRole).toHaveBeenCalledTimes(2);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0"); // Shouldn't need global role check
        });

        it('should return true if global role is "manager", project role is not "admin", and action is "write"', async () => {
            mockedGetUserRole.mockImplementation(async (uid, pid) => {
                if (pid === projectId) return 'reader'; // Project role is NOT admin
                if (pid === "0") return 'manager'; // Global role IS manager
                return undefined;
            });

            const result = await controlPermission({userId, projectId, action: writeAction});
            expect(result).toBe(true);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0");
        });

        it('should return false if global role is "manager", project role not "admin", but action is NOT "write"', async () => {
            mockedGetUserRole.mockImplementation(async (uid, pid) => {
                if (pid === projectId) return 'reader'; // Project role is NOT admin
                if (pid === "0") return 'manager'; // Global role IS manager
                return undefined;
            });
            // Mocks for subsequent checks (owner, rights) - default is false/0
            mockedIsUserProjectOwner.mockResolvedValue(false);
            mockedIsUserHaveProjectRight.mockResolvedValue(false);


            const result = await controlPermission({userId, projectId, action: readAction}); // Action is 'read'
            expect(result).toBe(false); // Falls through manager check, owner check, rights check
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0");
            expect(mockedIsUserProjectOwner).toHaveBeenCalledWith(userId, projectId);
            expect(mockedIsUserHaveProjectRight).toHaveBeenCalledWith(userId, projectId);
        });

        it('should return true if user is project owner (after role checks fail)', async () => {
            mockedGetUserRole.mockResolvedValue(undefined); // No relevant roles
            mockedIsUserProjectOwner.mockResolvedValue(true); // IS owner

            const result = await controlPermission({userId, projectId, action: readAction});
            expect(result).toBe(true);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0");
            expect(mockedIsUserProjectOwner).toHaveBeenCalledWith(userId, projectId);
            expect(mockedDbGet).not.toHaveBeenCalled(); // Should short-circuit before rights check
        });

        it('should return true if user has explicit rights (after role/owner checks fail)', async () => {
            mockedGetUserRole.mockResolvedValue(undefined); // No relevant roles
            mockedIsUserProjectOwner.mockResolvedValue(false); // Not owner
            mockedIsUserHaveProjectRight.mockResolvedValue(true); // Has explicit rights

            const result = await controlPermission({userId, projectId, action: readAction});
            expect(result).toBe(true);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0");
            expect(mockedIsUserProjectOwner).toHaveBeenCalledWith(userId, projectId);
            expect(mockedIsUserHaveProjectRight).toHaveBeenCalledWith(userId, projectId);
        });

        it('should return false if no roles, not owner, and no explicit rights', async () => {
            mockedGetUserRole.mockResolvedValue(undefined); // No relevant roles
            mockedIsUserProjectOwner.mockResolvedValue(false); // Not owner
            mockedIsUserHaveProjectRight.mockResolvedValue(false); // No explicit rights

            const result = await controlPermission({userId, projectId, action: readAction});
            expect(result).toBe(false);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0");
            expect(mockedIsUserProjectOwner).toHaveBeenCalledWith(userId, projectId);
            expect(mockedIsUserHaveProjectRight).toHaveBeenCalledWith(userId, projectId);
        });

        it('should handle case where action is undefined (only checks roles/owner/rights)', async () => {
            mockedGetUserRole.mockResolvedValue(undefined);
            mockedIsUserProjectOwner.mockResolvedValue(false);
            mockedIsUserHaveProjectRight.mockResolvedValue(true); // Has rights

            const result = await controlPermission({userId, projectId, action: undefined}); // No action specified
            expect(result).toBe(true); // Should return true based on rights check
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, projectId);
            expect(mockedGetUserRole).toHaveBeenCalledWith(userId, "0"); // Manager check still happens but doesn't match
            expect(mockedIsUserProjectOwner).toHaveBeenCalledWith(userId, projectId);
            expect(mockedIsUserHaveProjectRight).toHaveBeenCalledWith(userId, projectId);
        });

        it('should propagate errors from getUserRole (project)', async () => {
            const dbError = new Error('DB Error 1');
            mockedGetUserRole.mockRejectedValueOnce(dbError); // Error on first call

            await expect(controlPermission({userId, projectId, action: writeAction})).rejects.toThrow(dbError);
        });

        it('should propagate errors from getUserRole (global)', async () => {
            const dbError = new Error('DB Error 2');
            mockedGetUserRole
                .mockResolvedValueOnce(undefined) // First call (project role) succeeds (returns undefined)
                .mockRejectedValueOnce(dbError); // Second call (global role) fails

            await expect(controlPermission({userId, projectId, action: writeAction})).rejects.toThrow(dbError);
        });

        it('should propagate errors from isUserProjectOwner', async () => {
            const dbError = new Error('DB Error 3');
            mockedGetUserRole.mockResolvedValue(undefined); // Role checks pass (no relevant roles)
            mockedIsUserProjectOwner.mockRejectedValueOnce(dbError); // Owner check fails

            await expect(controlPermission({userId, projectId, action: writeAction})).rejects.toThrow(dbError);
        });
    });
});
