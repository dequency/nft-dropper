import { getMetaFromIpfs, getMimeTypeFromIpfs } from './ipfs'
import { sha256 } from 'js-sha256'
import { Metadata } from './metadata'
import {config, getToken} from  './algorand'
// import { CIDVersion } from 'multiformats'

/*

The following is a class and metadata type to support the ARC-0003 standard
set forth by the Algorand Foundation and Community

https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md

*/

export const ARC3_NAME_SUFFIX = '@arc3'
export const ARC3_URL_SUFFIX = '#arc3'
export const METADATA_FILE = 'metadata.json'
export const JSON_TYPE = 'application/json'

export function asaURL (cid: string): string { return ipfsURL(cid) + ARC3_URL_SUFFIX }

export function ipfsURL (cid: string): string { return 'ipfs://' + cid }

export function fileURL (cid: string, name: string): string { return config.ipfsGateway + cid + '/' + name }

export function resolveProtocol (url: string): string {

    if (url.endsWith(ARC3_URL_SUFFIX))
        url = url.slice(0, url.length - ARC3_URL_SUFFIX.length)

    let chunks = url.split('://')

    // No protocol specified, give up
    if (chunks.length < 2) return url

    //Switch on the protocol
    switch (chunks[0]) {
        case 'ipfs': //Its ipfs, use the configured gateway
            return config.ipfsGateway + chunks[1]
        case 'https': //Its already http, just return it
            return url
        // TODO: Future options may include arweave or algorand
    }

    return url
}

export async function mediaIntegrity (file: File): Promise<string> {
    const buff = await file.arrayBuffer()
    const bytes = new Uint8Array(buff)
    const hash = new Uint8Array(sha256.digest(bytes))
    return 'sha256-' + Buffer.from(hash).toString('base64')
}

export class Token {
    id: number

    name: string
    unitName: string
    url: string

    metadataHash: string

    total: number
    decimals: number

    creator: string

    manager: string
    reserve: string
    clawback: string
    freeze: string

    defaultFrozen: boolean

    constructor (t: any) {
        this.id = t.id || 0
        this.name = t.name || ''
        this.unitName = t.unitName || ''
        this.url = t.url || ''

        this.metadataHash = t.metadataHash || ''

        this.total = t.total || 0
        this.decimals = t.decimals || 0

        this.creator = t.creator || ''

        this.manager = t.manager || ''
        this.reserve = t.reserve || ''
        this.clawback = t.clawback || ''
        this.freeze = t.freeze || ''

        this.defaultFrozen = t.defaultFrozen || false
    }

    static fromParams (t: any): Token {
        const p = t.params
        return new Token({
            id: t.index,
            name: p.name || '',
            unitName: p['unit-name'] || '',
            url: p.url || '',
            metadataHash: p['metadata-hash'] || '',
            total: p.total || 0,
            decimals: p.decimals || 0,
            creator: p.creator || '',
            manager: p.manager || '',
            reserve: p.reserve || '',
            clawback: p.clawback || '',
            freeze: p.freeze || '',
            defaultFrozen: p['default-frozen'] || false,
        }) as Token

    }

    valid (): boolean {
        return this.id > 0 && this.total > 0 && this.url !== ''
    }

}

export class NFT {
    token: Token | undefined = new Token({})
    metadata: Metadata = new Metadata()

    urlMimeType: string | undefined = undefined

    constructor (md: Metadata, token?: Token, urlMimeType?: string) {
        this.metadata = md
        this.token = token
        this.urlMimeType = urlMimeType
    }

    static async fromAssetId (assetId: number): Promise<NFT> {
        return NFT.fromToken(await getToken(assetId))
    }

    static async fromToken (t: any): Promise<NFT> {
        const token = Token.fromParams(t)
        const url = resolveProtocol(token.url)

        //TODO: provide getters for other storage options
        // arweave? note field?

        try {
            const urlMimeType = await getMimeTypeFromIpfs(url)

            switch (urlMimeType) {
                case JSON_TYPE:
                    return new NFT(await getMetaFromIpfs(url), token, urlMimeType)
            }

            return new NFT(Metadata.fromToken(token), token, urlMimeType)
        } catch (error) {
            return new NFT(new Metadata(), token)
        }
    }

    valid (): boolean {
        return this.token !== undefined && this.token.valid() && this.metadata.valid()
    }

    name (): string {
        if (this.metadata.valid()) {
            return this.metadata.name
        }
        if (this.token !== undefined && this.token.valid()) {
            return this.token.name
        }
        return ''
    }

    id (): number {
        return this.token !== undefined && this.token.valid() ? this.token.id : 0
    }

    mediaURL (small: boolean): string {
        if (!this.valid()) return 'https://dummyimage.com/640x360/fff/aaa'

        // Try to resolve the protocol, if one is set
        const url = resolveProtocol(this.metadata.mediaURL(small))

        // If the url is different, we resolved it correctly
        if (url !== this.metadata.mediaURL(small)) return url

        // It may be a relative url stored within the same directory as the metadata file
        // Lop off the METADATA_FILE bit and append image path
        if (this.token === undefined) return url

        if (this.token.url.endsWith(METADATA_FILE)) {
            const dir = this.token.url.substring(0, this.token.url.length - METADATA_FILE.length)
            return resolveProtocol(dir) + this.metadata.mediaURL(small)
        }

        // give up
        return url
    }
}
