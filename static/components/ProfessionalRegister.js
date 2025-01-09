export default {
    data: () => ({
        user: {
            role:'sp',
            email: '',
            fullname: '',
            username: '',
            password: '',
            service_name: '',
            experience_years: '',
            address: '',
            pin_code: '',
            contact_no: '',
            is_professional: true  // Set as true for professionals
        },
        error: ''
    }),
    methods: {
        validateForm() {
            // Check if all fields are filled
            if (!this.user.fullname || !this.user.username || !this.user.email || !this.user.password || 
                !this.user.service_name || !this.user.experience_years || !this.user.address || 
                !this.user.pin_code || !this.user.contact_no) {
                this.error = "All fields are required.";
                return false;
            }

            // Validate email format
            const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
            if (!emailPattern.test(this.user.email)) {
                this.error = "Invalid email format.";
                return false;
            }

            // Validate password length (at least 6 characters)
            if (this.user.password.length < 6) {
                this.error = "Password must be at least 6 characters.";
                return false;
            }

            // Validate experience (should be a number and non-negative)
            if (isNaN(this.user.experience_years) || this.user.experience_years < 0) {
                this.error = "Experience must be a valid non-negative number.";
                return false;
            }

            // Validate pin code (numeric and 6 characters)
            if (!/^\d{6}$/.test(this.user.pin_code)) {
                this.error = "Invalid pin code (must be 6 digits).";
                return false;
            }

            // Validate contact number (numeric and 10 digits)
            if (!/^\d{10}$/.test(this.user.contact_no)) {
                this.error = "Invalid contact number (must be 10 digits).";
                return false;
            }

            return true;  // Form is valid
        },

        async register() {
            // First validate the form
            if (!this.validateForm()) {
                return;
            }

            try {
                const response = await fetch('/sp-register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.user)
                });

                const data = await response.json();

                if (response.ok) {
                    // Registration successful
                    //localStorage.setItem('auth-token', data.token);
                    //localStorage.setItem('role', data.role);
                    this.$router.push({ path: '/pending-approval' });
                } else {
                    // Display the error message returned from the server
                    this.error = data.message || 'Registration failed.';
                }
            } catch (error) {
                // Handle network or unexpected errors
                this.error = 'An error occurred during registration.';
            }
        }
    },

    template: `
    <div class="row">
        <div class="col-lg-6 pb-5" style="height:100vh;background:url('static/images/4.jpg');background-size:cover;">
        </div>
        <div class="col-lg-6 d-flex align-items-center">
        <div class="row justify-content-center w-100">
        <div class="col-lg-8">
            <div class="login-box p-5" style="background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">
                <h1 class="text-center mb-4" style="font-size: 2.5rem; font-weight: bold; color: #333; text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);">Professional Register</h1>
                <div class="alert alert-danger" v-if="error">
                    {{ error }}
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Full Name</label>
                    <input type="text" v-model="user.fullname" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">User Name</label>
                    <input type="text" v-model="user.username" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Email</label>
                    <input type="email" v-model="user.email" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Password</label>
                    <input type="password" v-model="user.password" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Service Name</label>
                    <select v-model="user.service_name" class="form-control">
                        <option value="">Select available services</option>
                        <option value="Plumbing Services">Plumbing Services</option>
                        <option value="Electrical Services">Electrical Services</option>
                        <option value="Carpentry Services">Carpentry Services</option>
                        <option value="House Cleaning Services">House Cleaning Services</option>
                        <option value="Salon Services">Salon Services</option>
                        <option value="Appliance Repair Services">Appliance Repair Services</option>
                        <option value="Home Tutoring Services">Home Tutoring Services</option>
                        <option value="Laundry and Dry Cleaning Services">Laundry and Dry Cleaning Services</option>
                        <option value="Gardening">Gardening</option>
                        <option value="Pet Care Services">Pet Care Services</option>
                        <option value="Home Health Care Services">Home Health Care Services</option>
                        <option value="Gardening and Landscaping Services">Gardening and Landscaping Services</option>
                        <option value="Pest Control Services">Pest Control Services</option>
                        <option value="Home Painting Services">Home Painting Services</option>
                        <option value="others">others</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Experience (in years)</label>
                    <input type="number" v-model="user.experience_years" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Address</label>
                    <textarea v-model="user.address" class="form-control"></textarea>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Pin Code</label>
                    <input type="text" v-model="user.pin_code" class="form-control" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Contact NO</label>
                    <input type="text" v-model="user.contact_no" class="form-control" />
                </div>
                
                <div class="form-group mb-3">
                    <label class="form-label" style="font-weight: bold;">Are you a professional?</label>
                    <input type="checkbox" v-model="user.is_professional" />
                </div>
                <div class="form-group mt-4">
                    <button class="btn btn-dark btn-block w-100 py-2" @click="register"
                            style="background-color: #5A67D8; border:none; border-radius: 25px; font-size: 1.2rem;">
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
