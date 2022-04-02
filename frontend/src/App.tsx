import React from 'react';
import { config, getAirdropTxns, sendWait, countRemaining } from './lib/algorand'
import WalletSession from "./lib/wallet_session"
import { AnchorButton, Dialog, Card, Button, Elevation, Classes } from "@blueprintjs/core"
import { BrowserView, MobileView, isIOS, isMobileSafari } from 'react-device-detect'


function App() {
  const [loading, setLoading] = React.useState(false)
  const [wallet, setWallet] = React.useState(new WalletSession(config.algod.network))
  const [connected, setConnected] = React.useState(false)
  const [remaining, setRemaining] = React.useState(0)
  const [asset_id, setAssetId] = React.useState<number>(0)
  const audio_ref = React.useRef<HTMLAudioElement>(document.getElementById('hack') as HTMLAudioElement);

  React.useEffect(() => {
    setConnected(wallet.isConnected())
  }, [wallet])


  const hash = window.location.hash
  React.useEffect(() => {
    const aid = hash === "" ? 0 : parseInt(hash.split("#")[1]);
    if (aid === 0 || isNaN(aid)) return;

    setAssetId(aid);
    countRemaining(aid).then((cnt: number) => {
      setRemaining(cnt)
    })
  }, [loading, asset_id, hash])



  // If no asset id in path, just dump links
  if (asset_id === 0 || isNaN(asset_id)) {
    const links = []
    for (const aidx of config.assets) {
      links.push(<a key={aidx} href={'#' + aidx.toString()}>{aidx}</a>)
    }
    return (
      <div className='container'>
        {links}
      </div>
    )
  }

  async function triggerDrop(asset_id: number) {
    if (!wallet.isConnected()) {
      alert("Not connected to wallet!")
      return
    }

    audio_ref.current?.play()

    setLoading(true)
    const txns = await getAirdropTxns(asset_id, wallet.getDefaultAccount())
    const signed = await wallet.signTxn(txns)
    await sendWait(signed.map((stxn) => { return stxn.blob }))
    setLoading(false)

    audio_ref.current?.pause()
  }


  async function connect() {
    audio_ref.current?.play()
    wallet.connect(() => {
      setConnected(true)
      audio_ref.current?.pause()
    })
  }

  const content = connected ? (
    <Card elevation={Elevation.TWO}>
      <h3>{remaining} Left</h3>
      <Button
        intent='success'
        onClick={() => { triggerDrop(asset_id) }}
        key={'asset-' + asset_id.toString()}
        text={'Drop ' + asset_id.toString()}
        loading={loading}
      />
    </Card>
  ) : <Button onClick={connect}>Connect</Button>

  return (
    <div className="container">
      <div className='content'>
        {content}
      </div>
      <audio hidden id='hack' ref={audio_ref} src='https://github.com/anars/blank-audio/blob/master/30-seconds-of-silence.mp3?raw=true' ></audio>
      <PromptAppNav isOpen={loading} />
    </div>
  );
}

interface PromptAppNavProps {
  isOpen: boolean
}
function PromptAppNav(props: PromptAppNavProps) {
  return (
    <Dialog {...props} >
      <div className={Classes.DIALOG_BODY}>
        <div className='container'>
          <p>Open the Pera Wallet to approve the transaction and come back</p>
          <MobileView >
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