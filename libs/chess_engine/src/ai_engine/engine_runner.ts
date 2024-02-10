import * as tf from "@tensorflow/tfjs-node";
import path from "path";


export async function runModel(input: number[]): Promise<number[]> {
  // Load TensorFlow SavedModel
  const modelPath = path.resolve(__dirname, "chess_model_tfjs/model.json")
  console.log("Loading model from", modelPath);
  const model = await tf.loadGraphModel(`file://${modelPath}`);

  // Example input data (modify as needed)
  const inputData = tf.tensor2d([input]);

  // Make predictions
  const output = model.predict(inputData) as tf.Tensor;

  // Convert output tensor to a regular array
  const outputData = output.arraySync() as number[];

  console.log("Model output:", outputData);

  return outputData.flat();
}
