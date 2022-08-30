import { Wallet } from 'ethers';

// to sign using Metamask in the dev-tools console of the browser
async function signUsingMetamask(){
  const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
  const account = accounts[0];
  const message = 'I want to participate in the ceremony';
  const signature = await window.ethereum.request({method: 'personal_sign', params: [message, account]});
  console.log('"address": "%s"', account)
  console.log('"signature": "%s"', signature)
}

// to sign using ``` node signMessage.mjs ``` in a terminal
export async function signWithPrivateKey(privateKey, message) {
  const wallet = new Wallet(privateKey);
  const signature = await wallet.signMessage(message);
  // Keep in mind the comma after the address value below
  return [wallet.address, signature];
}

async function getSignatureCLI(){
  const privateKey = '222a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be01';
  const message = 'I want to participate in the ceremony';
  const [address, signature] = await signWithPrivateKey(privateKey, message);
  console.log('"address": "%s",', address);
  console.log('"signature": "%s"', signature);
}

getSignatureCLI();
