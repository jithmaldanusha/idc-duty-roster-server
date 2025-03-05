const db = require("../models/db"); // Assuming 'db' is your database connection object (e.g., Sequelize or other)

exports.getRosterByDate = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required." });
    }

    try {
        const [roster] = await db.query(
            `SELECT sheet_link FROM roster WHERE year = ? AND month = ?;`,
            [year, month]
        );

        if (roster.length > 0) {
            return res.status(200).json({ sheetLink: roster[0].sheet_link });
        } else {
            return res.status(200).json({ sheetLink: null });
        }
    } catch (error) {
        console.error("Error fetching roster:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

exports.updateRoster = async (req, res) => {
    const { year, month, sheetLink } = req.body;

    if (!year || !month || !sheetLink) {
        return res.status(400).json({ message: "Missing required fields: year, month, or sheet link." });
    }

    try {
        // Check if 'roster' table exists, and if not, create it
        await db.query(`
            CREATE TABLE IF NOT EXISTS roster (
                year INT NOT NULL,
                month VARCHAR(20) NOT NULL,
                sheet_link TEXT,
                PRIMARY KEY (year, month)
            );
        `);

        // Check if the roster for the specified year and month already exists
        const [existingRoster] = await db.query(`
            SELECT * FROM roster WHERE year = ? AND month = ?;
        `, [year, month]);

        if (existingRoster.length > 0) {
            // If the roster already exists, update it
            await db.query(`
                UPDATE roster
                SET sheet_link = ?
                WHERE year = ? AND month = ?;
            `, [sheetLink, year, month]);

            return res.status(200).json({ message: "Roster updated successfully." });
        } else {
            // If the roster does not exist, insert a new record
            await db.query(`
                INSERT INTO roster (year, month, sheet_link)
                VALUES (?, ?, ?);
            `, [year, month, sheetLink]);

            return res.status(201).json({ message: "Roster created successfully." });
        }
    } catch (error) {
        console.error("Error updating roster:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
