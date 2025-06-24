import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface IncomingCallDialogProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({ open, onAccept, onReject }) => (
  <Dialog open={open}>
    <DialogTitle>Incoming Call</DialogTitle>
    <DialogContent>
      <Typography>Server is calling you. Please accept to start screen share.</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onReject} color="error">Reject</Button>
      <Button onClick={onAccept} color="primary" variant="contained">Accept</Button>
    </DialogActions>
  </Dialog>
);
