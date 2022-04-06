from algosdk import *
from algosdk.future.transaction import *
from algosdk.v2client import algod

token = "a" * 64
host = "http://localhost:4001"
client = algod.AlgodClient(token, host)

configs = [
    {
        "file": "Boiish ft. C-240 by Yucef2",
        "img": "bafybeibdtybsjf22k6nzw4cezyqycxzgt2uyviqnavm4ytzhbecbhrm2jm",
        "integ":"GbQerxFPAqPBdxlR3XDL8P51WOB+TDM5nBEZEl4Oivw=",
        "animation": "bafybeigmc3jau5vwvbeipib5vwdsj5ofgatxtcfek6kukopyzs45gjseme",
    },
    {
        "file": "Jonny From Space ft. C-240 by Yucef",
        "img": "bafybeig2525pjxnxnq2j66x6phjrqtedmbkhy5bhemzqi223rnboixgfba",
        "integ":"NhSPyAyJSe0B4t+hFVUlEr0bwIOo4AKxQJfbU3MDfQ8=",
        "animation": "bafybeif6p4jtickpn2eogd4qgygn24j7fb5dktptwdvdzhwwtplxfd3lb4",
    },
    {
        "file": "Nick-Leon ft. C-240 by Yucef",
        "img": "bafybeiarxp4l6jjd3ogitl5jf3wwgopuad42mhirmwceht6ec4qwvae45u",
        "integ":"/rDsfJnJKfREvnwEycLteGzcCLGz5VcWIjrMwaQBhM4=",
        "animation": "bafybeigpaj64hpjgsz46gfykpazqnobaiqrbpbqjmld5wz35bny4exlwfy",
    }
]


total = 42
asset_name = ""
unit_name = ""
description = ""


def mint(cfg):
    (sk, pk) = account.generate_account()

    to_upload = {
        "name": asset_name,
        "description": description,
        "image": "ipfs://{}".format(cfg['img']),
        "decimals": 0,
        "unitName": unit_name,
        "image_integrity": "sha256-{}".format(cfg['integ']),
        "image_mimetype": "image/jpg",
        "animation_url":"ipfs://{}".format(cfg['animation']),
        "animation_mimetype":"video/mp4",
        "properties": {

        },
    }

    mdhash = ""
    url = ""
    print(to_upload)

    sp = client.suggested_params()
    acfgtxn = AssetConfigTxn(
        pk,
        sp,
        total=total,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=pk,
        url=url,
        metadata_hash=mdhash,
        strict_empty_address_check=False,
    )

    pass


if __name__ == "__main__":
    for c in configs:
        mint(c)
