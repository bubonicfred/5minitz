import { Mongo } from "meteor/mongo";
import { MongoClient } from "mongodb";

/**
 * Connects to a MongoDB database using the provided URL.
 *
 * @param {string} mongoUrl - The URL of the MongoDB database.
 * @returns {Promise} A promise that resolves to the connected MongoDB client.
 * @throws {Error} If there is an error connecting to the MongoDB database.
 */
export const connectMongo = async (mongoUrl) => {
  try {
    return await MongoClient.connect(mongoUrl);
  } catch (error) {
    throw new Error(`Error: ${error}`);
  }
};
/**
 * Creates a new Mongo collection with the provided options.
 *
 * @param {string} title - The title of the Mongo collection.
 * @param {Object} options - The options for the Mongo collection.
 * @returns {Mongo.Collection} The new Mongo collection.
 */
export const createCollection = (title, options) => {
  return new Mongo.Collection(title, options);
};
