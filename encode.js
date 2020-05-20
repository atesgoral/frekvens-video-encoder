const fs = require('fs');

const globby = require('globby');

function loadCsvFile(path) {
  return fs.readFileSync(path, { encoding: 'UTF-8' });
}

function csvToArray(csv) {
  return csv
    .split('\r\n')
    .map((row) => row.split(',').map((s) => parseInt(s, 10)));
}

function encodeData(array) {
  if (array.length !== 16) {
    throw new Error('Expected 16 rows');
  }

  return Uint16Array.from(array.map((row) => {
    if (row.length !== 16) {
      throw new Error('Expected 16 columns');
    }

    return row.reduce((acc, value, bit) => acc + (value << bit), 0);
  }));
}

function encodeDataFromCsvFile(path) {
  try {
    const csv = loadCsvFile(path);
    const array = csvToArray(csv);
    const encoded = encodeData(array);
    return encoded;
  } catch (error) {
    throw new Error(`Error while encoding ${path}: ${error.message}`);
  }
}

function writeBytes(fd, typedArray) {
  const buffer = Buffer.from(typedArray.buffer);
  const bytesWritten = fs.writeSync(fd, buffer, 0, buffer.length, null);

  if (bytesWritten !== buffer.length) {
    throw new Error('Not enough bytes written');
  }
}

(async () => {
  const paths = await globby('./frames/*.csv');

  const frames = paths.map((path) => {
    const [, nstr] = /(\d+)\.csv$/.exec(path);
    return {
      n: parseInt(nstr, 10),
      data: encodeDataFromCsvFile(path)
    };
  });

  frames.sort((a, b) => a.n - b.n);

  const fd = fs.openSync('./frames.bin', 'w');

  const headerArray = Uint8Array.from(Buffer.from('FRFR'));
  const versionArray = Uint8Array.from([ 0, 0, 0, 1 ]);
  const frameCountArray = Uint32Array.from([ frames.length ]);

  writeBytes(fd, headerArray);
  writeBytes(fd, versionArray);
  writeBytes(fd, frameCountArray);

  let prevN = null;

  frames.forEach((frame, i) => {
    if (prevN !== null && frame.n - prevN > 1) {
      console.warn(`${frame.n - prevN - 1} frames skipped before frame ${frame.n}`);
    }

    prevN = frame.n;

    writeBytes(fd, Uint32Array.from([ frame.n ]));
    writeBytes(fd, frame.data);
  });

  fs.closeSync(fd);

  console.log(`${frames.length} frames encoded`);
})().catch((error) => {
  console.error(error.message);
});
