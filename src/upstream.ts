import axios from 'axios';
import { config } from './config';

export async function sendUpstreamRequest(
  method: 'GET' | 'POST',
  pathSuffix: string,
  payload?: any
): Promise<{ status: number; data: any }> {
  const isPhpApi = config.baseUrl.includes('api_user.php');
  let url = config.baseUrl;
  
  if (isPhpApi) {
    url = `${config.baseUrl}${pathSuffix}`;
  } else {
    // REST API formatting
    const cleanedSuffix = pathSuffix.replace('?action=', '/api/v1/uids/');
    url = `${config.baseUrl}${cleanedSuffix}`;
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'X-AUTH-KEY': config.masterApiKey,
    'X-API-KEY': config.masterApiKey,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: payload,
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
  if (
    upstream.data.success === false ||
    upstream.data.status === 'error' ||
    upstream.data.status === 'failed' ||
    upstream.data.error
  ) {
    return false;
  }
  return (
    upstream.data.success === true ||
    upstream.data.status === 'success' ||
    upstream.status === 200
  );
}
