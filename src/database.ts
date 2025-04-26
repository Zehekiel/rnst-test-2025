import sqlite3 from 'sqlite3'

sqlite3.verbose()

/**
 * @see https://github.com/TryGhost/node-sqlite3/wiki/API
 */
const database = new sqlite3.Database('db.sqlite3', (error) => {
    if (error === null) {
        return
    }
    console.error(error)
})

export default database