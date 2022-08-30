import { writeFile } from 'fs';
import { Wallet } from 'ethers';
import { signWithPrivateKey } from "./signWithPrivateKey.mjs";

async function generateParticipantCSV(){
    const message = 'I want to participate in the ceremony';
    const amount = 10;
    let lines = 'address,signature,privateKey\n';
    for (let i = 0; i < amount; i++) {
      console.log('participant no. ' + i);
      const wallet = Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const [address, signature] = await signWithPrivateKey(privateKey, message);
      lines = lines + address + ',' + signature + ',' + privateKey + '\n';
    }
    writeFile('./tests/participants.csv', lines, "utf-8", (err) => {
      if (err) console.log(err);
      else console.log(`Participants data created in /tests/participants.csv`);
    });
}

generateParticipantCSV();