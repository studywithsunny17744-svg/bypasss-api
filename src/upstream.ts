import axios from 'axios';
import { config } from './config';

export async function sendUpstreamRequest(
  method: 'GET' | 'POST',
  pathSuffix: string,
  payload?: any
): Promise<{ status: number; data: any }> {
  const isPhpApi = config.baseUrl.includes('api_user.php');
  let url = config.baseUrl;
  const masterKey = config.masterApiKey;
  
  let finalPayload = payload;

  if (isPhpApi) {
    let suffix = pathSuffix;
    if (!suffix.includes('key=')) {
      suffix += `${suffix.includes('?') ? '&' : '?'}key=${encodeURIComponent(masterKey)}&api_key=${encodeURIComponent(masterKey)}`;
    }
    
    // Ensure all payload params are also attached as query parameters for PHP $_GET / $_REQUEST compatibility
    if (payload && typeof payload === 'object') {
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && v !== null && !suffix.includes(`${k}=`)) {
          suffix += `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
        }
      }

      finalPayload = {
        ...payload,
        key: payload.key || masterKey,
        api_key: payload.api_key || masterKey
      };
    }

    url = `${config.baseUrl}${suffix}`;
  } else {
    // REST API formatting
    const cleanedSuffix = pathSuffix.replace('?action=', '/api/v1/uids/');
    url = `${config.baseUrl}${cleanedSuffix}`;
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'X-AUTH-KEY': masterKey,
    'X-API-KEY': masterKey,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: finalPayload,
      timeout: 15000
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(`Upstream error targeting ${url}:`, error.message);
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: `Connection to registry failed: ${error.message}` } };
  }
}

export function isUpstreamSuccess(upstream: { status: number; data: any }): boolean {
  if (!upstream || !upstream.data) return false;

  const data = upstream.data;

  // If response is raw string (HTML/Text)
  if (typeof data === 'string') {
    const lower = data.toLowerCase();
    if (lower.includes('success') || lower.includes('whitelisted') || lower.includes('added') || lower.includes('true')) {
      return true;
    }
    if (lower.includes('error') || lower.includes('fail') || lower.includes('invalid')) {
      return false;
    }
  }

  // If response is Object
  if (typeof data === 'object') {
    if (
      data.success === true ||
      data.status === 'success' ||
      data.status === 'ok' ||
      data.status === 200 ||
      data.code === 200 ||
      data.result === 'success' ||
      data.result === true
    ) {
      return true;
    }

    if (
      data.success === false ||
      data.status === 'error' ||
      data.status === 'failed' ||
      (typeof data.error === 'string' && data.error.trim().length > 0 && data.error.toLowerCase() !== 'none' && data.error !== 'false' && data.error !== '0')
    ) {
      return false;
    }
  }

  return upstream.status >= 200 && upstream.status < 300;
}
