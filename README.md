# P2P mediastream

Showcase of P2P HLS streaming using WebTorrent

This project is a Proof-of-Concept about how to distribute a HLS stream in a P2P
way using WebTorrent. In case a P2P connection can't be stablished, stream will
use regular HLS instead.

For testing purposses, stream is just a video test card, being the P2P
management fully on client-side code, it's easy to use any other HLS stream as
source.

## Architecture

![](https://raw.githubusercontent.com/Novage/p2p-media-loader/gh-pages/images/p2p-media-loader-network.png)

Project has five diferenciated components:

- **test card generator**: script that generates the HLS stream using
  [ffmpeg](https://www.ffmpeg.org/). It store the stream fragments in the `hls/`
  folder and automatically deletes the old ones
- **static HTTP server**: used to serve both the webpage content and the HLS
  stream fragments
- **WebTorrent tracker**: used to interconnect the WebTorrent clients, and due
  to that, it's also working internally as WebRTC signaling server too. By
  default it use the tracker from [OpenWebTorrent](https://openwebtorrent.com/),
  but I'm using a instance of [wt-tracker](https://github.com/Novage/wt-tracker)
  instead. I've modified it to also works as
  [static HTTP server](https://github.com/Novage/wt-tracker/issues/28) so it can
  be used to serve the WebTorrent client code and work as HLS streams server.
- **STUN servers**: used to find clients public IPs, by default use Google
  public servers but here I'm using my own ones. There's no need of using TURN
  servers since in case a direct WebRTC connection is not possible, using a TURN
  server would only add delay and extra costs compared to using standard HLS
  streaming, so clients use it directly as fallback instead.
- **WebTorrent client**: powered by
  [P2P Media Loader](https://github.com/Novage/p2p-media-loader), it manages
  both the fetch and processing of the HLS stream from the P2P network, being
  fully automated. It supports working with both
  [hls.js](https://github.com/video-dev/hls.js) library (only HLS) and
  [Shaka Player](https://github.com/google/shaka-player) (both HLS and DASH),
  and their derivatives.

## How it works

P2P Media Loader starts downloading the stream fragments from the HLS stream,
that's using a HTTP server or a CDN. At the same time, it connects to the
WebTorrent tracker using WebSockets to exchange the WebRTC SDPs to create
connections with the other peers, and start using the BitTorrent protocol to
find other peers and ask for missing stream fragments.

When the playing of the HLS stream starts, it first pick the stream fragments
from the HTTP server or CDN, and at the same time, it ask in advance for other
stream fragments to other peers in the WebTorrent network. In case no peer has
them, or it was not possible to connect to other peers (for example, due to
network limitations), fragments are being keep fetched using the HTTP server or
CDN. This **does not** prevent of using a HTTP server or CDN, just only helps to
reduce costs by offloading server bandwidth usage to the peers.

## How to use

`wt-tracker` needs to be configured first, so add next content to a new
`config.json` file:

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

After installing, `npm start` will start both the *test card generator* and the
`wt-tracker` instance. To only run this last one, exec `npm run wt-tracker`
instead.

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
