import {Metadata} from './metadata'

export async function getMimeTypeFromIpfs(url: string): Promise<string> {
    const req = new Request(url, { method:"HEAD" })
    const resp = await fetch(req)
    const ctype = resp.headers.get("Content-Type")
    return ctype?ctype:""
}

export async function getMetaFromIpfs(url: string): Promise<Metadata> {
    const req = new Request(url)
    const resp = await fetch(req)
    const body = await resp.blob()
    const text = await body.text()
    const parsed = JSON.parse(text)
    return new Metadata({"_raw":text, ...parsed}) 
}