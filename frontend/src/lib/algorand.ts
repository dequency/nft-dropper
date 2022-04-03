import algosdk from 'algosdk'
import ABIdef from "./abi.json"
import Conf from './config.json'


interface configuration {
    appId: number
    assets: number[]
    algod: {
        network: string
        host: string
        token: string
        port: string 
    }
}


export const config = Conf as configuration

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
    // Empty signer, just a placeholder
    const signer = algosdk.makeBasicAccountTransactionSigner({} as algosdk.Account)
    // Build transaction group
    const sp = await client.getTransactionParams().do()
    const atc = new algosdk.AtomicTransactionComposer()
    // Opt into asset
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
    // Method call to drop the asset
    atc.addMethodCall({
        appID: config.appId, 
        method: getMethodByName("drop"), 
        sender: sender, 
        suggestedParams: sp,
        methodArgs:[asset_id],
        signer: signer 
    })
    // Dump transaction array
    return atc.buildGroup().map((tws)=>{ return tws.txn})
}