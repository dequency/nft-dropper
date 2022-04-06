from abc import get_cache_token
from algosdk import *
from algosdk.future.transaction import *
from algosdk.v2client import algod
import hashlib
import json

token = "a" * 64
host = "http://localhost:4001"
client = algod.AlgodClient(token, host)

configs = [
    {
        "file": "Boiish - Nothin fancy ft. C-240 by Yucef Merhi",
        "img": "bafybeibdtybsjf22k6nzw4cezyqycxzgt2uyviqnavm4ytzhbecbhrm2jm",
        "integ":"GbQerxFPAqPBdxlR3XDL8P51WOB+TDM5nBEZEl4Oivw=",
        "animation": "bafybeigmc3jau5vwvbeipib5vwdsj5ofgatxtcfek6kukopyzs45gjseme",
        "md":"bafybeibrrcgy7m2tyz5brpc5r3w4edgtknf25o3v5dbjuqeaogmpld25cy",
        "sounds": "Boiish",
        "unit":"240-1"
    },
    {
        "file": "Jonny From Space - Full Glass ft. C-240 by Yucef Merhi",
        "img": "bafybeig2525pjxnxnq2j66x6phjrqtedmbkhy5bhemzqi223rnboixgfba",
        "integ":"NhSPyAyJSe0B4t+hFVUlEr0bwIOo4AKxQJfbU3MDfQ8=",
        "animation": "bafybeif6p4jtickpn2eogd4qgygn24j7fb5dktptwdvdzhwwtplxfd3lb4",
        "md":"bafybeicflbrbnyqvjjqcl4id7irkc322r42job6vntjcaapi4aam75s6yu",
        "sounds":"Jonny From Space",
        "unit":"240-2"
    },
    {
        "file": "Nick-Leon - A Bailar ft. C-240 by Yucef Merhi",
        "img": "bafybeiarxp4l6jjd3ogitl5jf3wwgopuad42mhirmwceht6ec4qwvae45u",
        "integ":"/rDsfJnJKfREvnwEycLteGzcCLGz5VcWIjrMwaQBhM4=",
        "animation": "bafybeigpaj64hpjgsz46gfykpazqnobaiqrbpbqjmld5wz35bny4exlwfy",
        "md":"bafybeihbjhnwk57oymowqrazdcvfft6amjsfbmvsmhma5taz72gb36w4na",
        "sounds":"Nick León",
        "unit":"240-3"
    }
]


total = 88 
asset_name = "CCxC-240"
description = "Dequency Presents: Crypto Cabana x C-240"


def mint(minter, cfg):
    metadata = {
        "name": asset_name,
        "description": description,
        "image": "ipfs://{}".format(cfg['img']),
        "decimals": 0,
        "supply": total,
        "unit_name": cfg['unit'],
        "image_integrity": "sha256-{}".format(cfg['integ']),
        "image_mimetype": "image/jpg",
        "animation_url":"ipfs://{}".format(cfg['animation']),
        "animation_mimetype":"video/mp4",
        "properties": {
            "visuals": "C-240 by Yucef Merhi" ,
            "sounds":cfg["sounds"]
        },
    }

    md = json.dumps(metadata) 
    with open("md-{}.json".format(cfg['unit']), "w") as f:
        f.write(md)

    mdhash = hashlib.sha256(md.encode('utf-8')).digest()

    sp = client.suggested_params()
    return AssetConfigTxn(
        minter,
        sp,
        total=total,
        unit_name=cfg['unit'],
        asset_name=asset_name,
        manager=minter,
        url="ipfs://{}".format(cfg['md']),
        metadata_hash=mdhash,
        strict_empty_address_check=False,
    )

if __name__ == "__main__":

    from deploy import get_accounts 

    accts = get_accounts()
    (minter, sk) = accts[0]

    acfgs = []
    for c in configs:
        acfgs.append(mint(minter, c))


    stxns = [a.sign(sk) for a in transaction.assign_group_id(acfgs)]

    client.send_transactions(stxns)