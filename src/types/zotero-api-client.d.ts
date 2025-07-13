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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      access: any
    }
  }

  interface ZoteroApi {
    library(type: 'user', id: string | number): {
      items(): {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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