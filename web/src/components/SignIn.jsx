import { signInWithGoogle } from "../auth";

export default function SignIn() {
  return (
    <div className="signin-screen">
      <div className="signin-card">
        <h1>Kaizen</h1>
        <p>Haz seguimiento de tus acciones y decisiones diarias.</p>
        <button className="btn btn-primary" onClick={signInWithGoogle}>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}
