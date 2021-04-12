[![Docker Image CI](https://github.com/helios-h2020/h.extension-MediaStreaming-WebTorrent/actions/workflows/docker-image.yml/badge.svg)](https://github.com/helios-h2020/h.extension-MediaStreaming-WebTorrent/actions/workflows/docker-image.yml)

# P2P mediastream

Showcase of P2P HLS streaming using WebTorrent

This project is a Proof-of-Concept about how to distribute HLS streams in a P2P
way using WebTorrent. This **is not** a replacement of using a HLS stream
server, but instead complements them to reduce server costs by offloading server
bandwidth usage to the peers.

## Why to use this

[HTTP Live Streaming](https://developer.apple.com/streaming/) is based on the
HLS clients doing plain `GET` HTTP requests of stream fragments. These ones
doesn't change over time, so it's possible to use "fragment" files on a CDN or a
static web server instead of a regular one and reduce costs. But also in that
case, all requests will go to them and there will be network costs. By taking a
P2P aproach, it's possible to serve these fragment files the same way any P2P
filesharing application would do, reducing network costs by fetching them from
other users that have already got them. In this case, the P2P protocol being
used is [BitTorrent](https://www.bittorrent.com/), and more specifically the
[WebTorrent](https://webtorrent.io/) implementation, that allow to use it in web
browsers.

## Architecture

![](https://raw.githubusercontent.com/Novage/p2p-media-loader/gh-pages/images/p2p-media-loader-network.png)

This proof-of-concept has five diferenciated components:

- **test card generator**: a script that generates a HLS stream using
  [ffmpeg](https://www.ffmpeg.org/), and it's used as stream source only for
  testing and demoing purposses. It store the HLS stream fragment filess in the
  `hls/` folder and automatically deletes the old ones.
- **static HTTP server**: used to serve both the webpage content and the HLS
  stream fragments.
- **WebTorrent tracker**: used to interconnect the WebTorrent clients, and due
  to that, internally it's also working as WebRTC signaling server too. By
  default it use the tracker from [OpenWebTorrent](https://openwebtorrent.com/),
  but here we are using instead a instance of
  [wt-tracker](https://github.com/piranna/wt-tracker). I've modified it to also
  work as [static HTTP server](https://github.com/Novage/wt-tracker/issues/28)
  so it can serve too the WebTorrent client code and work as HLS streams server.
- **STUN servers**: used to find clients public IPs, by default using the Google
  public servers, but here I'm using my own ones. There's no need of using TURN
  servers since in case a direct WebRTC connection is not possible, using a TURN
  server would only add delays and extra costs compared to using a standard HLS
  streaming, so instead clients are going to fetch fragment files directly from
  the HLS stream server automatically as fallback.
- **WebTorrent client**: powered by
  [P2P Media Loader](https://github.com/Novage/p2p-media-loader), it manages
  both the fetch and processing of the HLS stream from the P2P network, being
  fully automated. It supports working with both
  [hls.js](https://github.com/video-dev/hls.js) library (only HLS) and
  [Shaka Player](https://github.com/google/shaka-player) (both HLS and DASH),
  and their derivatives, although this proof-of-concept is making use only of
  the first one.

## How it works

For testing purposses, stream is just a video test card, being the .

P2P Media Loader starts downloading the stream fragments from the HLS stream,
that's using a HTTP server or a CDN. At the same time, it connects to the
WebTorrent tracker using WebSockets to exchange the WebRTC SDPs to create
connections with the other peers, and start using the BitTorrent protocol to
find other peers and ask for missing stream fragments. In case a P2P connection
can't be stablished, or no one has the missing fragments, they will still be
fetch using regular HLS instead.

When the playing of the HLS stream starts, it first pick the stream fragments
from the HTTP server or CDN, and at the same time, it ask in advance for other
stream fragments to other peers in the WebTorrent network. P2P management is
fully done on client side, so it's transparent to use any other HLS stream as
source.

## How to use

`wt-tracker` needs to be configured first, so add next content to a new
`config.json` file at project root:

```json
{
  "servers": [{
      "server": {
        "port": 49199,
        "host": "0.0.0.0"
      },
      "websockets": {
        "path": "/*",
        "maxPayloadLength": 65536,
        "idleTimeout": 240,
        "compression": 1,
        "maxConnections": 0
      }
    }
  ],

  "tracker": {
    "maxOffers": 20,
    "announceInterval": 120
  }
}
```

For more configuration details and customization, take a look on
[wt-tracker configuration](https://github.com/Novage/wt-tracker#configuration).

After installing, `npm start` will start the `wt-tracker` instance and serve the
client. To run instead the *test card generator* and a development build of the
client, just exec `npm run dev` instead. In addition to that, a couple of
`systemd` service files are included, one for the `wt-tracker` and another for
the test card generator. Just enable them and you are go.

## Notes

The `<video>` tag of this PoC has both the `autoplay` and `muted` attributes
since starting Chrome 66 videos with sound are prevented to autoplay by default.
You can find more info at https://stackoverflow.com/a/49822987/586382 and
https://developers.google.com/web/updates/2017/09/autoplay-policy-changes.

Video test card is using
[lavfi](https://www.bogotobogo.com/FFMpeg/ffmpeg_video_test_patterns_src.php),
the *Libavfilter* input virtual device. More specifically, it's using the
`testsrc` filter. To create a 10 seconds 1280x720px video at 30fps, just only
exec:

```sh
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 testsrc.mpg
```
