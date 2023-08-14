import "./App.css";
import { Download } from "./Download";
import { SnackbarProvider } from "notistack";
import { Input } from "./Input";
import PasswordDialog from "./PasswordDialog";

function App() {
  return (
    <SnackbarProvider
      autoHideDuration={3000}
      variant="error"
      className="snackbar"
    >
      <PasswordDialog />
      <Input />
      <Download />
    </SnackbarProvider>
  );
}

export default App;
