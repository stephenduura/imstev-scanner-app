import { state } from '../shared/state.js';
import { elements, showView } from '../shared/ui.js';
import { supabase } from '../services/supabase.js';

export function showAuthViewForm(formName) {
  hideAuthError();
  if (formName === 'login') {
    elements.formLogin.style.display = 'flex';
    elements.formRegister.style.display = 'none';
    elements.formForgot.style.display = 'none';
  } else if (formName === 'register') {
    elements.formLogin.style.display = 'none';
    elements.formRegister.style.display = 'flex';
    elements.formForgot.style.display = 'none';
  } else if (formName === 'forgot') {
    elements.formLogin.style.display = 'none';
    elements.formRegister.style.display = 'none';
    elements.formForgot.style.display = 'flex';
  }
}

export function setButtonLoading(btn, isLoading, text) {
  if (btn) {
    btn.disabled = isLoading;
    btn.innerText = text;
  }
}

export function showAuthError(msg) {
  if (elements.authErrorMsg) {
    elements.authErrorMsg.innerText = msg;
    elements.authErrorMsg.style.display = 'block';
  }
}

export function hideAuthError() {
  if (elements.authErrorMsg) {
    elements.authErrorMsg.style.display = 'none';
  }
}

export async function handleLogin() {
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;

  if (!email || !password) {
    showAuthError("Please specify email and password.");
    return;
  }

  if (!supabase) {
    showAuthError("Authentication is currently offline (Supabase is not configured).");
    return;
  }

  setButtonLoading(elements.btnLogin, true, "Signing In...");
  hideAuthError();

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (e) {
    showAuthError(e.message);
    setButtonLoading(elements.btnLogin, false, "Sign In");
  }
}

export async function handleRegister() {
  const name = elements.registerName.value.trim();
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value;
  const confirm = elements.registerConfirmPassword.value;

  if (!name || !email || !password || !confirm) {
    showAuthError("Please fill in all registration fields.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showAuthError("Passwords do not match.");
    return;
  }

  if (!supabase) {
    showAuthError("Registration is currently offline (Supabase is not configured).");
    return;
  }

  setButtonLoading(elements.btnRegister, true, "Creating Account...");
  hideAuthError();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          profile: {
            name: name,
            age: "25-34",
            gender: "",
            baselineHair: "none",
            baselineSkin: "none"
          },
          scans: []
        }
      }
    });

    if (error) throw error;

    if (data.session) {
      alert("Registration successful! Welcome to Imstev.");
    } else {
      alert("Account registration initiated! Check your email inbox to confirm.");
      showAuthViewForm('login');
    }
  } catch (e) {
    showAuthError(e.message);
  } finally {
    setButtonLoading(elements.btnRegister, false, "Create Account");
  }
}

export async function handleForgot() {
  const email = elements.forgotEmail.value.trim();
  if (!email) {
    showAuthError("Please specify your email address.");
    return;
  }

  if (!supabase) {
    showAuthError("Password reset is currently offline (Supabase is not configured).");
    return;
  }

  setButtonLoading(elements.btnForgot, true, "Sending Reset Link...");
  hideAuthError();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    
    if (error) throw error;
    
    alert("Password reset instructions sent to your email!");
    showAuthViewForm('login');
  } catch (e) {
    showAuthError(e.message);
  } finally {
    setButtonLoading(elements.btnForgot, false, "Send Reset Link");
  }
}
