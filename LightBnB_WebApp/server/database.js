const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = email => {
  const query = {
    text: `
      SELECT *
      FROM users
      WHERE email = $1
    `,
    values: [email.toLowerCase()]
  }
  return pool
    .query(query)
    .then(res => res.rows[0]);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = id => {
  const query = {
    text: `
      SELECT *
      FROM users
      WHERE id = $1
    `,
    values: [id]
  }
  return pool
    .query(query)
    .then(res => res.rows[0]);
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = user => {
  const query = {
    text: `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3) RETURNING *;  
    `,
    values: [user.name, user.email, user.password]
  }
  return pool
    .query(query)
    .then(res => res.rows)
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = (guest_id, limit = 10) => {

  const query = {
    text: `
      SELECT reservations.*, properties.*, AVG(rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1 AND end_date < Now()::date
      GROUP BY reservations.id, properties.id
      ORDER BY start_date
      LIMIT $2;  
      `,
    values: [guest_id, limit]
  }

  return pool
    .query(query)
    .then(res => res.rows)
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {

  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `AND owner_id=$${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night));
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night));
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }

  queryString += `
  GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `HAVING AVG(rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool
    .query(queryString, queryParams)
    .then(res => {
      return res.rows
    });
}
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = property => {

  const queryParams = [];
  let queryCols = `INSERT INTO properties (`;
  let queryValues = `VALUES (`;

  for (const key in property) {
    queryParams.push(property[key]);
    queryCols += queryParams.length === 1 ? `${key}` : `, ${key}`;
    queryValues += queryParams.length === 1 ? `$${queryParams.length}` : `, $${queryParams.length}`;
  };

  queryCols += ')\n'
  queryValues += ') RETURNING *;'
  const queryString = queryCols + queryValues;

  return pool
    .query(queryString, queryParams)
    .then(res => res.rows);
}
exports.addProperty = addProperty;
