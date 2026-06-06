import { useState, useEffect, useRef, useCallback } from 'react';
import QueryString from 'query-string';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSearchParams } from 'react-router-dom';
import Checkbox from './components/CheckBox';
import InputBox from './components/Input';
import { generateCodeVerifier, generateCodeChallenge } from './utils/pkce';

const allScopes = [
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-library-modify',
  'user-library-read',
  'user-read-email',
  'user-read-private',
  'streaming',
];

const allScopesAlias = 'all';

// Get the callback uri to give to spotify
let callbackUri = window.location.href.split('/').slice(0, 4).join('/');

// if the callback uri ends with a slash, remove it
callbackUri = callbackUri.endsWith('/') ? callbackUri.slice(0, callbackUri.length - 1) : callbackUri;

const App = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [authMethod, setAuthMethod] = useState(() => {
    return sessionStorage.getItem('authMethod') || 'pkce';
  });

  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const [saveRefreshToken, setSaveRefreshToken] = useState(false);
  const [saveClientCredentials, setSaveClientCredentials] = useState(false);

  const [outputs, setOutputs] = useState({
    filled: false,
    data: {},
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [copiedAccess, setCopiedAccess] = useState(false);
  const [copiedRefresh, setCopiedRefresh] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  const handleCopyAccess = () => {
    setCopiedAccess(true);
    setTimeout(() => setCopiedAccess(false), 2000);
  };
  const handleCopyRefresh = () => {
    setCopiedRefresh(true);
    setTimeout(() => setCopiedRefresh(false), 2000);
  };
  const handleCopyCallback = () => {
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  // get code and scopes from url query params
  const [searchParams, setSearchParams] = useSearchParams();

  const code = searchParams.get('code');
  const scopes = searchParams.getAll('scope');

  /**
   * Set one or more scopes as URL search params in the format `scope=<name>`
   *
   * @param {string[]} newScopes
   */
  const setScopes = useCallback((...newScopes) => {
    if (newScopes.length && allScopes.every((s) => newScopes.includes(s))) {
      setSearchParams((params) => {
        params.set('scope', allScopesAlias);
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.delete('scope');
        newScopes.forEach((s) => params.append('scope', s));
        return params;
      });
    }
  }, [setSearchParams]);

  /**
   * Check if a scope is present as a URL search param
   *
   * @param {string} scope
   */
  const hasScope = (scope) => scopes.includes(scope);

  // sets the "select all" checkbox to true if all scopes are selected
  const allSelected = hasScope(allScopesAlias);

  /**
   * Gets the access token from the API
   *
   * @returns {Promise<Object>} The response from the API containing the access token
   */
  const getTokens = (method, cId, cSecret, codeVal) => {
    const isPkce = method === 'pkce';
    const postData = isPkce
      ? {
          client_id: cId,
          code: codeVal,
          redirect_uri: callbackUri,
          grant_type: 'authorization_code',
          code_verifier: sessionStorage.getItem('code_verifier'),
        }
      : {
          code: codeVal,
          redirect_uri: callbackUri,
          grant_type: 'authorization_code',
        };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (!isPkce) {
      headers.Authorization = `Basic ${btoa(`${cId}:${cSecret}`)}`;
    }

    return axios.post(
      'https://accounts.spotify.com/api/token',
      QueryString.stringify(postData),
      { headers }
    );
  };

  /**
   * Sets the refresh token if it is in the URL
   * Also gets the local storage values for the client credentials and scope
   */
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('settings'));
    if (storedSettings) {
      setSaveRefreshToken(storedSettings.saveRefreshToken);
      setSaveClientCredentials(storedSettings.saveClientCredentials);
    }

    const clientIdStored = localStorage.getItem('clientId') || sessionStorage.getItem('clientId');
    if (clientIdStored) {
      setClientId(clientIdStored);
    }
    const clientSecretStored = localStorage.getItem('clientSecret') || sessionStorage.getItem('clientSecret');
    if (clientSecretStored) {
      setClientSecret(clientSecretStored);
    }
    const refreshTokenStored = localStorage.getItem('refreshToken');
    if (refreshTokenStored) {
      setRefreshToken(refreshTokenStored);
    }

    const sessionScopes = sessionStorage.getItem('scope');
    if (sessionScopes) {
      setScopes(...JSON.parse(sessionScopes));
    }

    // Selective cleanup of temporary session keys
    sessionStorage.removeItem('clientId');
    sessionStorage.removeItem('clientSecret');
    sessionStorage.removeItem('scope');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Gets the access token if the code and credentials are set
   */
  useEffect(() => {
    if (code?.length > 0 && clientId.length > 0) {
      const isPkce = authMethod === 'pkce';
      const hasSecret = clientSecret.length > 0;

      if (isPkce || hasSecret) {
        getTokens(authMethod, clientId, clientSecret, code)
          .then((response) => {
            setAccessToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
            setSearchParams((params) => {
              params.delete('code');
              return params;
            });
            // Clean up temporary authentication variables
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('authMethod');
          })
          .catch((error) => {
            console.error(error);
            const errDesc = error.response?.data?.error_description || error.response?.data?.error || error.message || 'Token takas işlemi başarısız oldu.';
            setErrorMsg(errDesc);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, clientSecret, code, authMethod]);

  /**
   * Gets the data from the Spotify API if the access token is set
   */
  useEffect(() => {
    if (accessToken.length > 0) {
      axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json: true,
      }).then((response) => {
        setOutputs({
          filled: true,
          data: response.data,
        });
      }).catch((error) => {
        console.error(error);
        const errDesc = error.response?.data?.error_description || error.response?.data?.error || error.message || 'Profil bilgileri alınamadı.';
        setErrorMsg(errDesc);
      });
    }
  }, [accessToken]);

  /**
   * Allows the following "useEffect" to run only on updates
   */
  const isInitialMount = useRef(true);

  /**
   * Sets the settings to save credentials/tokens to local storage
   */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('settings', JSON.stringify({ saveClientCredentials, saveRefreshToken }));
    }
  }, [saveRefreshToken, saveClientCredentials]);

  /**
   * Add or remove the refresh token from local storage
   */
  useEffect(() => {
    if (saveRefreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [saveRefreshToken, refreshToken]);

  /**
   * Add or remove client ID from local storage based on preferences.
   * clientSecret is NEVER stored in localStorage for security reasons.
   */
  useEffect(() => {
    if (saveClientCredentials) {
      localStorage.setItem('clientId', clientId);
    } else {
      localStorage.removeItem('clientId');
    }
  }, [saveClientCredentials, clientId]);

  /**
   * Store clientSecret in sessionStorage for redirect survival.
   * Automatically cleans up legacy clientSecret from localStorage if present.
   */
  useEffect(() => {
    if (clientSecret) {
      sessionStorage.setItem('clientSecret', clientSecret);
    } else {
      sessionStorage.removeItem('clientSecret');
    }
    localStorage.removeItem('clientSecret');
  }, [clientSecret]);

  /**
   * Handles the scope checkbox change
   * @param {string} name
   */
  const handleCheck = (name) => {
    if (hasScope(name)) {
      return setScopes(...scopes.filter((s) => s !== name));
    }

    if (allSelected) {
      return setScopes(...allScopes.filter((s) => s !== name));
    }

    return setScopes(...scopes, name);
  };

  /**
   * handles the "select all" checkbox change
   */
  const handleSelectAll = () => (allSelected ? setScopes() : setScopes(...allScopes));

  /**
   * Handles the submit button click, which will redirect the user to the Spotify login page
   */
  const handleSubmit = async () => {
    setErrorMsg('');
    if (!clientId) {
      setErrorMsg('Lütfen geçerli bir Client ID girin.');
      return;
    }
    if (authMethod === 'standard' && !clientSecret) {
      setErrorMsg('Standart akış için Client Secret girmelisiniz.');
      return;
    }

    sessionStorage.setItem('clientId', clientId);
    sessionStorage.setItem('clientSecret', clientSecret);
    sessionStorage.setItem('authMethod', authMethod);

    const selectedScopes = allSelected ? allScopes : scopes;
    sessionStorage.setItem('scope', JSON.stringify(selectedScopes));

    const scope = selectedScopes.join(' ');
    let queryString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${callbackUri}`;

    if (authMethod === 'pkce') {
      const verifier = generateCodeVerifier();
      sessionStorage.setItem('code_verifier', verifier);
      const challenge = await generateCodeChallenge(verifier);
      queryString += `&code_challenge_method=S256&code_challenge=${challenge}`;
    }

    window.location.replace(queryString);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[900px] flex flex-col gap-6">
        
        {/* Header/Hero Section */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-[#1DB954]/10 rounded-full flex items-center justify-center mb-2 animate-pulse-soft">
            <svg className="w-8 h-8 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.137-.747-.473-.077-.337.137-.67.473-.748 3.854-.88 7.15-.5 9.822 1.137.295.18.387.563.206.86zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.66-1.11 8.225-.567 11.35 1.355.367.226.488.707.26 1.073zm.107-2.836C14.493 8.878 8.82 8.69 5.537 9.686c-.506.153-1.04-.135-1.194-.64-.153-.507.135-1.04.64-1.194 3.76-1.14 10.012-.924 14.07 1.485.456.27.608.86.337 1.317-.27.457-.86.61-1.317.337z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Spotify Refresh Token Alıcı
          </h1>
          <p className="text-sm md:text-base text-neutral-400 max-w-[500px]">
            Hobi projeleriniz ve Discord botlarınız için süresiz Spotify Refresh {"Token'larını"} güvenli ve kolayca elde edin.
          </p>
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3.5 rounded-2xl text-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-200 transition-colors duration-150 pl-2 focus:outline-none">
              ✕
            </button>
          </div>
        )}

        {/* Output section (Access Token, Refresh Token, profile payload) */}
        {accessToken.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-neutral-200">Access Token</div>
              <span className="text-xs text-neutral-500">1 saat geçerlidir</span>
            </div>
            <div className="relative flex items-center bg-neutral-950/50 border border-neutral-800 rounded-xl">
              <input type="text" readOnly value={accessToken} className="bg-transparent w-full text-xs font-mono text-neutral-300 px-4 py-3.5 outline-none pr-24 select-all" />
              <CopyToClipboard text={accessToken} onCopy={handleCopyAccess}>
                <button type="button" className={`absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none ${copiedAccess ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}>
                  {copiedAccess ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </CopyToClipboard>
            </div>
          </div>
        )}

        {refreshToken.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[#1DB954]">Refresh Token</div>
              <span className="text-xs text-neutral-500">Süresiz ve kalıcı anahtarınız</span>
            </div>
            <div className="relative flex items-center bg-neutral-950/50 border border-neutral-800 rounded-xl">
              <input type="text" readOnly value={refreshToken} className="bg-transparent w-full text-xs font-mono text-[#1DB954] px-4 py-3.5 outline-none pr-24 select-all" />
              <CopyToClipboard text={refreshToken} onCopy={handleCopyRefresh}>
                <button type="button" className={`absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none ${copiedRefresh ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}>
                  {copiedRefresh ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </CopyToClipboard>
            </div>
          </div>
        )}

        {outputs.filled && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3">
            <div className="text-lg font-bold text-neutral-200 text-center">Kullanıcı Bilgileri Çıktısı (Örnek)</div>
            <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
              <textarea className="w-full text-xs font-mono bg-transparent text-neutral-400 p-0 outline-none h-48 resize-none scrollbar" readOnly value={JSON.stringify(outputs.data, null, 2)} />
            </div>
          </div>
        )}

        {refreshToken.length === 0 && (
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <a href="https://developer.spotify.com/dashboard/applications" target="_blank" rel="noreferrer" className="glass-panel rounded-2xl p-6 text-center hover:bg-neutral-800/40 flex flex-col items-center justify-center gap-2">
              <div className="text-base font-semibold text-[#1DB954] hover:underline flex items-center gap-1.5">
                {"Spotify Dashboard'a Git ↗"}
              </div>
              <p className="text-xs text-neutral-400">
                Uygulama oluşturmak veya mevcut uygulamalarınızı yönetmek için Spotify Developer portalını açın.
              </p>
            </a>
            <CopyToClipboard text={callbackUri} onCopy={handleCopyCallback}>
              <div className="glass-panel rounded-2xl p-6 text-center cursor-pointer hover:bg-neutral-800/40 flex flex-col items-center justify-center gap-2">
                <div className="text-sm font-semibold text-neutral-300">
                  Yönlendirme URI (Redirect URI):
                </div>
                <code className="bg-neutral-950/80 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#1DB954] border border-neutral-800 select-all">
                  {callbackUri}
                </code>
                <span className="text-[11px] text-neutral-500">
                  {copiedCallback ? '📋 Kopyalandı!' : 'Panoya kopyalamak için tıklayın.'}
                </span>
              </div>
            </CopyToClipboard>
          </div>
        )}

        {/* Input and Configuration section */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-neutral-200 border-b border-neutral-800 pb-3 flex items-center gap-2">
            ⚙️ Yapılandırma ve İzinler
          </h2>
          
          {/* Auth Method Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-neutral-400 pl-1">Yetkilendirme Yöntemi</label>
            <div className="grid grid-cols-2 gap-2 bg-neutral-950/40 p-1 rounded-2xl border border-neutral-800/80">
              <button
                type="button"
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
                  authMethod === 'pkce'
                    ? 'bg-[#1DB954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.2)] font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
                onClick={() => setAuthMethod('pkce')}
              >
                🔐 PKCE Flow (Güvenli)
              </button>
              <button
                type="button"
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
                  authMethod === 'standard'
                    ? 'bg-neutral-850 text-white border border-neutral-700 shadow-lg'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
                onClick={() => setAuthMethod('standard')}
              >
                🔑 Standart Flow
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${authMethod === 'pkce' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <InputBox
              label="Client ID"
              value={clientId}
              placeholder="Spotify Client ID girin"
              onChange={setClientId}
            />
            {authMethod === 'standard' && (
              <InputBox
                label="Client Secret"
                type="password"
                value={clientSecret}
                placeholder="Spotify Client Secret girin"
                onChange={setClientSecret}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950/20 p-4 rounded-2xl border border-neutral-800/50">
            <Checkbox
              checked={saveClientCredentials}
              onClick={() => setSaveClientCredentials(!saveClientCredentials)}
              label="Client ID'yi Kaydet"
            />
            <Checkbox
              checked={saveRefreshToken}
              onClick={() => setSaveRefreshToken(!saveRefreshToken)}
              label="Refresh Tokenı Kaydet"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
              <span className="text-lg font-bold text-neutral-200">İzin Kapsamları (Scopes)</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-[#1DB954] hover:text-[#1ed760] transition-colors focus:outline-none"
              >
                {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2">
              {allScopes.map((s) => (
                <Checkbox
                  checked={hasScope(s) || allSelected}
                  onClick={() => handleCheck(s)}
                  label={s}
                  key={s}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-6 rounded-2xl shadow-[0_4px_20px_rgba(29,185,84,0.15)] hover:shadow-[0_6px_24px_rgba(29,185,84,0.25)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 focus:outline-none"
          onClick={handleSubmit}
        >
          🚀 Spotify ile Giriş Yap & Bağlan
        </button>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-neutral-800/50 flex flex-col sm:flex-row justify-between items-center px-4 rounded-2xl bg-neutral-950/20 text-neutral-500 text-xs gap-3">
          <div>
            © 2022-2026 Tüm Hakları Saklıdır.
          </div>
          <div className="flex items-center gap-1.5">
            Developed with 💜 by
            <a className="text-[#1DB954] hover:text-[#1ed760] font-semibold transition-colors" href="https://github.com/luluwux" target="_blank" rel="noreferrer">
              Lulu
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default App;