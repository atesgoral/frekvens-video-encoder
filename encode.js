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
  return Uint16Array.from(array.map((row) => {
    return row.reduce((acc, value, bit) => acc + (value << bit), 0);
  }));
}

function encodeDataFromCsvFile(path) {
  const csv = loadCsvFile(path);
  const array = csvToArray(csv);
  const encoded = encodeData(array);
  return encoded;
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

  fs.writeSync(fd, 'FRFR');
  fs.writeSync(fd, Buffer.from(Uint8Array.from([ 0, 0, 0, 1 ]).buffer));
  fs.writeSync(fd, Buffer.from(Uint32Array.from([ frames.length ]).buffer));

  frames.forEach((frame) => {
    fs.writeSync(fd, Buffer.from(Uint32Array.from([ frame.n ]).buffer));
    fs.writeSync(fd, Buffer.from(frame.data.buffer))
  });

  fs.closeSync(fd);
})();
