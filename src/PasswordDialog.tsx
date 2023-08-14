import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
} from "@mui/material";
import { useState } from "react";
import { googleUrl } from "./data";

export default function FormDialog() {
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(
    () =>
      localStorage.getItem("password") === null ||
      localStorage.getItem("password") === "invalid"
  );
  const savePassword = () => {
    localStorage.setItem("password", password);
    setOpen(
      localStorage.getItem("password") === null ||
        localStorage.getItem("password") === "invalid"
    );
    checkPassword();
  };

  async function checkPassword() {
    try {
      const res = await fetch(googleUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "checkpw",
          data: {},
          password: localStorage.getItem("password") || "",
        }),
      });
      if (res.status !== 200) {
        if (res.status === 403) {
          localStorage.setItem("password", "invalid");
          window.location.reload();
        }
        throw new Error(res.status.toString() + " - " + res.statusText);
      }
    } catch (e: any) {
      console.log(e);
    }
  }

  return (
    <div>
      <Dialog open={open}>
        <DialogTitle>Passwort eingeben</DialogTitle>
        <DialogContent>
          {localStorage.getItem("password") === "invalid" && (
            <DialogContentText>
              Das Passwort war leider inkorrekt.
            </DialogContentText>
          )}
          <TextField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            margin="dense"
            onKeyDown={(e) => {
              if (e.key === "Enter") savePassword();
            }}
            type="password"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={savePassword}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
