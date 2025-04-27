// tests/sql/index.test.ts

import { Hono } from 'hono';
// Import types and constants normally
import { cookieName, secret } from '@/constant';
import { userTable, roleTable, } from '@/sql/modele';

// --- Mock Setup ---

// 1. Declare variables to hold the mock functions
let mockDbRun: jest.Mock;
let mockDbSerialize: jest.Mock;
let mockDbGet: jest.Mock; // Mock for the 'get' method if needed by getAsync mock
let mockedGetAsync: jest.Mock;
let mockedAllAsync: jest.Mock;
let mockedGetSignedCookie: jest.Mock;

// 2. Use jest.doMock for the database (doesn't hoist)
jest.doMock('@/database', () => {
    // Create the actual mock functions here
    mockDbRun = jest.fn();
    mockDbSerialize = jest.fn((callback) => callback()); // Default implementation
    mockDbGet = jest.fn(); // Mock for the base 'get' method
    // Return the structure expected by the code importing '@/database'
    return {
        __esModule: true,
        default: {
            run: mockDbRun,
            serialize: mockDbSerialize,
            get: mockDbGet,
        },
    };
});

// 3. Mock other dependencies (can often use jest.mock here, but doMock is safer if unsure)
jest.doMock('@/helper', () => {
    mockedGetAsync = jest.fn();
    mockedAllAsync = jest.fn();
    return {
        __esModule: true,
        getAsync: mockedGetAsync,
        allAsync: mockedAllAsync,
    };
});

jest.doMock('hono/cookie', () => {
    mockedGetSignedCookie = jest.fn();
    return {
        // Ensure all potentially used exports are mocked if needed
        getSignedCookie: mockedGetSignedCookie,
        setSignedCookie: jest.fn(),
        deleteCookie: jest.fn(),
    };
});


// --- Test Setup ---
// eslint-disable-next-line @typescript-eslint/no-require-imports
const databaseRoute = require('@/sql').default;

const app = new Hono().route('/sql', databaseRoute);

// Now the mock variables (mockDbRun, etc.) should be initialized and accessible

