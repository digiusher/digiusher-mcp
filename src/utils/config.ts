/**
 * Application configuration
 *
 * This file centralizes configuration values that may differ between
 * development and production environments.
 */

/**
 * Base URL for the Digiusher API
 * Can be overridden via DIGIUSHER_API_BASE_URL environment variable
 *
 * Default: https://app.digiusher.com
 */
export const API_BASE_URL =
  process.env.DIGIUSHER_API_BASE_URL || "https://app.digiusher.com";
