importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.8.0/dist/tf.min.js");

function formatInput(waveformData) {
    const waveformArrays = Object.values(waveformData);
    const input = tf.tensor2d(transposeMatrix(waveformArrays)).reshape([1, 6001, 6]);
    return input;
}

function transposeMatrix(matrix) {
    const numRows = matrix.length
    const numColumns = matrix[0].length
    let tMatrix = Array(numColumns).fill().map(() => Array(numRows));
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            tMatrix[j][i] = matrix[i][j]
        }
    }
    return tMatrix
}

async function loadModel() {
    const model = await tf.loadLayersModel('L5U2B512Onadam/model.json');
    return model;
};


onmessage = (async function(e) {
    const input = formatInput(e.data)
    const model = await loadModel();
    console.log("Worker: Message received from main script")
    const startTime = performance.now();
    const output =  await model.predict(input)
    const totalTime = performance.now() - startTime;
    output.reshape([6001]).array().then(predict => postMessage(predict))
    console.log('Worker: Posting message back to main script');
})