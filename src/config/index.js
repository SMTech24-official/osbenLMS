require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  digitalOcean: {
    endpoint: process.env.DO_SPACE_ENDPOINT,
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACE_SECRET_KEY,
    bucket: process.env.DO_SPACE_BUCKET
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expires_in: process.env.JWT_EXPIRES_IN || '1d',
  },
};
