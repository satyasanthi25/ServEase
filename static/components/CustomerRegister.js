export default {
  data: () => ({
    user: {
      email: '',  
      username: '',  
      password: '',
      fullname: '',
      address: '',
      contact_no: '',
      pin_code: '',
    },
    error: '',
    validationErrors: {
      fullname: '',
      username: '',
      email: '',
      password: '',
      contact_no: '',
      pin_code: '',
      address: '',
    },
  }),
  methods: {
    validateForm() {
      let valid = true;
      this.error = ''; // Reset global error message
      // Reset individual validation errors
      Object.keys(this.validationErrors).forEach((key) => {
        this.validationErrors[key] = '';
      });

      // Fullname validation
      if (this.user.fullname === '') {
        this.validationErrors.fullname = 'Full Name is required.';
        valid = false;
      }

      // Username validation
      if (this.user.username === '') {
        this.validationErrors.username = 'Username is required.';
        valid = false;
      } else if (this.user.username.length < 4) {
        this.validationErrors.username = 'Username must be at least 4 characters long.';
        valid = false;
      }

      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.user.email === '') {
        this.validationErrors.email = 'Email is required.';
        valid = false;
      } else if (!emailPattern.test(this.user.email)) {
        this.validationErrors.email = 'Email is not valid.';
        valid = false;
      }

      // Password validation
      if (this.user.password === '') {
        this.validationErrors.password = 'Password is required.';
        valid = false;
      } else if (this.user.password.length < 6) {
        this.validationErrors.password = 'Password must be at least 6 characters long.';
        valid = false;
      }

      // Contact number validation
      const contactPattern = /^[0-9]{10}$/;
      if (this.user.contact_no === '') {
        this.validationErrors.contact_no = 'Contact Number is required.';
        valid = false;
      } else if (!contactPattern.test(this.user.contact_no)) {
        this.validationErrors.contact_no = 'Contact Number must be 10 digits long.';
        valid = false;
      }

      // Pincode validation
      const pinCodePattern = /^[0-9]{6}$/;
      if (this.user.pin_code === '') {
        this.validationErrors.pin_code = 'Pincode is required.';
        valid = false;
      } else if (!pinCodePattern.test(this.user.pin_code)) {
        this.validationErrors.pin_code = 'Pincode must be 6 digits long.';
        valid = false;
      }

      // Address validation
      if (this.user.address === '') {
        this.validationErrors.address = 'Address is required.';
        valid = false;
      }

      return valid;
    },
    async register() {
      if (this.validateForm()) {
        fetch('/customer-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.user),
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('auth-token', data.token);
              localStorage.setItem('role', data.role);
              this.$router.push({ path: '/user-login' });
            } else {
              this.error = data.message;
            }
          })
          .catch((err) => {
            this.error = 'An error occurred during registration.';
          });
      }
    },
  },
  template: `
    <div class="row">
        <div class="col-lg-6 pb-5" style="height:100vh;background:url('static/images/CR.jpg');background-size:cover;">
        </div>
        <div class="col-lg-6 d-flex align-items-center">
        <div class="row justify-content-center  w-100">
        <div class="col-lg-8">
            <div class="login-box p-5" style="background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">

                <h1 class="text-center mb-4" style="font-size: 2.5rem; font-weight: bold; color: #333; text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);">Customer Register</h1>

                <div class="alert alert-danger" v-if="error != ''">
                    {{ error }}
                </div>

                <div v-if="validationErrors.fullname" class="alert alert-danger">
                  {{ validationErrors.fullname }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Full Name</label>
                    <input type="text" v-model="user.fullname" class="form-control"style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.username" class="alert alert-danger">
                  {{ validationErrors.username }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Username</label>
                    <input type="text" v-model="user.username" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.email" class="alert alert-danger">
                  {{ validationErrors.email }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Email</label>
                    <input type="email" v-model="user.email" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.password" class="alert alert-danger">
                  {{ validationErrors.password }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Password</label>
                    <input type="password" v-model="user.password" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.contact_no" class="alert alert-danger">
                  {{ validationErrors.contact_no }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Contact Number</label>
                    <input type="contact_no" v-model="user.contact_no" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.pin_code" class="alert alert-danger">
                  {{ validationErrors.pin_code }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Pincode</label>
                    <input type="text" v-model="user.pin_code" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
                </div>

                <div v-if="validationErrors.address" class="alert alert-danger">
                  {{ validationErrors.address }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Address</label>
                    <textarea v-model="user.address" class="form-control" ></textarea>
                </div>

                <div class="form-group mt-4">
                    <button class="btn btn-dark btn-block w-100 py-2" @click="register"
                        style="background-color: #5A67D8; border:none; border-radius: 25px; font-size: 1.2rem; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); transition: all 0.3s ease;">
                        REGISTER
                    </button>
                </div>
                <p class="mb-0 mt-2">Already a member?</p>
                <div>
              <router-link to="/user-login" class="btn btn-outline-dark" 
                          style="text-decoration: none; color: #5A67D8; font-weight: bold;">Login</router-link>
            </div>       
            </div>
        </div>
        </div>
        </div>
    </div>
    `
};
