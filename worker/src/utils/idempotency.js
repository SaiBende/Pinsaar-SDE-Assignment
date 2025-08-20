import crypto from 'crypto';

export const generateIdempotencyKey = (noteId, releaseAt) => {
  return crypto.createHash('sha256')
    .update(`${noteId}:${releaseAt}`)
    .digest('hex');
};
