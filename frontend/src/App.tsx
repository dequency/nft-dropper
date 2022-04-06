import React from 'react';
import { config, getAirdropTxns, sendWait, countRemaining } from './lib/algorand'
import WalletSession from "./lib/wallet_session"
import { AnchorButton, Dialog, Card, Button, Elevation, Classes } from "@blueprintjs/core"
import { MobileView, isIOS } from 'react-device-detect'
import {MediaDisplay} from './MediaDisplay'
import { NFT } from './lib/nft';

function App() {

  const [loading, setLoading] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [wallet, setWallet] = React.useState(new WalletSession(config.algod.network))
  const [connected, setConnected] = React.useState(false)
  const [remaining, setRemaining] = React.useState(0)
  const [asset_id, setAssetId] = React.useState<number>(0)
  const [success, setSuccess] = React.useState(false); //TODO:: @harsh hardcode to true
  const [nft, setNFT] = React.useState<NFT|undefined>(undefined)

  // This is the hack that makes iOS not kill our websocket with WalletConnect
  const audio_ref = React.useRef<HTMLAudioElement>(document.getElementById('hack') as HTMLAudioElement);

  window.addEventListener("hashchange", () => {
    const hash = window.location.hash
    const aid = hash === "" ? 0 : parseInt(hash.split("#")[1])
    setAssetId(isNaN(aid) ? 0 : aid);
  })


  const hash = window.location.hash
  const aid = hash === "" ? 0 : parseInt(hash.split("#")[1])


  React.useEffect(() => { setConnected(wallet.isConnected()) }, [wallet])
  React.useEffect(() => {

    if(aid !== 0 && ! isNaN(aid)){
      setAssetId(aid);
    }

    if (asset_id === 0) return;

    NFT.fromAssetId(asset_id).then((nft)=>{
      setNFT(nft)
    })

    countRemaining(asset_id).then((cnt: number) => {
      setRemaining(cnt)
    })

  }, [loading, asset_id])


  // If no asset id in path, just dump links
  if (asset_id === 0) {
    const links = config.assets.map((aidx)=>{
        return <a key={aidx} href={'#' + aidx.toString()}>{aidx}</a>
    })

    return (
      <div className='container'>
        {links}
      </div>
    )
  }

  async function triggerDrop(asset_id: number) {
    audio_ref.current?.play()
    setLoading(true)

    const txns = await getAirdropTxns(asset_id, wallet.getDefaultAccount())
    const signed = await wallet.signTxn(txns)
    const result = await sendWait(signed.map((stxn) => { return stxn.blob }))

    setLoading(false)
    audio_ref.current?.pause()

    if(result['confirmed-round']>0){
      setSuccess(true)
    }
  }

  async function connect() {
    audio_ref.current?.play()
    wallet.connect(() => {
      setConnected(true)
      audio_ref.current?.pause()
    })
  }

  const display = nft === undefined ? <></>: <MediaDisplay
    mediaSrc={nft.mediaURL()}
    mimeType={nft.metadata.mimeType()}
  />

  let asset_name = nft=== undefined? asset_id.toString():nft.name()
  if(asset_name === ""){
    asset_name = "tbd asset name"
  }


  const content = connected ? (
    <Card elevation={Elevation.TWO}>
      <h2>{asset_name}</h2>
      <div className='content'>
        {display}
      </div>
      <div className='action'>
        <h3 style={{paddingRight:'10px'}}>{remaining} Left</h3>
        <Button
          intent='success'
          onClick={() => { triggerDrop(asset_id) }}
          key={'asset-' + asset_name}
          text={'Gib me ' + asset_name}
          disabled={success}
          loading={loading}
        />
      </div>
    </Card>
  ) : <Button onClick={connect}>Connect</Button>

  return (
    <div className="container">
      <div className='content'>
        {content}
      </div>
      <audio hidden id='hack' ref={audio_ref} src='https://github.com/anars/blank-audio/blob/master/30-seconds-of-silence.mp3?raw=true' ></audio>
      <PromptAppNav isOpen={loading} />
      <SuccessfulDrop isOpen={success} />
    </div>
  );
}

interface SuccessfulDropProps {
  isOpen: boolean
}
function SuccessfulDrop(props: SuccessfulDropProps) {
  return (
    <Dialog {...props} >
      <div className={Classes.DIALOG_BODY}>
        <div className='container'>
            <p>Success!</p>
        </div>
      </div>
    </Dialog>
  )
}

interface PromptAppNavProps {
  isOpen: boolean
}
function PromptAppNav(props: PromptAppNavProps) {
  return (
    <Dialog {...props} >
      <div className={Classes.DIALOG_BODY}>
        <div className='container'>
          <div className='content'>
            <p>Open the Pera Wallet to approve the transaction then come back</p>
          </div>
          <MobileView>
            <AnchorButton
              style={{ borderRadius: '8px', margin: '20px 0px -30px' }}
              text='Take me there'
              href={isIOS ? "algorand-wc://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1" : "wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1"}
              intent="success"
              large={true}
              minimal={true}
              outlined={true}
              rightIcon="double-chevron-right"
            />
          </MobileView>
        </div>
      </div>
    </Dialog>
  )
}

export default App;