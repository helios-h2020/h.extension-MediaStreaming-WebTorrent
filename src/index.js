import Hls from 'hls.js'
import P2PGraph from 'p2p-graph'
import {Events} from 'p2p-media-loader-core'
import {Engine, initHlsJsPlayer} from 'p2p-media-loader-hlsjs'
import unifyConfig from 'unify-config'

const {PeerClose, PeerConnect} = Events


const {host, hostname, origin, pathname, protocol} = window.location;

const config = unifyConfig({env: {
  trackers: [`${protocol==='http:'?'ws':'wss'}://${host}`],
  stuns: [
    "stun:stun.l.google.com:19302",
    "stun:global.stun.twilio.com:3478?transport=udp",
    `stun:${hostname}:3478`
  ],
  hls: `${origin}${pathname}hls/0.m3u8`
  // hls: "https://wowza.peer5.com/live/smil:bbb_abr.smil/playlist.m3u8"
}})


function createIceServer(urls)
{
  return {urls}
}


window.addEventListener('DOMContentLoaded', function()
{
  if (!(Engine.isSupported() && Hls.isSupported()))
    return document.write("Not supported :(");


  const trackers = document.getElementById('trackers')
  const stuns = document.getElementById('stuns')
  const hlsUrl = document.getElementById('hls')
  const playBtn = document.getElementById('play')
  const stopBtn = document.getElementById('stop')

  trackers.value = config.trackers.join('\n')
  stuns.value = config.stuns.join('\n')
  hlsUrl.value = config.hls


  let engine
  let graph
  let hls


  function fieldsDisabled(value)
  {
    trackers.disabled = value
    stuns.disabled = value
    hlsUrl.disabled = value
    playBtn.disabled = value
  }


  //
  // Video player
  //

  function play()
  {
    fieldsDisabled(true)
    stopBtn.disabled = false

    engine = new Engine({
      loader: {
        trackerAnnounce: trackers.value.split('\n'),
        rtcConfig: {
          iceServers: stuns.value.split('\n').map(createIceServer)
        }
      }
    });

    hls = new Hls({
      liveSyncDurationCount: 7,
      loader: engine.createLoaderClass()
    });

    initHlsJsPlayer(hls);

    hls.loadSource(hlsUrl.value);

    const video = document.getElementById("video");
    hls.attachMedia(video);


    //
    // Graph
    //

    graph = new P2PGraph("#graph");

    graph.add({ id: "me", me: true, name: "You" });

    function onPeerConnect({id, remoteAddress: name = 'Unknown'}) {
      if (graph.hasPeer(id)) return

      graph.add({id, name});
      graph.connect("me", id);
    }

    function onPeerClose(id) {
      if (!graph.hasPeer(id)) return

      graph.disconnect("me", id);
      graph.remove(id);
    }

    engine.on(PeerConnect, onPeerConnect);
    engine.on(PeerClose, onPeerClose);
  }

  function stop()
  {
    graph.destroy()
    hls.destroy()
    engine.destroy()

    stopBtn.disabled = true
    fieldsDisabled(false)
  }


  fieldsDisabled(false)

  playBtn.addEventListener('click', play)
  stopBtn.addEventListener('click', stop)

  if(config.autoplay) play()
})
