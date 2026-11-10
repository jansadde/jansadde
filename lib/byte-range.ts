/** A single HTTP byte range, used for private and public MP4 playback. */
export function byteRange(header: string, size: number): {offset:number;length:number} | null {
  const match=/^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if(!match||(!match[1]&&!match[2])||size<=0)return null;
  if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return null;const length=Math.min(suffix,size);return {offset:size-length,length};}
  const offset=Number(match[1]),end=match[2]?Math.min(Number(match[2]),size-1):size-1;
  if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(end)||offset>=size||end<offset)return null;
  return {offset,length:end-offset+1};
}
