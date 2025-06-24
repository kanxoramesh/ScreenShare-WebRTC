import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface ScreenSharePanelProps {
  screenSharing: boolean;
  approved: boolean;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
}

export const ScreenSharePanel: React.FC<ScreenSharePanelProps> = ({
  screenSharing,
  approved,
  startScreenShare,
  stopScreenShare,
  localVideoRef
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        Screen Share
      </Typography>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Button
          variant={screenSharing ? "contained" : "outlined"}
          color="primary"
          onClick={screenSharing ? stopScreenShare : startScreenShare}
          sx={{ mb: 2 }}
          disabled={!approved}
        >
          {screenSharing ? "Stop Screen Share" : "Start Screen Share"}
        </Button>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          style={{ width: 320, border: '1px solid #ccc', background: '#000', minHeight: 180 }}
        />
      </Box>
    </CardContent>
  </Card>
);
