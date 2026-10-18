PREVIEW CLIPS (optional)
Put a short, silent clip here for any video and the site plays it automatically
(hero banner, and on hover on desktop). Name it after the video's id in catalogue.js:

  previews/outreach-trailer.mp4

Videos without a clip simply keep their thumbnail.

IDs: first-animation, happy-sunday, the-cards, first-time-in-mavuno-church,
aurora-feed-structure, outreach-trailer, war-short-version, war, hello-class,
vision-plus, erin-and-aurora, code-society, emotional-wellness, kisumu-mini-qati

Tips: 5-8 seconds, no audio, about 640px wide, under 1 MB, MP4 (H.264).
Computer (ffmpeg):
  ffmpeg -ss 5 -t 6 -i input.mp4 -an -vf scale=640:-2 -c:v libx264 -crf 28 -movflags +faststart previews/ID.mp4
Phone: export a 6-second muted clip from your video editor at low resolution.
