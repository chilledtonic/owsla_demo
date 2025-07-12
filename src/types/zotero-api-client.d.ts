declare module 'zotero-api-client' {
  interface ZoteroApiOptions {
    authorization?: string
  }

  interface ZoteroItem {
    key: string
    version: number
    data: {
      itemType: string
      title: string
      creators?: Array<{
        firstName?: string
        lastName?: string
        name?: string
        creatorType: string
      }>
      date?: string
      publisher?: string
      ISBN?: string
      DOI?: string
      abstractNote?: string
      tags?: Array<{ tag: string }>
      collections?: string[]
      [key: string]: any
    }
  }

  interface ZoteroApiResponse {
    getData(): ZoteroItem[]
  }

  interface ZoteroKeyResponse {
    getData(): {
      userID: number
      username: string
      access: any
    }
  }

  interface ZoteroApi {
    library(type: 'user', id: string | number): {
      items(): {
        get(options?: any): Promise<ZoteroApiResponse>
      }
    }
    verifyKeyAccess(): {
      get(): Promise<ZoteroKeyResponse>
    }
  }

  function api(keyOrOptions?: string | ZoteroApiOptions): ZoteroApi
  export = api
} 