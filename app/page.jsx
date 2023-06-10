"use client";

import { useState } from "react";
import Link from "next/link"
import * as tf from '@tensorflow/tfjs';
import { siteConfig } from "@/config/site"
import { buttonVariants, Button } from "@/components/ui/button"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

let model;
let vocab;

export default function IndexPage() {

  const [loadingDataset, setLoadingDataset] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [jsonDataset, setJsonDataset] = useState([]);

  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isModelReady, setModelReady] = useState(false);

  const csvUrl = 'https://raw.githubusercontent.com/carrycooldude/Talks/main/data/IPL.csv';

  const encodeTeamNames = (data, vocab) => data.map(d => vocab.indexOf(d));

  async function run() {
      setLoadingDataset(true);
      // Create a dataset from the CSV file
      const csvDataset = tf.data.csv(csvUrl);

      setDataset(csvDataset);
      setLoadingDataset(false);

      // Extract column names from the dataset
      const columnNames = await csvDataset.columnNames();
      console.log(columnNames);

      let jsonData = [];
      await csvDataset.forEachAsync(row => {
        let obj = {};
        for (let column of columnNames) {
          if (row[column] != null) {
            if (column === "match_number"){
              obj["id"] = row[column]
            }
            else {
              obj[column] = row[column]
            }
          }
        }
        // Add the object to the JSON data array
        jsonData.push(obj);
      });

      setJsonDataset(jsonData.slice(0, 5));

      console.log("upto")

      // Extract data from the dataset
      const dataArray = await csvDataset.toArray();

      console.log("DataArray", dataArray);

      // Extract team names and results
      const team1_names = dataArray.map(row => row['team1_name']);
      const match_results = dataArray.map(row => row['result']);

      vocab = Array.from(new Set([...team1_names, ...match_results]));

      // Encode team names and results
      let team1_data = encodeTeamNames(team1_names, vocab);
      let labels = encodeTeamNames(match_results, vocab);

      // Define a model
      model = tf.sequential();
      model.add(tf.layers.dense({units: 1, activation: 'sigmoid', inputShape: [1]}));


      // model.add(tf.layers.dense({units: 2, activation: 'softmax'}));

      // Compile the model
      model.compile({optimizer: 'sgd', loss: 'binaryCrossentropy', metrics: ['accuracy']});

      
      // Convert the data to tensors
      const xs = tf.tensor2d(team1_data, [100, 1]);

      const ys = tf.tensor1d(labels);

      // Train the model
      const history = await model.fit(xs, ys, {epochs: 10});

      // Get training accuracy
      const trainingAccuracy = history.history.acc;
      console.log('Training accuracy per epoch:', trainingAccuracy);

      const finalTrainingAccuracy = trainingAccuracy[trainingAccuracy.length - 1];
      console.log('Final training accuracy:', finalTrainingAccuracy);

      setModelReady(true);
  }

  const makePrediction = () => {
    if (!isModelReady) {
      console.error("The model is not ready yet.");
      return;
    }

    // Encode the team names
    let team1_encoded = encodeTeamNames([team1], vocab);
    let team2_encoded = encodeTeamNames([team2], vocab);

    // Make a prediction
    let prediction = model.predict(tf.tensor2d([team1_encoded, team2_encoded]));


    // Interpret the prediction
    prediction.array().then(array => {
      const winner = array[0][0] > array[1][0] ? team1 : team2;
      setPrediction(winner);
    });
  };


  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Predicting IPL Scores <br className="hidden sm:inline" />
          built TensorFlow.js and Nextjs
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Mixing the best of machine learning and <br className="hidden sm:inline" />state of the art web development using JavaScript.
        </p>
      </div>
      <div className="flex gap-4">
        <Button
          className={buttonVariants()}
          onClick={() => run()}
        >
          {
            !loadingDataset && dataset !== null && (
              <>Dataset loaded. Reload?</>
            )
          }
          {
            !loadingDataset && dataset === null && (
              <>Load Dataset to Get Started</>
            )
          }
          {
            loadingDataset && (
              <>Loading...</>
            )
          }
        </Button>
        <Link
          target="_blank"
          rel="noreferrer"
          href={siteConfig.links.github}
          className={buttonVariants({ variant: "outline" })}
        >
          GitHub
        </Link>
        <hr />
      </div>
      <div className="flex max-w-[980px] flex-col items-start gap-2">
      <h1>Match Predictor</h1>
      <input type="text" value={team1} onChange={e => setTeam1(e.target.value)} placeholder="Enter Team 1 name" />
      <input type="text" value={team2} onChange={e => setTeam2(e.target.value)} placeholder="Enter Team 2 name" />
      <button onClick={makePrediction} disabled={!isModelReady}>Predict Winner</button>
      {prediction && <p>The predicted winner is: {prediction}</p>}
    </div>
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <hr />
          { jsonDataset.length > 0 && <DataTable columns={columns} data={jsonDataset} /> }
        <br />
      </div>
    </section>
  )
}
