// Utilities to help with API versioning using a base prefix

export const API_PREFIX = process.env.API_PREFIX || '/api';
export const API_VERSION = process.env.API_VERSION || 'v1';
export const API_BASE = `${API_PREFIX}/${API_VERSION}`;


