import sqlite3 from 'sqlite3';
sqlite3.verbose();

const db = new sqlite3.Database('local.db');

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS user (f_name TEXT NOT NULL, l_name TEXT NOT NULL, birthdate TEXT NOT NULL, password TEXT NOT NULL, role_id INTEGER NOT NULL, FOREIGN KEY(role_id) REFERENCES role (id) )');
    db.run('CREATE TABLE IF NOT EXISTS role (id INTEGER PRIMARY KEY, name TEXT NOT NULL, colour TEXT NOT NULL, UNIQUE(id, name))');
    db.run('CREATE TABLE IF NOT EXISTS permission (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
    db.run('CREATE TABLE IF NOT EXISTS compound (id TEXT NOT NULL, version INTEGER NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, note TEXT NOT NULL, amount INTEGER NOT NULL, measurement TEXT NOT NULL, complexity NUMBER NOT NULL, mayhem NUMBER NOT NULL, visibility INTEGER NOT NULL, UNIQUE(name))');
    db.run('CREATE TABLE IF NOT EXISTS ingredient (name TEXT NOT NULL, measurement TEXT NOT NULL)');
    db.run('CREATE TABLE IF NOT EXISTS tag (name TEXT NOT NULL, colour TEXT NOT NULL)');

    db.run('CREATE TABLE IF NOT EXISTS role_permission (role_id INTEGER NOT NULL, permission_id INTEGER NOT NULL, FOREIGN KEY(role_id) REFERENCES role (id), FOREIGN KEY(permission_id) REFERENCES permission (id), UNIQUE(role_id, permission_id))');
    db.run('CREATE TABLE IF NOT EXISTS compound_ingredient (compound_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL, amount NUMBER NOT NULL, FOREIGN KEY(compound_id) REFERENCES compound (rowid), FOREIGN KEY(ingredient_id) REFERENCES ingredient (rowid), UNIQUE(compound_id, ingredient_id))');
    db.run('CREATE TABLE IF NOT EXISTS compound_tag (compound_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, FOREIGN KEY(compound_id) REFERENCES compound (rowid), FOREIGN KEY(tag_id) REFERENCES tag (rowid), UNIQUE(compound_id, tag_id))');

    db.prepare("INSERT OR IGNORE INTO role VALUES (?, ?, ?)").run(0, 'level0', 'd47291').run(1, 'level1', 'd8987e').run(2, 'level2', '9ccba0').finalize();
    db.prepare("INSERT OR IGNORE INTO permission VALUES (?, ?)").run(0, 'read_0').run(1, 'read_1').run(2, 'read_2').run(3, 'edit').run(4, 'create').run(5, 'delete').finalize();
    db.prepare("INSERT OR IGNORE INTO role_permission VALUES (?, ?)").run(0, 0).run(0, 1).run(0, 2).run(0, 3).run(0, 4).run(0, 5).run(1, 1).run(1, 2).run(2, 2).finalize();


    // const stmt = db.prepare("INSERT INTO test VALUES (?)");
    // for (let i = 0; i < 10; i++) {
    //     stmt.run("Ipsum " + i);
    // }
    // stmt.finalize();

    db.each("SELECT id, name FROM role", (err, role) => {
        db.each("SELECT permission.name, permission.id FROM role_permission, permission WHERE role_permission.role_id = ? AND role_permission.permission_id = permission.id", role.id, (err, row) => {
            console.log(`${role.name}: ${row.name}`);
        });
    });
});

module.exports = {

}
