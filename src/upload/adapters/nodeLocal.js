import request from 'request';
import path from 'path';
import fs from 'fs';
import denodeify from 'denodeify';

const stat = denodeify(fs.stat);

function uploadToS3(url, filePath, size) {
  return new Promise((resolve, reject) => {
    const req = request.put({
      url,
      headers: {
        'x-amz-acl': 'public-read',
        'content-length': size,
      },
    })
    .on('response', (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Invalid status code: ${res.statusCode}`));
      }
    })
    .on('error', reject);

    fs.createReadStream(filePath).pipe(req);
  });
}

export default async function nodeLocal(client, filePath) {
  const { size } = await stat(filePath);
  const format = path.extname(filePath).slice(1);

  const { id, url } = await client.uploadRequest.create({
    filename: path.basename(filePath),
  });

  await uploadToS3(url, filePath, size);

  return {
    path: id,
    size,
    format,
  };
}
