const UINT32_SIZE = 4;
const INT32_SIZE = 4;
const FLOAT32_SIZE = 4;
const TREE_GEOMETRY_HEADER_ENTRIES = 4;
const TREE_GEOMETRY_HEADER_SIZE = UINT32_SIZE * TREE_GEOMETRY_HEADER_ENTRIES;

const _getTreeGeometrySizeFromMetadata = metadata => {
  const {numPositions, numUvs, numIndices, numTrees} = metadata;

  return TREE_GEOMETRY_HEADER_SIZE + // header
    (FLOAT32_SIZE * numPositions) + // positions
    (FLOAT32_SIZE * numUvs) + // uvs
    (UINT32_SIZE * numIndices) + // indices
    (UINT32_SIZE * numTrees) + // trees
    (UINT32_SIZE * 2); // height range
};

const _getTreeGeometrySize = treeGeometry => {
  const {positions, uvs, indices, trees} = treeGeometry;

  const numPositions = positions.length;
  const numUvs = uvs.length;
  const numIndices = indices.length;
  const numTrees = trees.length;

  return _getTreeGeometrySizeFromMetadata({
    numPositions,
    numUvs,
    numIndices,
    numTrees,
  });
};

const _getTreeGeometryBufferSize = (arrayBuffer, byteOffset) => {
  const headerBuffer = new Uint32Array(arrayBuffer, byteOffset, TREE_GEOMETRY_HEADER_ENTRIES);
  const numPositions = headerBuffer[0];
  const numUvs = headerBuffer[1];
  const numIndices = headerBuffer[2];
  const numTrees = headerBuffer[3];

  return _getTreeGeometrySizeFromMetadata({
    numPositions,
    numUvs,
    numIndices,
    numTrees,
  });
};

// stringification

const stringifyTreeGeometry = (treeGeometry, arrayBuffer, byteOffset) => {
  const {positions, uvs, indices, trees, heightRange} = treeGeometry;

  if (arrayBuffer === undefined || byteOffset === undefined) {
    const bufferSize = _getTreeGeometrySize(treeGeometry);
    arrayBuffer = new ArrayBuffer(bufferSize);
    byteOffset = 0;
  }

  const headerBuffer = new Uint32Array(arrayBuffer, byteOffset, TREE_GEOMETRY_HEADER_ENTRIES);
  headerBuffer[0] = positions.length;
  headerBuffer[1] = uvs.length;
  headerBuffer[2] = indices.length;
  headerBuffer[3] = trees.length;
  byteOffset += TREE_GEOMETRY_HEADER_SIZE;

  const positionsBuffer = new Float32Array(arrayBuffer, byteOffset, positions.length);
  positionsBuffer.set(positions);
  byteOffset += FLOAT32_SIZE * positions.length;

  const uvsBuffer = new Float32Array(arrayBuffer, byteOffset, uvs.length);
  uvsBuffer.set(uvs);
  byteOffset += FLOAT32_SIZE * uvs.length;

  const indicesBuffer = new Uint32Array(arrayBuffer, byteOffset, indices.length);
  indicesBuffer.set(indices);
  byteOffset += UINT32_SIZE * indices.length;

  const treesBuffer = new Float32Array(arrayBuffer, byteOffset, trees.length);
  treesBuffer.set(trees);
  byteOffset += FLOAT32_SIZE * trees.length;

  const heightRangeBuffer = new Float32Array(arrayBuffer, byteOffset, 2);
  heightRangeBuffer[0] = heightRange[0];
  heightRangeBuffer[1] = heightRange[1];
  byteOffset += UINT32_SIZE * 2;

  return arrayBuffer;
};

const _sum = a => {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    const e = a[i];
    result += e;
  }
  return result;
};

const stringifyTreeGeometries = treeGeometrys => {
  const treeGeometrySizes = treeGeometrys.map(_getTreeGeometrySize);
  const bufferSize = _sum(treeGeometrySizes);
  const arrayBuffer = new ArrayBuffer(bufferSize);

  let byteOffset = 0;
  for (let i = 0; i < treeGeometrys.length; i++) {
    const treeGeometry = treeGeometrys[i];

    stringifyTreeGeometry(treeGeometry, arrayBuffer, byteOffset);

    const treeGeometrySize = treeGeometrySizes[i];
    byteOffset += treeGeometrySize;
  }

  return arrayBuffer;
};

// parsing

const parseTreeGeometry = (buffer, byteOffset) => {
  if (byteOffset === undefined) {
    byteOffset = 0;
  }

  const headerBuffer = new Uint32Array(buffer, byteOffset, TREE_GEOMETRY_HEADER_ENTRIES);
  const numPositions = headerBuffer[0];
  const numUvs = headerBuffer[1];
  const numIndices = headerBuffer[2];
  const numTrees = headerBuffer[3];
  byteOffset += TREE_GEOMETRY_HEADER_SIZE;

  const positionsBuffer = new Float32Array(buffer, byteOffset, numPositions);
  const positions = positionsBuffer;
  byteOffset += FLOAT32_SIZE * numPositions;

  const uvsBuffer = new Float32Array(buffer, byteOffset, numUvs);
  const uvs = uvsBuffer;
  byteOffset += FLOAT32_SIZE * numUvs;

  const indicesBuffer = new Uint32Array(buffer, byteOffset, numIndices);
  const indices = indicesBuffer;
  byteOffset += UINT32_SIZE * numIndices;

  const treesBuffer = new Float32Array(buffer, byteOffset, numTrees);
  const trees = treesBuffer;
  byteOffset += FLOAT32_SIZE * numTrees;

  const heightRangeBuffer = new Float32Array(buffer, byteOffset, 2);
  const heightRange = [
    heightRangeBuffer[0],
    heightRangeBuffer[1],
  ];
  byteOffset += UINT32_SIZE * 2;

  return {
    buffer,
    positions,
    uvs,
    indices,
    trees,
    heightRange,
  };
};

const parseTreeGeometries = arrayBuffer => {
  const treeGeometries = [];

  let byteOffset = 0;
  while (byteOffset < arrayBuffer.byteLength) {
    const treeGeometry = parseTreeGeometry(arrayBuffer, byteOffset);
    treeGeometries.push(treeGeometry);

    const treeGeometrySize = _getTreeGeometryBufferSize(arrayBuffer, byteOffset);
    byteOffset += treeGeometrySize;
  }

  return treeGeometrys;
};

export {
  stringifyTreeGeometry,
  stringifyTreeGeometries,
  parseTreeGeometry,
  parseTreeGeometries,
};
