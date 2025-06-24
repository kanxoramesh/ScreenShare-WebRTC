import React from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

interface UsernameDialogProps {
  open: boolean;
  tempUsername: string;
  setTempUsername: (v: string) => void;
  onJoin: () => void;
}

export const UsernameDialog: React.FC<UsernameDialogProps> = ({ open, tempUsername, setTempUsername, onJoin }) => (
  <Dialog open={open} disableEscapeKeyDown>
    <DialogTitle>Enter your username</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Username"
        fullWidth
        value={tempUsername}
        onChange={e => setTempUsername(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && tempUsername.trim()) {
            onJoin();
          }
        }}
      />
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onJoin}
        disabled={!tempUsername.trim()}
        variant="contained"
      >
        Join
      </Button>
    </DialogActions>
  </Dialog>
);
