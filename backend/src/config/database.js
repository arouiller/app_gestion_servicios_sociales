const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'app_gestion_servicios_sociales',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    timezone: '-03:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: { timestamps: false, freezeTableName: true },
  }
);

module.exports = sequelize;
