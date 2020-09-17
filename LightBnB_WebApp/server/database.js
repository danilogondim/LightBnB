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
    .then(res => {
      console.log(res.rows)
      return res.rows
    })
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
  const query = {
    text: `
      SELECT *
      FROM properties
      LIMIT $1
    `,
    values: [limit]
  }

  return pool
    .query(query)
    .then(res => res.rows);
}
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
