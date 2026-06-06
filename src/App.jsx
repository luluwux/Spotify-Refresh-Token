import React, { useState, useEffect, useRef } from 'react';
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

  // get code and scopes from url query params
  const [searchParams, setSearchParams] = useSearchParams();

  const code = searchParams.get('code');
  const scopes = searchParams.getAll('scope');

  /**
   * Set one or more scopes as URL search params in the format `scope=<name>`
   *
   * @param {string[]} newScopes
   */
  const setScopes = (...newScopes) => {
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
  };

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
          });
      }
    }
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
    <div className="flex h-screen text-white m-5">
      <div className="m-auto md:w-2/3 max-w-[1024px] grid grid-cols-1 gap-3">
        <div className="flex-1 text-4xl bg-neutral-900 rounded-xl p-5 text-center font-semibold border-t border-neutral-500/10">
          Get Your Spotify Refresh Token!
        </div>

        {accessToken.length > 0 && (
          <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Access Token (lasts 1 hour)</div>
            <input type="text" readOnly value={accessToken} className="w-3/4 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={accessToken}>
                <div className="cursor-pointer bg-slate-600 w-3/4 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        {refreshToken.length > 0 && (
          <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Refresh Token</div>
            <input type="text" readOnly value={refreshToken} className="w-3/4 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={refreshToken}>
                <div className="cursor-pointer bg-slate-600 w-3/4 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        {outputs.filled && (
          <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Example Output</div>
            <textarea className="w-3/4 text-sm text-black m-2 p-1 h-64" readOnly value={JSON.stringify(outputs.data, null, 2)} />
          </div>
        )}
        {refreshToken.length === 0 && ( // only show the reminder if the user hasn't gotten the refresh token yet
          <div className="grid md:grid-cols-2 grid-cols-1 gap-2 ">
            <a href="https://developer.spotify.com/dashboard/applications" target="_blank" rel="noreferrer" className="flex-1 bg-neutral-900 rounded-xl p-5 text-center hover:bg-neutral-800">
              <div className="text-2xl underline">Click here to go to the developer dashboard</div>
            </a>
            <CopyToClipboard text={callbackUri}>
              <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center cursor-pointer hover:bg-neutral-800">
                Remember to add
              <span>   {` ${callbackUri} `} </span>
                as a redirect uri in your app. Click this box to copy it to your clipboard.
              </div>
            </CopyToClipboard>
          </div>
        )}

        <div className="bg-neutral-900 rounded-xl p-5 text-center grid grid-cols-1 gap-3 border-t border-neutral-500/10">
          
          {/* Auth Method Selector */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-800 p-2 rounded-xl">
            <button
              type="button"
              className={`p-3 rounded-lg font-semibold duration-150 ${authMethod === 'pkce' ? 'bg-[#1DB954] text-black font-bold' : 'bg-neutral-700 hover:bg-neutral-600 text-white'}`}
              onClick={() => setAuthMethod('pkce')}
            >
              🔐 PKCE Flow (Güvenli)
            </button>
            <button
              type="button"
              className={`p-3 rounded-lg font-semibold duration-150 ${authMethod === 'standard' ? 'bg-neutral-600 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'}`}
              onClick={() => setAuthMethod('standard')}
            >
              🔑 Standart Flow
            </button>
          </div>

          <div className={`grid gap-2 ${authMethod === 'pkce' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <InputBox label="Client ID" value={clientId} onChange={setClientId} />
            {authMethod === 'standard' && (
              <InputBox label="Client Secret" value={clientSecret} onChange={setClientSecret} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <Checkbox checked={saveClientCredentials} onClick={() => setSaveClientCredentials(!saveClientCredentials)} label="Save Client ID" />
            <Checkbox checked={saveRefreshToken} onClick={() => setSaveRefreshToken(!saveRefreshToken)} label="Save Refresh Token" />
          </div>

          <div className="text-3xl font-semibold m-3">
            Scope
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {allScopes.map((s) => (
              <Checkbox checked={hasScope(s) || allSelected} onClick={() => handleCheck(s)} label={s} key={s} />
            ))}
          </div>

          <Checkbox checked={allSelected} onClick={handleSelectAll} label="Select all" />


        </div>

        <button type="submit" className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl font bold duration-150 font-semibold border-t border-neutral-500/10" onClick={handleSubmit}>
          Submit
        </button>



        {/* Footer  */}
        <footer className="text-center h-16 max-w-7xl mx-auto w-full border-t flex sm:flex-row flex-col justify-between items-center px-3 mb-3 border-neutral-500/10 rounded-xl bg-neutral-900">
          <div className="text-neutral-500">
            © 2022-2023 All Rights Reserved {" "}
          </div>
          <div className="flex space-x-4 pb-4 sm:pb-0 text-neutral-500">
            <h2>
              Developed with 💜 by
              <a className="px-1 text-[#a967ff] " href={`https://github.com/`} target="_blank">
              Lulu
              </a>
            </h2>
          </div>
        </footer>


      </div>
    </div>
  );
};

export default App;