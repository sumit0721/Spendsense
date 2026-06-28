const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a receipt image buffer to S3 under a per-user prefix, so one
 * user's receipts are namespaced separately from another's. Returns the
 * S3 object key (not a public URL — the bucket is private by design;
 * actual viewing would need a signed URL generated on demand, not done
 * here since the OCR flow doesn't currently need to redisplay the image).
 */
const uploadReceiptToS3 = async (buffer, mimetype, userId) => {
  const key = `receipts/${userId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));

  return key;
};

module.exports = { uploadReceiptToS3 };
