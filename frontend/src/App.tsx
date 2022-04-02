import React from 'react';
import {config, getAirdropTxns, sendWait, countRemaining} from './lib/algorand'
import WalletSession from "./lib/wallet_session"
import {Card, Button, Elevation} from "@blueprintjs/core"


function App() {
  const [loading, setLoading] = React.useState(false)
  const [wallet, setWallet] = React.useState(new WalletSession(config.algod.network))
  const [remaining, setRemaining] = React.useState(0)
  const [asset_id, setAssetId] = React.useState<number>(0)

  React.useEffect(()=>{
    if(wallet.isConnected()) return;
    wallet.connect(()=>{})
  }, [wallet])

  const hash = window.location.hash
  React.useEffect(()=>{
    const aid = hash === ""?0:parseInt(hash.split("#")[1]);
    if(aid===0||isNaN(aid)) return;

    setAssetId(aid);
    countRemaining(aid).then((cnt:number)=>{
      setRemaining(cnt)
    })

  }, [loading, asset_id, hash])


  // If no asset id in path, just dump links
  if(asset_id === 0 || isNaN(asset_id)){
    const links = []
    for(const aidx of config.assets){
        links.push(<a key={aidx} href={'#'+aidx.toString()}>{aidx}</a>)
    }
    return (
      <div className='container'>
        {links}
      </div>
    )
  }

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
    if(asset_id === aidx) buttons.push()
  }
  

  return (
    <div className="container">
      <div className='content'>
        <Card elevation={Elevation.TWO}>
          <h3>{remaining} Left</h3> 
          <Button 
              intent='success'
              onClick={()=>{triggerDrop(asset_id)}}
              key={'asset-'+asset_id.toString()} 
              text={'Drop ' + asset_id.toString()} 
              loading={loading}
            />
        </Card>
      </div>
      <div hidden={true}> </div>
    </div>
  );

    //<audio src='https://github.com/anars/blank-audio/blob/master/30-seconds-of-silence.mp3?raw=true' ></audio>
}

export default App;
