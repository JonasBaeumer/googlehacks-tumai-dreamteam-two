import './style.css'
import { getFirebaseAuth, getFirebaseApp } from './modules/firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth'

const appRoot = document.querySelector<HTMLDivElement>('#app')!

appRoot.innerHTML = `
  <div>
    <h1>Firebase Auth Demo</h1>
    <div class="card" id="auth-card">
      <div id="auth-forms">
        <form id="register-form">
          <h3>Register</h3>
          <input id="reg-email" type="email" placeholder="Email" required />
          <input id="reg-password" type="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
        <form id="login-form">
          <h3>Login</h3>
          <input id="login-email" type="email" placeholder="Email" required />
          <input id="login-password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>
      <div id="authed" style="display:none;">
        <p id="user-info"></p>
        <button id="logout">Logout</button>
      </div>
      <p id="error" style="color:#e74c3c;"></p>
    </div>
  </div>
`

// Initialize Firebase (reads from environment via Vite, see modules/firebase.ts)
getFirebaseApp()
const auth = getFirebaseAuth()

const registerForm = document.getElementById('register-form') as HTMLFormElement
const regEmail = document.getElementById('reg-email') as HTMLInputElement
const regPassword = document.getElementById('reg-password') as HTMLInputElement

const loginForm = document.getElementById('login-form') as HTMLFormElement
const loginEmail = document.getElementById('login-email') as HTMLInputElement
const loginPassword = document.getElementById('login-password') as HTMLInputElement

const errorEl = document.getElementById('error') as HTMLParagraphElement
const authed = document.getElementById('authed') as HTMLDivElement
const authForms = document.getElementById('auth-forms') as HTMLDivElement
const userInfo = document.getElementById('user-info') as HTMLParagraphElement
const logoutBtn = document.getElementById('logout') as HTMLButtonElement

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  try {
    await createUserWithEmailAndPassword(auth, regEmail.value, regPassword.value)
  } catch (err: unknown) {
    errorEl.textContent = (err as Error).message
  }
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
  } catch (err: unknown) {
    errorEl.textContent = (err as Error).message
  }
})

logoutBtn.addEventListener('click', async () => {
  errorEl.textContent = ''
  try {
    await signOut(auth)
  } catch (err: unknown) {
    errorEl.textContent = (err as Error).message
  }
})

onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    authForms.style.display = 'none'
    authed.style.display = 'block'
    userInfo.textContent = `Signed in as ${user.email ?? user.uid}`
  } else {
    authForms.style.display = 'block'
    authed.style.display = 'none'
    userInfo.textContent = ''
  }
})
