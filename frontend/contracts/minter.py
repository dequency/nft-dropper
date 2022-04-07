from abc import get_cache_token
from algosdk import *
from algosdk.future.transaction import *
from algosdk.v2client import algod
import hashlib
import json

network = "testnet"

ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "a" * 64

if network == "testnet":
    ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
    ALGOD_TOKEN = ""
elif network == "mainnet":
    ALGOD_ADDRESS = "https://mainnet-api.algonode.cloud"
    ALGOD_TOKEN = ""

client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

configs = [
    {
        "file": "Boiish - Nothin fancy ft. C-240 by Yucef Merhi",
        "img": "bafybeifwznzkdlrqozfhbinlolyuqjc46eohnl5tiucx6xhkjdpnnlwhyy",
        "integ":"GbQerxFPAqPBdxlR3XDL8P51WOB+TDM5nBEZEl4Oivw=",
        "animation": "bafybeihq2gf325d2sjagk3t5zj4at2jdkucgcvxufzuuxrdw244forzme4",
        "md":"bafkreiebpsp7rzfexxek6kn4ifwwy46atf5ujpg5eawtsdulbzpsaecdka",
        "sounds": "Boiish",
        "unit":"C-240-NF",
        "name":"C-240-ft-Nothin_Fancy",
        "desc":"C-240 is an electronic sound artwork developed by digital art pioneer, Yucef Merhi, that translates sounds into colorful geometric patterns. This piece is a generative visual response to the song, Nothin Fancy, made by Boiish."
    },
    {
        "file": "Jonny From Space - Full Glass ft. C-240 by Yucef Merhi",
        "img": "bafybeiennx3b6ft7lvricepsbc4rq5rg7vqpoyha442neu3um5cfanyz5i",
        "integ":"NhSPyAyJSe0B4t+hFVUlEr0bwIOo4AKxQJfbU3MDfQ8=",
        "animation": "bafybeidt7qyretlhbkvhvjekzz4mwdrbmj354dl5l6nohrnzpeqxwbvtti",
        "md":"bafkreihrwdhvstfzxi3zqrxyl6ijgz7uo3sozb6gdcu2jiezzpswu3tosy",
        "sounds":"Jonny From Space",
        "unit":"C-240-FG",
        "name":"C-240-ft-Full_Glass",
        "desc":"C-240 is an electronic sound artwork developed by digital art pioneer, Yucef Merhi, that translates sounds into colorful geometric patterns. This piece is a generative visual response to the song, Full Glass, made by Jonny from Space."
    },
    {
        "file": "Nick-Leon - A Bailar ft. C-240 by Yucef Merhi",
        "img": "bafybeib6wu5myb7gh64my7vzffbpg6m4ueo53x7vrvkr65sl724uxpvuym",
        "integ":"/rDsfJnJKfREvnwEycLteGzcCLGz5VcWIjrMwaQBhM4=",
        "animation": "bafybeibzxuya53egqt54lcepd4arlrddrbvvi7oiew462v4cfap36glqlm",
        "md":"bafkreigrtpoebspuugixc24zonvqmqy2n72msktdn7tuyapd5zo7fzer4i",
        "sounds":"Nick León",
        "unit":"C-240-AB",
        "name":"C-240-ft-A_Bailar",
        "desc":"C-240 is an electronic sound artwork developed by digital art pioneer, Yucef Merhi, that translates sounds into colorful geometric patterns. This piece is a generative visual response to the song,  A Bailar, made by Nick Leon."
    }
]


total = 88 

def mint(minter, cfg):
    metadata = {
        "name": cfg["name"],
        "description": cfg["desc"],
        "image": "ipfs://{}".format(cfg['img']),
        "decimals": 0,
        "supply": total,
        "unit_name": cfg['unit'],
        "image_integrity": "sha256-{}".format(cfg['integ']),
        "image_mimetype": "image/jpg",
        "animation_url":"ipfs://{}".format(cfg['animation']),
        "animation_url_mimetype":"video/mp4",
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
        asset_name=cfg["name"],
        manager=minter,
        url="ipfs://{}".format(cfg['md']),
        metadata_hash=mdhash,
        strict_empty_address_check=False,
    )

if __name__ == "__main__":

    from deploy import get_accounts 

    accts = get_accounts()
    minter = "MIAMI2UTQBFMGLX6PPTC456Q62NCPW5Q7SPVCXNMLKHKFNJWP5CBERUWZQ"

    for (acct, sk) in accts:
        if acct == "MIAMI2UTQBFMGLX6PPTC456Q62NCPW5Q7SPVCXNMLKHKFNJWP5CBERUWZQ":
            print(acct)
            key = sk 

    acfgs = []
    for c in configs:
        acfgs.append(mint(minter, c))


    stxns = [a.sign(key) for a in transaction.assign_group_id(acfgs)]

    txid = client.send_transactions(stxns)