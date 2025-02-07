import express from "express";
import cors from "cors";
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import { Parser } from "json2csv"; // Import json2csv

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: "https://swachhata-cell-frontend.vercel.app" }));
app.use(express.json());

// Database Connection
// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT, // 'mysql' or 'postgres'
//   }
// );

const sequelize = new Sequelize(process.env.DB_HOST, {
  dialect: "postgres",
  logging: false, // Set to true if you want to see SQL logs
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Set to true if using a trusted CA certificate
    },
  },
});

sequelize
  .authenticate()
  .then(() => console.log("✅ SQL Database connected"))
  .catch((err) => console.error("❌ SQL Connection error:", err));

// Define Model (Table)
const Form = sequelize.define("Form", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  locality: { type: DataTypes.STRING, allowNull: false },
  wasteCollectedDaily: { type: DataTypes.STRING },
  segregateWaste: { type: DataTypes.STRING },
  cleanDrains: { type: DataTypes.STRING },
  awareRRR: { type: DataTypes.STRING },
  usedPublicToilet: { type: DataTypes.STRING },
  cleanPublicToilet: { type: DataTypes.STRING },
  awareCTLocation: { type: DataTypes.STRING },
  cleanlinessNeighborhood: { type: DataTypes.STRING },
  cleanlinessCity: { type: DataTypes.STRING },
});

// Sync Database
sequelize.sync().then(() => console.log("✅ Database & Tables Ready"));

// Submit Form Data (POST)
app.post("/submit", async (req, res) => {
  try {
    const newEntry = await Form.create(req.body);
    res.status(201).json({ message: "✅ Response submitted successfully!", data: newEntry });
  } catch (err) {
    console.error("❌ Error submitting form:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch Form Data (GET)
app.get("/data", async (req, res) => {
  try {
    const data = await Form.findAll();
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// Export Data as CSV
app.get("/export", async (req, res) => {
  const adminToken = req.query.adminToken;

  // Replace 'secureAdmin123' with a more secure key stored in .env
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "❌ Access denied" });
  }

  try {
    const data = await Form.findAll();
    if (!data.length) {
      return res.status(404).json({ error: "No data available for export" });
    }

    const fields = [
      "name",
      "email",
      "locality",
      "wasteCollectedDaily",
      "segregateWaste",
      "cleanDrains",
      "awareRRR",
      "usedPublicToilet",
      "cleanPublicToilet",
      "awareCTLocation",
      "cleanlinessNeighborhood",
      "cleanlinessCity",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("survey_data.csv");
    return res.send(csv);
  } catch (err) {
    console.error("❌ Error exporting data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
