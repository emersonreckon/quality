
// Type definitions for Google APIs
declare namespace gapi {
  function load(library: string, callback: () => void): void;
  
  namespace client {
    function init(config: {
      discoveryDocs: string[];
      [key: string]: any;
    }): Promise<void>;
    
    namespace drive {
      namespace files {
        function create(params: {
          resource: any;
          fields?: string;
          [key: string]: any;
        }): Promise<{
          result: {
            id: string;
            [key: string]: any;
          };
        }>;
        
        function get(params: {
          fileId: string;
          fields?: string;
          [key: string]: any;
        }): Promise<{
          result: {
            webViewLink: string;
            [key: string]: any;
          };
        }>;
      }
    }
  }
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        error?: string;
        [key: string]: any;
      }
      
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken: (options?: { prompt?: string; [key: string]: any; }) => void;
      }
      
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        [key: string]: any;
      }): TokenClient;
    }
  }
}
