import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface LogsPanelProps {
  logs: string[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => (
  <Card sx={{ mt: 4 }}>
    <CardContent>
      <Typography variant="h6">Communication Logs</Typography>
      <Box className="logs" sx={{ maxHeight: 200, overflow: 'auto' }}>
        {logs.length === 0 ? (
          <Typography color="text.secondary">Waiting for messages...</Typography>
        ) : (
          <ul style={{ paddingLeft: 16 }}>
            {logs.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        )}
      </Box>
    </CardContent>
  </Card>
);
