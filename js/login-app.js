new Vue({
  el: '#app',
  data() {
    let savedUser = null;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          savedUser = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved user", e);
        }
      }
    }

    return {
      users: window.dataPengguna || [],
      email: '',
      password: '',
      loginError: '',
      showForgotPasswordBtn: false,
      loggedInUser: savedUser,
      greeting: '',
      showRegisterModal: false,
      showResetModal: false,
      resetEmail: '',
      resetEmailError: false,
      register: {
        nama: '',
        email: '',
        password: '',
        role: 'UPBJJ-UT',
        lokasi: ''
      },
      registerEmailError: false,
      alertActive: false,
      alertTitle: '',
      alertMessage: '',
      alertType: 'success',
      alertCallback: null
    };
  },
  mounted() {
    this.updateGreeting();
    setInterval(this.updateGreeting, 60000);
  },
  methods: {
    updateGreeting() {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 10) {
        this.greeting = "Selamat Pagi";
      } else if (hour >= 10 && hour < 15) {
        this.greeting = "Selamat Siang";
      } else if (hour >= 15 && hour < 18) {
        this.greeting = "Selamat Sore";
      } else {
        this.greeting = "Selamat Malam";
      }
    },
    handleLogin() {
      this.loginError = '';
      const emailQuery = this.email.trim();
      const passwordQuery = this.password;

      const user = this.users.find(
        u => u.email === emailQuery && u.password === passwordQuery
      );

      if (user) {
        this.loggedInUser = user;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.email = '';
        this.password = '';
        this.showForgotPasswordBtn = false;
        this.triggerAlert('Login Berhasil', `Selamat datang kembali, ${user.nama}!`, 'success');
      } else {
        this.loginError = 'Email atau password salah.';
        this.showForgotPasswordBtn = true;
        this.triggerAlert('Login Gagal', 'Email atau password salah.', 'error');
      }
    },
    handleLogout() {
      this.loggedInUser = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user');
      }
      this.triggerAlert('Logout', 'Anda telah keluar dari sistem.', 'success');
    },
    openResetModal() {
      this.resetEmail = '';
      this.resetEmailError = false;
      this.showResetModal = true;
    },
    handleResetPassword() {
      this.resetEmailError = false;
      const emailQuery = this.resetEmail.trim();

      const user = this.users.find(u => u.email === emailQuery);

      if (user) {
        this.triggerAlert('Reset Password', `Link reset password telah dikirim ke email: ${emailQuery}`, 'success');
        this.showResetModal = false;
      } else {
        this.resetEmailError = true;
      }
    },
    openRegisterModal() {
      this.register = {
        nama: '',
        email: '',
        password: '',
        role: 'UPBJJ-UT',
        lokasi: ''
      };
      this.registerEmailError = false;
      this.showRegisterModal = true;
    },
    handleRegister() {
      this.registerEmailError = false;
      const emailQuery = this.register.email.trim();

      const checkEmail = this.users.some(u => u.email.toLowerCase() === emailQuery.toLowerCase());

      if (checkEmail) {
        this.registerEmailError = true;
        return;
      }

      const newUser = {
        id: this.users.length + 1,
        nama: this.register.nama.trim(),
        email: emailQuery,
        password: this.register.password,
        role: this.register.role,
        lokasi: this.register.lokasi.trim()
      };

      this.users.push(newUser);
      if (window.dataPengguna) {
        window.dataPengguna.push(newUser);
      }

      this.showRegisterModal = false;
      this.triggerAlert('Registrasi Berhasil', `Registrasi berhasil! Silakan login menggunakan akun ${newUser.email}`, 'success');
    },
    triggerAlert(title, message, type = 'success', callback = null) {
      this.alertActive = true;
      this.alertTitle = title;
      this.alertMessage = message;
      this.alertType = type;
      this.alertCallback = callback;
    },
    closeAlert(confirmed) {
      this.alertActive = false;
      if (this.alertCallback) {
        this.alertCallback(confirmed);
      }
    }
  }
});
