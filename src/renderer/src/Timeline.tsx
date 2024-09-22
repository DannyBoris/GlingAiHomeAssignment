import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';

const Container = styled('div')({
  position: 'relative',
});

const Time = styled('div')({});

const TimelineDiv = styled('div')({
  width: '100%',
  height: '50px',
  backgroundColor: 'lightgray',
  borderRadius: '5px',
});

const TimeIndicator = styled('div')<{ x: number }>((props) => ({
  position: 'absolute',
  top: 0,
  left: props.x,
  width: '2px',
  height: '100%',
  backgroundColor: 'red',
}));

const ClipOverlay = styled('div')<{ x: number; bgColor: string; width: number }>((props) => ({
  position: 'absolute',
  bottom: 0,
  left: props.x,
  width: props.width + 'px',
  height: '50px',
  backgroundColor: props.bgColor,
  opacity: 0.6,
  pointerEvents: 'none',
}));

const ToggleVisibilityButton = styled('button')({
  position: 'absolute',
  bottom: 0,
  transform: 'translate(-50%,125%)',
  left: '50%',
  marginTop: '15px',
  borderRadius: 50,
  border: 'none',
  pointerEvents: 'all',
});

interface Props {
  duration: number;
  currentTime: number;
  onTimelineChange: (time: number) => void;
  parts: Clip[];
  onToggleVisibilityClick: (index: number) => void;
}

const Timeline: React.FC<Props> = ({
  duration,
  currentTime,
  parts,
  onTimelineChange,
  onToggleVisibilityClick,
}) => {
  const [timelineWidth, setTimelineWidth] = useState(0);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mutationObserver = new ResizeObserver(() => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    });
    mutationObserver.observe(timelineRef.current!);
    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  const secondWidth = () => duration / timelineWidth;

  const currentTimeX = currentTime / secondWidth();

  function handleTimelineChange(e: React.MouseEvent<HTMLDivElement>) {
    const currentTime = e.nativeEvent.offsetX * secondWidth();
    onTimelineChange(currentTime);
  }

  return (
    <Container>
      <Time>{currentTime}</Time>
      <TimelineDiv
        onClick={handleTimelineChange}
        ref={timelineRef}
        onMouseMove={(e) => {
          if (e.buttons) {
            handleTimelineChange(e);
          }
        }}
      />
      {parts.map(({ range, color, isHidden }, index) => {
        return (
          <ClipOverlay
            key={index}
            width={(range[1] - range[0]) / secondWidth()}
            x={range[0] / secondWidth()}
            bgColor={isHidden ? 'white' : color}
          >
            <ToggleVisibilityButton
              onClick={() => {
                // should use some unique id. index might change if clips are reordered or removed
                onToggleVisibilityClick(index);
              }}
            >
              {isHidden ? 'Show' : 'Hide'}
            </ToggleVisibilityButton>
          </ClipOverlay>
        );
      })}
      <TimeIndicator x={currentTimeX} />
    </Container>
  );
};

export default Timeline;
