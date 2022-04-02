import algosdk from 'algosdk'
import ABIdef from "./abi.json"


export const config = {
    appId: 81677804,
    assets: [81677963, 81677921, 81677898, 81677864, 81677845],
    algod: {
        network:"TestNet",
        host: "https://testnet-api.algonode.cloud",
        token: "",
        port: "" 
    }
    //algod: {
    //    network:"sandnet-v1",
    //    host: 'http://localhost',
    //    token: "a".repeat(64),
    //    port: 4001
    //}
}


const iface = new algosdk.ABIInterface({...ABIdef})

// Utility function to return an ABIMethod by its name
function getMethodByName(name: string): algosdk.ABIMethod  {
    const m = iface.methods.find((mt: algosdk.ABIMethod)=>{ return mt.name===name })
    if(m === undefined)
        throw Error("Method undefined: "+name)
    return m
}

const client = new algosdk.Algodv2(config.algod.token, config.algod.host, config.algod.port)

export async function countRemaining(asset_id: number): Promise<number> {
    const app_addr = algosdk.getApplicationAddress(config.appId)
    const ainfo = await client.accountAssetInformation(app_addr, asset_id).do()
    return ainfo['asset-holding']['amount']
}

export async function sendWait(stxns: Uint8Array[]): Promise<any> {
    const {txId} = await client.sendRawTransaction(stxns).do()
    const result = await algosdk.waitForConfirmation(client, txId, 2)
    return result
}

export async function getAirdropTxns(asset_id: number, sender: string): Promise<algosdk.Transaction[]> {
    const signer = algosdk.makeBasicAccountTransactionSigner({} as algosdk.Account)
    const sp = await client.getTransactionParams().do()
    const atc = new algosdk.AtomicTransactionComposer()
    atc.addTransaction({
        txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            assetIndex: asset_id,
            from: sender,
            to: sender,
            suggestedParams: sp,
            amount: 0
        }),
        signer: signer
    })
    atc.addMethodCall({
        appID: config.appId, 
        method: getMethodByName("drop"), 
        sender: sender, 
        suggestedParams: sp,
        methodArgs:[asset_id],
        signer: signer 
    })
    return atc.buildGroup().map((tws)=>{ return tws.txn})
}