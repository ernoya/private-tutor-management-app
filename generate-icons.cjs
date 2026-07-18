const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPNG(width, height) {
  const rawData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const radius = width * 0.18;
      const cornerSize = radius;
      let isCorner = false;
      const corners = [
        [cornerSize, cornerSize],
        [width - cornerSize, cornerSize],
        [cornerSize, height - cornerSize],
        [width - cornerSize, height - cornerSize],
      ];
      for (const [cx, cy] of corners) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radius * radius) {
          const inCornerZone =
            (x < cornerSize || x >= width - cornerSize) &&
            (y < cornerSize || y >= height - cornerSize);
          if (inCornerZone) { isCorner = true; break; }
        }
      }
      if (isCorner) {
        rawData[i] = 0; rawData[i + 1] = 0; rawData[i + 2] = 0; rawData[i + 3] = 0;
      } else {
        const t = (x + y) / (width + height);
        rawData[i] = Math.round(99 + (139 - 99) * t);
        rawData[i + 1] = Math.round(102 + (92 - 102) * t);
        rawData[i + 2] = Math.round(241 + (246 - 241) * t);
        rawData[i + 3] = 255;
      }
    }
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    let crc = 0xffffffff;
    for (const byte of crcData) { crc ^= byte; for (let i = 0; i < 8; i++) { crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } }
    crc ^= 0xffffffff;
    const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const filtered = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    filtered[y * (1 + width * 4)] = 0;
    rawData.copy(filtered, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(filtered);
  return Buffer.concat([signature, makeChunk("IHDR", ihdr), makeChunk("IDAT", compressed), makeChunk("IEND", Buffer.alloc(0))]);
}

const pubDir = path.join(__dirname, "public");
const png192 = createPNG(192, 192);
fs.writeFileSync(path.join(pubDir, "icon-192.png"), png192);
console.log("Created icon-192.png (" + png192.length + " bytes)");
const png512 = createPNG(512, 512);
fs.writeFileSync(path.join(pubDir, "icon-512.png"), png512);
console.log("Created icon-512.png (" + png512.length + " bytes)");
