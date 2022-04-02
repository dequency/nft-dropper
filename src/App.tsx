import React from 'react';
import {config, getAirdropTxns, sendWait} from './lib/algorand'
import WalletSession from "./lib/wallet_session"
import {Button} from "@blueprintjs/core"


function App() {
  const [loading, setLoading] = React.useState(false)
  const [wallet, setWallet] = React.useState(new WalletSession(config.algod.network))


  React.useEffect(()=>{
    if(wallet.isConnected()) return;
    wallet.connect(()=>{})
  }, [wallet])

  async function triggerDrop(asset_id: number){
    if(!wallet.isConnected()) {
      alert("Not connected to wallet!")
      return
    }
    setLoading(true)
    const txns = await getAirdropTxns(asset_id, wallet.getDefaultAccount())
    const signed = await wallet.signTxn(txns)
    const result = await sendWait(signed.map((stxn)=>{return stxn.blob}))
    setLoading(false)
    console.log(result)
  }

  const buttons = []
  for(const aidx of config.assets){
    buttons.push(<Button 
      intent='success'
      onClick={()=>{triggerDrop(aidx)}}
      key={'asset-'+aidx.toString()} 
      text={'Drop ' + aidx.toString()} 
      loading={loading}
    />)
  }

  return (
    <div className="container">
      <div className='content'>
        {buttons}
      </div>
    </div>
  );
}

export default App;