describe('SQL Database Routes', () => {

    beforeEach(() => {
        // Reset mocks using the variables defined above
        // Check if mocks were actually created before clearing
        mockDbRun?.mockClear();
        mockDbSerialize?.mockClear();
        mockDbGet?.mockClear();
        mockedGetAsync?.mockClear();
        mockedGetSignedCookie?.mockClear();

        // Reset default implementations if needed
        mockDbSerialize?.mockImplementation((callback) => callback());
        mockDbRun?.mockImplementation((sql, params, callback) => {
            if (typeof callback === 'function') callback(null);
            // Return a mock chainable object if the original code relies on it
            return { run: mockDbRun, serialize: mockDbSerialize, get: mockDbGet };
        });
        mockDbGet?.mockImplementation((sql, params, callback) => {
             if (typeof callback === 'function') callback(null, null); // Simulate success, no row
        });
        mockedGetAsync?.mockResolvedValue(undefined); // Default for getAsync
        mockedGetSignedCookie?.mockResolvedValue(undefined); // Default no cookie
    });

    // --- Tests for GET /sql/init ---
    describe('GET /sql/init (getInitSQLRoute)', () => {
        const mockUserId = 1;
        const mockUserName = 'InitUser';
        // The value stored in the cookie (stringified JSON)
        const mockCookiePayload = JSON.stringify({ id: mockUserId, name: mockUserName });
        // What getSignedCookie resolves with (an object mapping cookie name to payload)
        const mockResolvedCookie = { [cookieName]: mockCookiePayload };

        it('should initialize the database successfully when cookie is valid', async () => {
            // Arrange
            mockedGetSignedCookie.mockResolvedValue(mockResolvedCookie);
            // mockDbRun uses default success from beforeEach

            // Act
            const req = new Request('http://localhost/sql/init', {
                headers: { Cookie: `${cookieName}=signed-value` },
            });
            const res = await app.request(req);

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: "Base de données initialisée",
            });

            // Verify cookie check (receives context, secret) - Note: getSignedCookie takes context and secret
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(expect.anything(), secret);

            // Verify database operations
            expect(mockDbSerialize).toHaveBeenCalledTimes(9);
            expect(mockDbRun).toHaveBeenCalledWith(userTable);
            expect(mockDbRun).toHaveBeenCalledWith(roleTable);
            expect(mockDbRun).toHaveBeenCalledWith(`INSERT INTO users (id, name) VALUES (${mockUserId}, '${mockUserName}')`);
            expect(mockDbRun).toHaveBeenCalledWith(`INSERT INTO rights_analysis (user_id, role_id, analysis_id) VALUES (${mockUserId}, 1, 1)`);
        });

        it('should return 500 if cookie is missing or invalid', async () => {
            // Arrange
            mockedGetSignedCookie.mockResolvedValue(undefined); // Simulate missing/invalid cookie

            // Act
            const res = await app.request('/sql/init');

            // Assert
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({
                success: false,
                message: "Erreur lors de l'initialisation de la base de données",
            });
            // Ensure database operations didn't run
            expect(mockDbRun).not.toHaveBeenCalled();
            expect(mockDbSerialize).not.toHaveBeenCalled();
        });

        // Test for database operation failure (needs careful mock setup)
        it('should return 500 if a database operation fails', async () => {
            // Arrange
            mockedGetSignedCookie.mockResolvedValue(mockResolvedCookie);
            const dbError = new Error('DB Write Error');

            // Mock serialize to execute the callback
            mockDbSerialize.mockImplementation(() => {throw dbError;});

            // Simulate an error during one of the database.run calls
            mockDbRun.mockImplementation((sql, params, callback) => {
                if (sql === roleTable) { // Simulate error when creating roleTable
                    // Simulate error via callback (common for node-sqlite3)
                    if (typeof callback === 'function') {
                        callback(dbError);
                        return { run: mockDbRun, serialize: mockDbSerialize, get: mockDbGet }; // Still return chainable object
                    }
                }
                // Simulate success for other calls
                if (typeof callback === 'function') {
                    callback(null);
                }
                return { run: mockDbRun, serialize: mockDbSerialize, get: mockDbGet };
            });

            // Act
            const req = new Request('http://localhost/sql/init', {
                headers: { Cookie: `${cookieName}=signed-value` },
            });
            const res = await app.request(req);

            // Assert
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({
                success: false,
                message: "Erreur lors de l'initialisation de la base de données",
            });
        });
    });

    // --- Tests for DELETE /sql/delete ---
    describe('DELETE /sql/delete (deleteSQLRoute)', () => {
        it('should delete database tables successfully', async () => {
            // Arrange
            // mockDbRun uses default success from beforeEach

            // Act
            const req = new Request('http://localhost/sql/delete', { method: 'DELETE' });
            const res = await app.request(req);

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: "Base de données supprimée",
            });

            // Verify database operations
            expect(mockDbSerialize).toHaveBeenCalledTimes(1);
            expect(mockDbRun).toHaveBeenCalledWith(`DROP TABLE IF EXISTS users`);
            expect(mockDbRun).toHaveBeenCalledWith(`DROP TABLE IF EXISTS roles`);
            // ... other drop table assertions
            expect(mockDbRun).toHaveBeenCalledWith(`DROP TABLE IF EXISTS rights_analysis`);
        });

        // Test for failure during delete
        it('should return 500 if a database drop fails', async () => {
            // Arrange
            const dbError = new Error('DB Drop Error');
            mockDbSerialize.mockImplementation(() => {throw dbError;});
            mockDbRun.mockImplementation((sql, params, callback) => {
                if (sql.includes('DROP TABLE IF EXISTS projects')) {
                    if (typeof callback === 'function') {
                        callback(dbError); // Simulate error via callback
                        return { run: mockDbRun, serialize: mockDbSerialize, get: mockDbGet };
                    }
                }
                if (typeof callback === 'function') callback(null); // Success for others
                return { run: mockDbRun, serialize: mockDbSerialize, get: mockDbGet };
            });

            // Act
            const req = new Request('http://localhost/sql/delete', { method: 'DELETE' });
            // The route handler for delete doesn't seem to have explicit try/catch,
            // so the error might propagate differently. Hono might catch it.
            const res = await app.request(req);


            // Assert
            // We expect Hono to catch the error from the sync callback within serialize
            expect(res.status).toBe(500);
        });
    });

    // --- Tests for GET /sql/projects ---
    describe('GET /sql/projects (getAllProjectRoute)', () => {
        it('should return all projects successfully', async () => {
            // Arrange
            const mockProjects = [{ id: 1, name: 'Project Alpha', owner_id: 1 }, { id: 2, name: 'Project Beta', owner_id: 2 }];
            mockedAllAsync.mockResolvedValue(mockProjects);

            // Act
            const res = await app.request('/sql/projects');

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: mockProjects,
            });
            // Verify the helper was called correctly
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM projects');
        });

        it('should return empty data array if no projects exist', async () => {
            // Arrange
            mockedAllAsync.mockResolvedValue([]); // Simulate empty result set

            // Act
            const res = await app.request('/sql/projects');

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: [],
            });
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM projects');
        });

        it('should handle errors during project fetch and return 500', async () => {
            // Arrange
            const fetchError = new Error('Failed to fetch projects');
            mockedAllAsync.mockRejectedValue(fetchError);

            // Act
            const res = await app.request('/sql/projects');

            // Assert
            expect(res.status).toBe(500);
            // Check response body if Hono error handling provides one
            // expect(await res.text()).toContain('Failed to fetch projects');
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM projects');
        });
    });

    // --- Tests for GET /sql/analyses ---
    describe('GET /sql/analyses (getAllAnalysisRoute)', () => {
        // Define a type matching the expected structure if not already imported
        type Analysis = { id: number; name: string; project_id: number; owner_id: number };

        it('should return all analyses successfully', async () => {
            // Arrange
            const mockAnalyses: Analysis[] = [
                { id: 1, name: 'Analysis X', project_id: 1, owner_id: 1 },
                { id: 2, name: 'Analysis Y', project_id: 1, owner_id: 2 }
            ];
            // Note: The original code uses getAsync<User>, which is likely a typo.
            // The mock should resolve with the expected data structure (analyses).
            mockedAllAsync.mockResolvedValue(mockAnalyses);

            // Act
            const res = await app.request('/sql/analyses');

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: mockAnalyses,
            });
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM analyses');
        });

        it('should return empty data array if no analyses exist', async () => {
            // Arrange
            mockedAllAsync.mockResolvedValue([]);

            // Act
            const res = await app.request('/sql/analyses');

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: [],
            });
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM analyses');
        });

        it('should handle errors during analysis fetch and return 500', async () => {
            // Arrange
            const fetchError = new Error('Failed to fetch analyses');
            mockedAllAsync.mockRejectedValue(fetchError);

            // Act
            const res = await app.request('/sql/analyses');

            // Assert
            expect(res.status).toBe(500);
            expect(mockedAllAsync).toHaveBeenCalledWith('SELECT * FROM analyses');
        });
    });
});
