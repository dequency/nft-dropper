import algosdk, { Transaction, TransactionParams } from "algosdk";

import WalletConnect from "@walletconnect/client";
import WalletConnectQRCodeModal from "algorand-walletconnect-qrcode-modal";

import { formatJsonRpcRequest } from "@json-rpc-tools/utils";


interface SignedTxn {
    txID: string
    blob: Uint8Array
};

export default class WalletSession {
  accounts: string[];
  defaultAccount: number;
  network: string;
  connector: WalletConnect;

  constructor(network: string) {
    this.accounts = [];
    this.defaultAccount = 0;
    this.network = network;
    this.connector = new WalletConnect({
        bridge : "https://bridge.walletconnect.org",
        qrcodeModal: WalletConnectQRCodeModal,
    });
  }

  async connect(cb: any): Promise<boolean> {
    // Check if connection is already established
    if (this.connector.connected) return true;

    this.connector.createSession();

    this.connector.on("connect", (error, payload) => {
      if (error) {
        throw error;
      }
      const { accounts } = payload.params[0];
      this.accounts = accounts;
      cb(accounts);
    });

    this.connector.on("session_update", (error, payload) => {
      if (error) {
        throw error;
      }
      const { accounts } = payload.params[0];
      this.accounts = accounts;
      cb(accounts);
    });

    this.connector.on("disconnect", (error, payload) => {
      if (error) throw error;
    });


    return new Promise(resolve=>{
      const reconn = setInterval(() => {
        if (this.connector.connected) {
          clearInterval(reconn);
          resolve(true);
          return;
        }
        this.connector.connect();
      }, 100);
    });
  }

  isConnected(): boolean {
    return this.connector.connected;
  }

  disconnect() {
    this.connector.killSession();
  }

  getDefaultAccount(): string {
    if (!this.isConnected()) return "";
    return this.connector.accounts[this.defaultAccount];
  }

  async signTxn(txns: Transaction[]): Promise<SignedTxn[]> {
    const defaultAddress = this.getDefaultAccount();
    const txnsToSign = txns.map((txn) => {
      const encodedTxn = Buffer.from(
        algosdk.encodeUnsignedTransaction(txn)
      ).toString("base64");

      if (algosdk.encodeAddress(txn.from.publicKey) !== defaultAddress)
        return { txn: encodedTxn, signers: [] };
      return { txn: encodedTxn };
    });

    const request = formatJsonRpcRequest("algo_signTxn", [txnsToSign]);

    const result: string[] = await this.connector.sendCustomRequest(request);

    return result.map((element, idx) => {
      return element
        ? {
            txID: txns[idx].txID(),
            blob: new Uint8Array(Buffer.from(element, "base64")),
          }
        : {
            txID: txns[idx].txID(),
            blob: new Uint8Array(),
          };
    });
  }

}