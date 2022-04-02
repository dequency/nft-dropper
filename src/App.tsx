import React from 'react';
import {config, getAirdropTxns, sendWait, countRemaining} from './lib/algorand'
import WalletSession from "./lib/wallet_session"
import {Card, Button, Elevation} from "@blueprintjs/core"


function App() {
  const [loading, setLoading] = React.useState(false)
  const [wallet, setWallet] = React.useState(new WalletSession(config.algod.network))
  const [remaining, setRemaining] = React.useState(0)


  const asset_id = parseInt(window.location.pathname.split("/")[1])


  React.useEffect(()=>{
    if(wallet.isConnected()) return;
    wallet.connect(()=>{})
  }, [wallet])

  React.useEffect(()=>{
    countRemaining(asset_id).then((cnt:number)=>{
      setRemaining(cnt)
    })
  }, [loading])

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
    if(asset_id === aidx) buttons.push(<Button 
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
        <Card elevation={Elevation.TWO}>
          <h3>{remaining} Left</h3> 
        </Card>
        {buttons}
      </div>
      <div hidden={true}>
      </div>
    </div>
  );

    //<audio src='https://github.com/anars/blank-audio/blob/master/30-seconds-of-silence.mp3?raw=true' ></audio>
}

export default App;
