import { Box, Button, Stack, Typography, styled } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Timeline from './Timeline';
import { downloadFile, stringToColor } from './utils';

const Video = styled('video')({
  width: '100%',
  height: 'auto',
});

const mockUrl = 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4';
const videoTime = 30;

function createClip(range: [number, number], color = '', isHidden = false): Clip {
  return {
    range,
    isHidden,
    color: color || stringToColor(Math.random().toString()),
  };
}

const Editor: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [clips, setClips] = useState<Clip[]>([createClip([0, videoTime], 'gray')]);
  const [isLoading, setLoading] = useState(false);

  const url = mockUrl;

  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currClip = clips.find(({ range }) => {
        if (!videoElRef.current) return null;
        const [start, end] = range;
        const videoCurrentTime = videoElRef.current.currentTime;
        return videoCurrentTime > start && videoCurrentTime < end;
      });

      if (videoElRef.current) {
        if (currClip?.isHidden) {
          const nextVisibleClip = clips.find(({ range, isHidden }) => {
            if (!videoElRef.current) return null;
            const [start] = range;
            return !isHidden && videoElRef.current.currentTime < start;
          });
          if (nextVisibleClip) {
            videoElRef.current.currentTime = nextVisibleClip.range[0];
          } else {
            togglePlay();
            videoElRef.current.currentTime = 0;
          }
        }
        setCurrentTime(videoElRef.current.currentTime);
      }
    }, 33);
    return () => {
      clearInterval(interval);
    };
  }, [clips]);

  const togglePlay = () => {
    if (videoElRef.current) {
      if (videoElRef.current.paused) {
        videoElRef.current.play();
        setIsPlaying(true);
      } else {
        videoElRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  function handleSplitClick() {
    if (!currentTime) return;
    const clipsCopy = [...clips];
    const currClipIndex = clips.findIndex(({ range }) => {
      const [start, end] = range;
      return currentTime > start && currentTime < end;
    });

    if (currClipIndex !== -1) {
      const currClip = clipsCopy[currClipIndex];
      const newClip = createClip([currentTime, currClip.range[1]]);
      currClip.range[1] = currentTime;
      clipsCopy.splice(currClipIndex, 1, currClip, newClip);
      setClips(clipsCopy);
    }
  }

  function handleHideClip(idx: number) {
    const clipsCopy = [...clips];

    const newClip = {
      ...clips[idx],
      isHidden: !clips[idx].isHidden,
    };
    clipsCopy[idx] = newClip;
    setClips(clipsCopy);
  }

  useEffect(() => {
    window.electron?.ipcRenderer.on('transcode-video-complete', (_, { binary }) => {
      setLoading(false);
      downloadFile(binary, 'output.mp4', 'video/mp4');
    });
  }, []);

  async function handleExportClick() {
    if (!clips.some(({ isHidden }) => isHidden)) {
      return downloadFile(url, 'output.mp4', 'video/mp4');
    }

    setLoading(true);
    window.electron?.ipcRenderer.send('transcode-video', {
      url,
      clips: clips.filter(({ isHidden }) => !isHidden),
    });
  }

  return (
    <Box my={4}>
      <Stack spacing={5}>
        <Typography variant="h3">Gling video editor</Typography>
        <Stack spacing={2}>
          <Video preload="auto" ref={videoElRef} src={url} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={togglePlay}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="contained" onClick={handleSplitClick}>
              Split
            </Button>
            <Button variant="contained" onClick={handleExportClick}>
              {isLoading ? 'Loading...' : 'Export'}
            </Button>
          </Stack>
          <div>
            <Timeline
              onToggleVisibilityClick={handleHideClip}
              currentTime={currentTime}
              duration={videoTime}
              parts={clips}
              onTimelineChange={(value) => {
                if (videoElRef.current) {
                  videoElRef.current.currentTime = value;
                }
              }}
            />
          </div>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Editor;
