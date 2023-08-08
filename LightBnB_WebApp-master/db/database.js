
const pg = require("pg");

const Pool = pg.Pool;
const config = {
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb",
};

const pool = new Pool(config);


/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
return pool
.query(
  `
        SELECT * 
        FROM users
        WHERE email = $1`,
  [email]
)

.then((result) => {
    console.log(result.rows);
    if (!result.rows[0]) {
      return null;
    }
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function(id) {
return pool
.query(
  `
        SELECT *
        FROM users
        WHERE id = $1`,
  [id]
)

.then((result) => {
    if (!result.rows[0]) {
      return null;
    }
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser =  function(user) {
    pool.query('INSERT INTO users VALUES (DEFAULT, $1, $2, $3 ) RETURNING *;', [user.name, user.email, user.password])
      .then((user) => {
        console.log(user.rows);
        return user.rows[0];
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = function (guest_id, limit = 10) {
    return pool
    .query(
      `
			SELECT reservations.*, properties.title as title, cost_per_night, avg(property_reviews.rating) as average_rating, number_of_bathrooms, parking_spaces, number_of_bedrooms, thumbnail_photo_url
			FROM reservations
			JOIN property_reviews ON reservation_id = reservations.id
			JOIN properties ON properties.id = reservations.property_id
			WHERE reservations.guest_id = $1
			GROUP BY reservations.id, properties.id
			ORDER BY start_date
			LIMIT $2
		`,
      [guest_id, limit]
    )

.then((result) => {
    console.log(result.rows);
    if (!result.rows) {
      return null;
    }
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {
    // 1 Setup an array to hold any parameters that may be available for the query.
    const queryParams = [];
    // 2 Start the query with all information that comes before the WHERE clause.
    let queryString = `
      SELECT *
      FROM properties
      `;
    // 3 Check if a city has been passed in as an option
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      if (queryParams.length === 1) {
        queryString += 'WHERE ';
      } else {
        queryString += 'AND ';
      }
      queryString += `city LIKE $${queryParams.length} `;
    }
    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      if (queryParams.length === 1) {
        queryString += 'WHERE';
      } else {
        queryString += 'AND ';
      }
      queryString += `owner_id = $${queryParams.length} `;
    }
    if (options.minimum_price_per_night) {
      queryParams.push(`${options.minimum_price_per_night * 100}`);
      if (queryParams.length === 1) {
        console.log('min complete');
        queryString += 'WHERE';
      } else {
        queryString += 'AND ';
      }
      queryString += `cost_per_night >= $${queryParams.length} `;
    }
    if (options.maximum_price_per_night) {
      queryParams.push(`${options.maximum_price_per_night * 100}`);
      if (queryParams.length === 1) {
        console.log('max complete');
        queryString += 'WHERE';
      } else {
        queryString += 'AND ';
      }
      queryString += `cost_per_night <= $${queryParams.length} `;
    }
    if (options.minimum_rating) {
                queryParams.push(options.minimum_rating);
                if (queryParams.length === 1) {
                  queryString += `WHERE avg(property_reviews.rating) >= $${queryParams.length} `;
                } else {
                  queryString += `AND avg(property_reviews.rating) >= $${queryParams.length} `;
                }
              }
    // 4 Add any query that comes after the WHERE clause.
    queryParams.push(limit);
    queryString += `
      GROUP BY properties.id
      ORDER BY cost_per_night
      LIMIT $${queryParams.length};
      `;
    // 5 Console log everything 
    console.log(queryString, queryParams);
    // 6 Run the query
    return pool.query(queryString, queryParams)
      .then((res) => {
        console.log(res.rows);
        return res.rows;
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function(property) {
    const newArr = Object.keys(property).map(key => property[key]);
    console.log('hi');
    console.log(newArr);
    return pool.query(` INSERT INTO properties (
      title, 
      description, 
      owner_id, 
      cover_photo_url, 
      thumbnail_photo_url, 
      cost_per_night, 
      parking_spaces, 
      number_of_bathrooms, 
      number_of_bedrooms, 
      active, 
      province, 
      city, 
      country, 
      street, 
      post_code) 
      VALUES (
      $1,
      $2,
      $14,
      $8,
      $7,
      $6,
      $5,
      $4,
      $3,
      true,
      $12,
      $11,
      $10,
      $9,
      $13
      )
    RETURNING *
    `, newArr)
      .then((res) => {
        console.log(res.rows);
        return res.rows;
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
